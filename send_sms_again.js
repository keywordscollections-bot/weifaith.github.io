const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  // 重新加载登录页，确保干净状态
  await page.goto("https://www.zhihu.com/signin?next=%2F", { timeout: 15000, waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 2000));
  
  // 填手机号
  await page.locator("input[name=username]").fill("18207553134");
  
  // 点击获取短信验证码
  await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      if (b.textContent.includes("获取短信验证码")) {
        b.click();
        return;
      }
    }
  });
  console.log("已点击发送");
  await new Promise(r => setTimeout(r, 1500));
  
  // 检查是否有滑块
  const hasSlider = await page.evaluate(() => {
    const slider = document.querySelector(".yidun_slider");
    return slider && slider.offsetParent !== null;
  });
  
  if (hasSlider) {
    console.log("检测到滑块，开始破解...");
    
    for (let attempt = 0; attempt < 8; attempt++) {
      console.log(`\n--- 尝试 ${attempt + 1} ---`);
      
      // 获取背景图
      const bgSrc = await page.evaluate(() => document.querySelector(".yidun_bg-img")?.src);
      if (!bgSrc) {
        await page.locator(".yidun_refresh").click();
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      
      // 分析缺口（在浏览器内执行）
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
            
            const data = ctx.getImageData(0, 0, img.width, img.height).data;
            const w = img.width, h = img.height;
            
            // 改进：寻找水平方向上左右亮度差异最大的列
            // 缺口处：左边比右边亮很多（挖空区域的左边缘）
            let bestX = 0, bestScore = 0;
            
            for (let x = 55; x < w - 20; x++) {
              let score = 0;
              for (let y = 10; y < h - 10; y += 2) {
                const idx = (y * w + x) * 4;
                const idxL = (y * w + (x - 2)) * 4;
                const idxLL = (y * w + (x - 4)) * 4;
                
                // 缺口边缘特征：当前列(x)与左侧2px差异大，左侧2px与左侧4px差异小
                const diff = Math.abs(data[idx] - data[idxL]) + Math.abs(data[idx+1] - data[idxL+1]) + Math.abs(data[idx+2] - data[idxL+2]);
                const diff2 = Math.abs(data[idxL] - data[idxLL]) + Math.abs(data[idxL+1] - data[idxLL+1]) + Math.abs(data[idxL+2] - data[idxLL+2]);
                
                if (diff > 30 && diff2 < 10) score += diff;
              }
              
              if (score > bestScore) { bestScore = score; bestX = x; }
            }
            
            resolve({ gapLeft: bestX, score: bestScore, w });
          };
          img.src = src;
        });
      }, bgSrc);
      
      console.log(`缺口: x=${gapInfo.gapLeft}, 分数=${gapInfo.score.toFixed(0)}`);
      if (gapInfo.gapLeft < 50 || gapInfo.gapLeft > gapInfo.w - 30) {
        await page.locator(".yidun_refresh").click();
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }
      
      const slider = page.locator(".yidun_slider");
      const box = await slider.boundingBox();
      if (!box) break;
      
      const sx = box.x + box.width / 2;
      const sy = box.y + box.height / 2;
      const distance = gapInfo.gapLeft;
      
      // 拖动
      await page.mouse.move(sx, sy);
      await page.mouse.down();
      
      for (let i = 1; i <= 35; i++) {
        const t = i / 35;
        const eased = t < 0.15 ? 1.5 * t * t : 
                      t < 0.8 ? 0.03375 + 0.76625 * (t - 0.15) / 0.65 :
                      0.65 + 0.35 * Math.sin(t * Math.PI / 2);
        const x = sx + distance * Math.min(eased, 1);
        const y = sy + Math.sin(t * Math.PI * 3) * 0.8;
        await page.mouse.move(x, y);
        await new Promise(r => setTimeout(r, 6 + Math.random() * 10));
      }
      
      await page.mouse.move(sx + distance, sy);
      await page.mouse.up();
      
      await new Promise(r => setTimeout(r, 2500));
      
      const check = await page.evaluate(() => {
        const s = document.querySelector(".yidun_slider");
        return { passed: !s || s.offsetParent === null };
      });
      
      if (check.passed) { console.log("✅ 通过！"); break; }
    }
  }
  
  // 再点一次发送
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      if (b.textContent.includes("获取短信验证码")) {
        b.click();
        return;
      }
    }
  });
  
  console.log("\n📱 短信已再次发送到 18207553134！");
  
  // 保持页面打开，等用户输入验证码
  console.log("页面已准备好，请在下方输入验证码...");
  
  // 截图留底
  await page.screenshot({ path: "ready_for_code.png", fullPage: false });
  
  // 不关浏览器，轮询看用户是否跳转
  for (let i = 0; i < 300; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const url = page.url();
    if (!url.includes("signin")) {
      console.log(`\n✅ 已登录！当前页面: ${url}`);
      // 继续执行回答提交...
      break;
    }
    if (i % 15 === 0 && i > 0) {
      console.log(`等待中... (${i}s)`);
    }
  }
  
  await browser.close();
})();
