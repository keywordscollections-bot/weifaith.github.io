const { chromium } = require("playwright");

// 更精确的网易易盾滑块检测
function findGap(bgData, imgWidth, imgHeight) {
  const data = bgData;
  
  // 网易易盾特征：缺口是挖空区域，边缘有深色阴影
  // 在320x160的图像中，缺口约60x160大小
  
  // 方法1：计算每列的水平梯度（左侧差异）
  let gradResults = [];
  
  for (let x = 30; x < imgWidth - 10; x++) {
    let totalGrad = 0;
    let count = 0;
    
    for (let y = 5; y < imgHeight - 5; y += 1) {
      const idx = (y * imgWidth + x) * 4;
      const idxL = (y * imgWidth + (x - 2)) * 4;
      
      const grad = Math.abs(data[idx] - data[idxL]) + 
                   Math.abs(data[idx+1] - data[idxL+1]) + 
                   Math.abs(data[idx+2] - data[idxL+2]);
      totalGrad += grad;
      count++;
    }
    
    gradResults.push({ x, avg: totalGrad / count });
  }
  
  // 找到梯度最大的区域（缺口左边缘）
  gradResults.sort((a, b) => b.avg - a.avg);
  
  console.log("top 5 gradients:", gradResults.slice(0, 5));
  
  // 取最高梯度位置
  const bestX = gradResults[0].x;
  
  // 缺口左边缘通常在bestX附近，找左侧最近的高梯度点作为边缘
  let gapLeft = bestX;
  for (let x = bestX - 5; x <= bestX + 5; x++) {
    if (x > 0 && gradResults.find(g => g.x === x)?.avg > gradResults[0].avg * 0.7) {
      gapLeft = x;
      break;
    }
  }
  
  // 确保gapLeft不要太小（拼图块不是在最左边）
  gapLeft = Math.max(gapLeft, 40);
  
  return { gapLeft, bestX, bestScore: gradResults[0].avg };
}

