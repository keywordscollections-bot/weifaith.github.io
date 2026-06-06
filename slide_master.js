const { chromium } = require("playwright");
const { createCanvas, loadImage } = require("canvas");

async function findGapPosition(imageUrl) {
  // 下载图片
  const img = await loadImage(imageUrl);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imageData.data;
  const w = img.width;
  const h = img.height;
  
  console.log(`图片大小: ${w}x${h}`);
  
  // 网易易盾的缺口特征：
  // 1. 缺口区域是被挖空的，比周围暗
  // 2. 缺口左边缘和右边缘有明显的亮度梯度变化
  // 3. 缺口位置通常在图片右侧40%-85%区域
  
  // 方法：计算每列的"异常"分数
  // 缺口处：水平梯度大（因为被挖空）
  
  let results = [];
  
  for (let x = 50; x < w - 15; x++) {
    let gradSum = 0;
    let count = 0;
    
    for (let y = 5; y < h - 5; y += 2) {
      const idx = (y * w + x) * 4;
      
      // 与左侧3px的差异度
      if (x >= 3) {
        const idxL = (y * w + (x - 3)) * 4;
        const dr = Math.abs(data[idx] - data[idxL]);
        const dg = Math.abs(data[idx+1] - data[idxL+1]);
        const db = Math.abs(data[idx+2] - data[idxL+2]);
        gradSum += dr + dg + db;
        count++;
      }
    }
    
    const avgGrad = count > 0 ? gradSum / count : 0;
    results.push({ x, grad: avgGrad });
  }
  
  // 排序找到梯度最大的列
  results.sort((a, b) => b.grad - a.grad);
  
  console.log("Top 10 梯度位置:");
  results.slice(0, 10).forEach(r => console.log(`  x=${r.x}, grad=${r.grad.toFixed(1)}`));
  
  // 缺口左边缘通常是最左边的显著梯度峰值
  // 找几个候选
  const candidates = results.filter(r => r.grad > results[0].grad * 0.6);
  const leftMost = Math.min(...candidates.map(c => c.x));
  
  console.log(`\n候选缺口左边缘: ${leftMost}`);
  
  // 网易易盾拼图宽度约55-65px，确认一下
  // 通常拼图左边缘在leftMost，缺口左边缘在leftMost-1到leftMost+3之间
  // 需要移动的距离 = 拼图左边缘在背景图中的位置
  
  // 更精确：找到最左侧的高梯度点作为左边缘
  let gapLeft = leftMost;
  
  // 检查leftMost左侧是否还有边缘
  for (let x = Math.max(leftMost - 8, 50); x < leftMost; x++) {
    const r = results.find(r => r.x === x);
    if (r && r.grad > results[0].grad * 0.4) {
      gapLeft = x;
    }
  }
  
  console.log(`最终缺口左边缘: ${gapLeft}`);
  
  return { gapLeft, imgWidth: w };
}

async function dragSlider(page, distance) {
  const slider = page.locator(".yidun_slider");
  const sliderBox = await slider.boundingBox();
  
  if (!sliderBox) {
    console.log("找不到滑块");
    return false;
  }
  
  const startX = sliderBox.x + sliderBox.width / 2;
  const startY = sliderBox.y + sliderBox.height / 2;
  
  console.log(`滑块起始: (${startX.toFixed(1)}, ${startY.toFixed(1)})`);
  console.log(`目标距离: ${distance}px`);
  
  // 模拟真实人类拖动
  await page.mouse.move(startX, startY);
  await new Promise(r => setTimeout(r, 100));
  await page.mouse.down();
  await new Promise(r => setTimeout(r, 50));
  
  // 分段推进，使用自然轨迹
  const segments = [
    { end: 0.05, steps: 3, delay: [15, 25] },   // 起始犹豫
    { end: 0.15, steps: 4, delay: [10, 20] },   // 慢速启动
    { end: 0.40, steps: 8, delay: [8, 15] },    // 加速
    { end: 0.70, steps: 10, delay: [5, 12] },   // 高速
    { end: 0.85, steps: 6, delay: [8, 15] },    // 减速
    { end: 0.95, steps: 5, delay: [12, 20] },   // 接近
    { end: 1.0, steps: 3, delay: [15, 30] },    // 微调
  ];
  
  let currentProgress = 0;
  
  for (const seg of segments) {
    for (let i = 0; i < seg.steps; i++) {
      const segProgress = (i + 1) / seg.steps;
      currentProgress = currentProgress === 0 
        ? seg.end * segProgress 
        : currentProgress + (seg.end - currentProgress) * segProgress;
      
      // 使用缓动函数让轨迹更真实
      const x = startX + distance * Math.min(currentProgress, 1);
      const y = startY + Math.sin(currentProgress * Math.PI * 4) * 0.8;
      
      await page.mouse.move(x, y);
      await new Promise(r => setTimeout(r, seg.delay[0] + Math.random() * (seg.delay[1] - seg.delay[0])));
    }
  }
  
  // 最终位置精确到达
  await page.mouse.move(startX + distance, startY);
  await new Promise(r => setTimeout(r, 80));
  
  await page.mouse.up();
  console.log("滑块拖动完成");
  
  return true;
}

