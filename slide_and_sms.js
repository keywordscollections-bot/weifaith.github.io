const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  await page.goto("https://www.zhihu.com/signin?next=%2F", { timeout: 15000, waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 2000));
  
  // 填手机号
  await page.locator("input[name=username]").fill("18207553134");
  
  // 先试短信
  await page.getByRole("button", { name: "获取短信验证码", exact: true }).click();
  console.log("点击短信验证码");
  await new Promise(r => setTimeout(r, 1500));
  
  // 检查是否弹出滑块
  const hasSlider = await page.evaluate(() => {
    const slider = document.querySelector(".yidun_slider");
    return {
      hasSlider: !!slider,
      visible: slider ? slider.offsetParent !== null : false,
      tip: document.querySelector(".yidun_tips__text")?.textContent
    };
  });
  console.log("滑块检查:", JSON.stringify(hasSlider));
  
  if (hasSlider.hasSlider && hasSlider.visible) {
    console.log("需要过滑块验证码...");
    
    // 获取背景图
    const bgSrc = await page.evaluate(() => {
      return document.querySelector(".yidun_bg-img")?.src;
    });
    
    if (!bgSrc) {
      console.log("无背景图，刷新");
      await page.locator(".yidun_refresh").click();
      await new Promise(r => setTimeout(r, 2000));
    }
    
    // 分析缺口位置
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
          const w = img.width, h = img.height;
          
          // 改进的缺口检测算法
          // 网易易盾：缺口右侧边缘有明显的亮度变化
          // 缺口挖空区域比周围暗，左侧边缘有阴影
          
          let bestX = 0;
          let bestScore = 0;
          
          // 用滑动窗口找左右梯度差异最大的区域
          for (let x = 60; x < w - 10; x++) {
            let leftEdgeScore = 0;
            let rightEdgeScore = 0;
            
            for (let y = 10; y < h - 10; y += 2) {
              const idx = (y * w + x) * 4;
              const idxL = (y * w + (x - 3)) * 4;
              const idxR = (y * w + (x + 3)) * 4;
              const idxLL = (y * w + (x - 6)) * 4;
              const idxRR = (y * w + (x + 6)) * 4;
              
              // 缺口左边缘: 左侧亮度高，右侧亮度低（挖空区域）
              const gradLeft = Math.abs(data[idx] - data[idxL]) + Math.abs(data[idx+1] - data[idxL+1]) + Math.abs(data[idx+2] - data[idxL+2]);
              const gradFarLeft = Math.abs(data[idxL] - data[idxLL]) + Math.abs(data[idxL+1] - data[idxLL+1]) + Math.abs(data[idxL+2] - data[idxLL+2]);
              
              if (gradLeft > 20 && gradFarLeft < 15) {
                leftEdgeScore += gradLeft;
              }
              
              // 缺口右边缘: 左侧暗，右侧亮
              const gradRight = Math.abs(data[idxR] - data[idx]) + Math.abs(data[idxR+1] - data[idx+1]) + Math.abs(data[idxR+2] - data[idx+2]);
              const gradFarRight = Math.abs(data[idxRR] - data[idxR]) + Math.abs(data[idxRR+1] - data[idxR+1]) + Math.abs(data[idxRR+2] - data[idxR+2]);
              
              if (gradRight > 20 && gradFarRight < 15) {
                rightEdgeScore += gradRight;
              }
            }
            
            const totalScore = leftEdgeScore + rightEdgeScore;
            if (totalScore > bestScore) {
              bestScore = totalScore;
              bestX = x;
            }
          }
          
          resolve({ gapLeft: bestX, bestScore, imgWidth: w });
        };
        img.src = src;
      });
    }, bgSrc);
    
    console.log("缺口分析:", JSON.stringify(gapInfo));
    
    if (gapInfo && gapInfo.gapLeft > 40) {
      // 获取滑块位置
      const sliderBox = await page.locator(".yidun_slider").boundingBox();
      console.log("滑块位置:", sliderBox);
      
      if (sliderBox) {
        const startX = sliderBox.x + sliderBox.width / 2;
        const startY = sliderBox.y + sliderBox.height / 2;
        const distance = gapInfo.gapLeft;
        
        console.log(`拖动起点:(${startX},${startY}) 距离:${distance}px`);
        
        // 执行拖动
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        
        // 用更自然的拖动轨迹
        const steps = 50;
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          // 贝塞尔缓动
          const eased = t < 0.3 ? Math.pow(t / 0.3, 2) * 0.3 : 
                        t < 0.8 ? 0.3 + (t - 0.3) / 0.5 * 0.5 :
                        0.8 + Math.pow((t - 0.8) / 0.2, 0.5) * 0.2;
          
          const moveX = startX + distance * Math.min(eased, 1);
          const moveY = startY + Math.sin(t * Math.PI * 3) * 0.5;
          
          await page.mouse.move(moveX, moveY);
          await new Promise(r => setTimeout(r, 5 + Math.random() * 10));
        }
        
        await page.mouse.move(startX + distance, startY);
        await page.mouse.up();
        console.log("滑块拖动完成");
        
        await new Promise(r => setTimeout(r, 3000));
      }
    }
    
    // 检查结果
    const check = await page.evaluate(() => {
      return {
        stillHasCaptcha: !!document.querySelector(".yidun_slider")?.offsetParent,
        tip: document.querySelector(".yidun_tips__text")?.textContent
      };
    });
    console.log("验证结果:", JSON.stringify(check));
  }
  
  // 尝试再次发送短信
  console.log("再次发送短信验证码...");
  await page.getByRole("button", { name: "获取短信验证码", exact: true }).click();
  await new Promise(r => setTimeout(r, 2000));
  
  const finalStatus = await page.evaluate(() => {
    return {
      url: window.location.href,
      preview: document.body.innerText.substring(200, 500)
    };
  });
  console.log("最终状态:", JSON.stringify(finalStatus));
  
  console.log("\n✅ 请查看手机 18207553134 的短信验证码！");
  
  await browser.close();
})();