(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  // 去登录页
  await page.goto("https://www.zhihu.com/signin?next=%2F", { timeout: 15000, waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 2000));
  
  await page.evaluate(() => {
    const allEls = document.querySelectorAll("*");
    for (const el of allEls) {
      if (el.textContent.trim() === "密码登录" && el.offsetParent !== null && el.tagName !== "INPUT") {
        el.click();
        return;
      }
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  
  await page.locator("input[name=username]").fill("15001376727");
  await page.locator("input[name=password]").fill("Nc19940815");
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await new Promise(r => setTimeout(r, 3000));
  
  // 多次尝试，每次重刷验证码
  let success = false;
  
  for (let attempt = 0; attempt < 5 && !success; attempt++) {
    console.log(`\n--- 尝试 ${attempt + 1} ---`);
    
    // 获取背景图
    const bgSrc = await page.evaluate(() => {
      const bg = document.querySelector(".yidun_bg-img");
      return bg ? bg.src : null;
    });
    
    if (!bgSrc) {
      console.log("没有背景图，刷新验证码");
      await page.locator(".yidun_refresh").click();
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }
    
    console.log("背景图:", bgSrc);
    
    // 分析缺口
    const gapInfo = await page.evaluate(async (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const data = imageData.data;
          
          // 寻找缺口 - 网易易盾的缺口处有明显边缘
          let bestX = 0;
          let bestScore = 0;
          
          for (let x = 50; x < img.width - 15; x++) {
            let score = 0;
            
            for (let y = 5; y < img.height - 5; y += 2) {
              const idx = (y * img.width + x) * 4;
              const idxL = (y * img.width + (x - 3)) * 4;
              const idxLL = (y * img.width + (x - 5)) * 4;
              
              // 计算水平梯度
              const grad1 = Math.abs(data[idx] - data[idxL]) + Math.abs(data[idx+1] - data[idxL+1]) + Math.abs(data[idx+2] - data[idxL+2]);
              const grad2 = Math.abs(data[idxL] - data[idxLL]) + Math.abs(data[idxL+1] - data[idxLL+1]) + Math.abs(data[idxL+2] - data[idxLL+2]);
              
              // 缺口边缘：大梯度+和左侧的对比
              if (grad1 > 15 && grad2 < 10) {
                score += grad1;
              }
            }
            
            if (score > bestScore) {
              bestScore = score;
              bestX = x;
            }
          }
          
          resolve({ gapLeft: bestX, bestScore, imgWidth: img.width });
        };
        img.src = src;
      });
    }, bgSrc);
    
    console.log("缺口位置:", JSON.stringify(gapInfo));
    
    if (!gapInfo || gapInfo.gapLeft < 40) {
      console.log("缺口检测失败，重试");
      await page.locator(".yidun_refresh").click();
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }
    
    // 获取滑块位置
    const slider = page.locator(".yidun_slider");
    const sliderBox = await slider.boundingBox();
    
    if (!sliderBox) {
      console.log("找不到滑块");
      continue;
    }
    
    // 注意：网易易盾的滑块轨道宽度320px对应图片宽度320px
    // 图片内坐标（0-320）与屏幕坐标对应
    // 滑块起始x = sliderBox.x + sliderBox.width/2
    // 需要移动距离 = gapLeft（像素对应关系1:1）
    
    const startX = sliderBox.x + sliderBox.width / 2;
    const startY = sliderBox.y + sliderBox.height / 2;
    const distance = gapInfo.gapLeft;
    
    console.log(`滑块起始: (${startX}, ${startY}), 移动距离: ${distance}px`);
    
    // 拖动
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    
    // 模拟人类拖动 - 非匀速
    const totalSteps = 20 + Math.floor(Math.random() * 10);
    for (let i = 1; i <= totalSteps; i++) {
      const t = i / totalSteps;
      // 模拟加速减速
      let eased;
      if (t < 0.2) {
        eased = 1.5 * t * t; // 慢启动
      } else if (t < 0.7) {
        eased = 0.06 + 1.2 * (t - 0.2); // 加速
      } else {
        eased = 0.66 + 0.34 * (1 - Math.pow(1 - (t - 0.7) / 0.3, 2)); // 减速接近
      }
      
      const moveX = startX + distance * Math.min(eased, 1);
      await page.mouse.move(moveX, startY + (Math.random() - 0.5) * 2);
      await new Promise(r => setTimeout(r, 10 + Math.random() * 20));
    }
    
    // 微调
    await page.mouse.move(startX + distance, startY);
    await new Promise(r => setTimeout(r, 50));
    
    await page.mouse.up();
    console.log("拖动完成");
    
    await new Promise(r => setTimeout(r, 2000));
    
    // 检查结果
    const result = await page.evaluate(() => {
      const tips = document.querySelector(".yidun_tips__content");
      const tipText = tips ? tips.textContent : "";
      return {
        tip: tipText,
        stillHasCaptcha: document.body.innerText.includes("请完成安全验证"),
        loggedIn: document.body.innerText.includes("消息") || document.body.innerText.includes("私信")
      };
    });
    
    console.log("结果:", JSON.stringify(result));
    
    if (result.loggedIn) {
      success = true;
      console.log("✅ 登录成功！");
      break;
    }
    
    if (!result.stillHasCaptcha) {
      // 验证码通过了但可能还没登录？再等等
      await new Promise(r => setTimeout(r, 3000));
      const recheck = await page.evaluate(() => ({
        url: window.location.href,
        loggedIn: document.body.innerText.includes("消息")
      }));
      console.log("重检:", JSON.stringify(recheck));
      if (recheck.loggedIn) {
        success = true;
        break;
      }
    }
    
    // 刷新验证码重试
    await page.locator(".yidun_refresh").click();
    await new Promise(r => setTimeout(r, 2000));
  }
  
  if (success) {
    console.log("\n✅ 登录成功！");
  } else {
    console.log("\n❌ 所有尝试都失败");
  }
  
  await browser.close();
})();