(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  // 去登录页
  await page.goto("https://www.zhihu.com/signin?next=%2F", { timeout: 15000, waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 2000));
  
  // 填手机号
  await page.locator("input[name=username]").fill("18207553134");
  
  // 触发验证码 - 点击短信验证码
  const smsBtn = page.locator(".CountingDownButton, button:has-text(\"获取短信验证码\")");
  await smsBtn.click({ timeout: 5000 }).catch(() => {
    // 如果被遮罩挡住，用JS点击
    return page.evaluate(() => {
      const btns = document.querySelectorAll("button");
      for (const b of btns) {
        if (b.textContent.includes("获取短信验证码")) {
          b.click();
          return true;
        }
      }
      return false;
    });
  });
  console.log("点击发送验证码");
  await new Promise(r => setTimeout(r, 2000));
  
  // 检查滑块弹窗
  const sliderVisible = await page.evaluate(() => {
    const slider = document.querySelector(".yidun_slider");
    return slider ? slider.offsetParent !== null : false;
  });
  
  if (sliderVisible) {
    console.log("检测到滑块验证弹窗，开始处理...");
    
    // 最多尝试5次
    let success = false;
    for (let attempt = 0; attempt < 5 && !success; attempt++) {
      console.log(`\n--- 第 ${attempt + 1} 次尝试 ---`);
      
      // 获取背景图URL
      const bgSrc = await page.evaluate(() => {
        const bg = document.querySelector(".yidun_bg-img");
        return bg ? bg.src : null;
      });
      
      if (!bgSrc) {
        console.log("没有背景图，刷新");
        await page.locator(".yidun_refresh").click();
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      
      console.log("背景图:", bgSrc);
      
      // 用canvas分析缺口
      const gapInfo = await findGapPosition(bgSrc);
      console.log("缺口信息:", gapInfo);
      
      if (gapInfo.gapLeft < 45 || gapInfo.gapLeft > gapInfo.imgWidth - 30) {
        console.log("缺口位置异常，重试");
        await page.locator(".yidun_refresh").click();
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      
      // 网易易盾中，拼图块初始在背景图的x=0位置
      // 需要移动到 gapLeft 位置
      // 注意：图片容器是320px宽，图片也��320px���，1:1对应
      const distance = gapInfo.gapLeft;
      
      await dragSlider(page, distance);
      await new Promise(r => setTimeout(r, 2500));
      
      // 检查结果
      const check = await page.evaluate(() => {
        const tips = document.querySelector(".yidun_tips__text");
        const sliderEl = document.querySelector(".yidun_slider");
        return {
          tip: tips ? tips.textContent : "",
          sliderGone: !sliderEl || sliderEl.offsetParent === null,
          bodyPreview: document.body.innerText.substring(200, 500)
        };
      });
      console.log("验证结果:", JSON.stringify(check));
      
      if (check.sliderGone) {
        success = true;
        console.log("✅ 滑块验证通过！");
      } else {
        console.log("滑块未通过，重试...");
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    
    if (success) {
      console.log("\n✅ 滑块验证已通过！现在发送短信验证码...");
      
      // 再次点击发送短信
      await page.evaluate(() => {
        const btns = document.querySelectorAll("button");
        for (const b of btns) {
          if (b.textContent.includes("获取短信验证码")) {
            b.click();
            return;
          }
        }
      });
      console.log("✅ 请查看手机 18207553134 的短信验证码！");
    }
  }
  
  await new Promise(r => setTimeout(r, 2000));
  
  const finalStatus = await page.evaluate(() => ({
    url: window.location.href,
    preview: document.body.innerText.substring(200, 400)
  }));
  console.log("最终状态:", JSON.stringify(finalStatus));
  
  await browser.close();
})();
