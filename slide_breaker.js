const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  // 去登录页
  await page.goto("https://www.zhihu.com/signin?next=%2F", { timeout: 15000, waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 2000));
  
  // 填手机号
  await page.locator("input[name=username]").fill("18207553134");
  
  // 用JS点击触发验证码
  await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      if (b.textContent.includes("获取短信验证码")) {
        b.click();
        return;
      }
    }
  });
  console.log("点击发送验证码");
  await new Promise(r => setTimeout(r, 2000));
  
  // 尝试最多10次滑块验证
  let verified = false;
  
  for (let attempt = 0; attempt < 10 && !verified; attempt++) {
    console.log(`\n=== 尝试 ${attempt + 1}/10 ===`);
    
    // 检查是否还有滑块
    const hasSlider = await page.evaluate(() => {
      const slider = document.querySelector(".yidun_slider");
      return slider && slider.offsetParent !== null;
    });
    
    if (!hasSlider) {
      console.log("滑块已消失，验证可能已通过");
      verified = true;
      break;
    }
    
    // 获取背景图片URL
    const bgSrc = await page.evaluate(() => {
      const bg = document.querySelector(".yidun_bg-img");
      return bg ? bg.src : null;
    });
    
    if (!bgSrc) {
      console.log("无背景图，刷新并重试");
      await page.locator(".yidun_refresh").click();
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }
    
    console.log("分析缺口位置...");
    
    // 在浏览器中分析图片缺口
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
          const w = img.width;
          const h = img.height;
          
          // 增强的缺口检测
          // 网易易盾：缺口区域是半透明的挖空，周围有阴影
          // 缺口边缘左右两侧亮度差异显著
          
          // 策略：计算每个像素的"边缘可能性"
          // 缺口左边缘：左侧亮、右侧暗（挖空）-> 正梯度
          // 缺口右边缘：左侧暗、右侧亮 -> 负梯度
          
          let scores = [];
          
          for (let x = 50; x < w - 20; x++) {
            let leftEdgeScore = 0;
            let rightEdgeScore = 0;
            let count = 0;
            
            for (let y = 5; y < h - 5; y += 1) {
              const idxM = (y * w + x) * 4;
              const idxL = (y * w + (x - 4)) * 4;
              const idxR = (y * w + (x + 4)) * 4;
              const idxLL = (y * w + (x - 8)) * 4;
              const idxRR = (y * w + (x + 8)) * 4;
              
              // 左边缘：左侧(x-4)比右侧(x)亮，且左侧(x-8)与(x-4)相似
              const gradL = Math.abs(data[idxM] - data[idxL]) + Math.abs(data[idxM+1] - data[idxL+1]) + Math.abs(data[idxM+2] - data[idxL+2]);
              const gradLL = Math.abs(data[idxL] - data[idxLL]) + Math.abs(data[idxL+1] - data[idxLL+1]) + Math.abs(data[idxL+2] - data[idxLL+2]);
              
              if (gradL > 25 && gradLL < 12) {
                // 检查左侧是否比右侧亮
                const brightnessL = (data[idxL] + data[idxL+1] + data[idxL+2]) / 3;
                const brightnessM = (data[idxM] + data[idxM+1] + data[idxM+2]) / 3;
                if (brightnessL > brightnessM) {
                  leftEdgeScore += gradL;
                }
              }
              
              // 右边缘：右侧(x+4)比左侧(x)亮
              const gradR = Math.abs(data[idxR] - data[idxM]) + Math.abs(data[idxR+1] - data[idxM+1]) + Math.abs(data[idxR+2] - data[idxM+2]);
              const gradRR = Math.abs(data[idxRR] - data[idxR]) + Math.abs(data[idxRR+1] - data[idxR+1]) + Math.abs(data[idxRR+2] - data[idxR+2]);
              
              if (gradR > 25 && gradRR < 12) {
                const brightnessM2 = (data[idxM] + data[idxM+1] + data[idxM+2]) / 3;
                const brightnessR = (data[idxR] + data[idxR+1] + data[idxR+2]) / 3;
                if (brightnessR > brightnessM2) {
                  rightEdgeScore += gradR;
                }
              }
              
              count++;
            }
            
            scores.push({ x, left: leftEdgeScore, right: rightEdgeScore, total: leftEdgeScore + rightEdgeScore });
          }
          
          // 找总分数最高的位置（缺口中心区域）
          scores.sort((a, b) => b.total - a.total);
          
          // 取最高分位置，往左找左边缘
          const best = scores[0];
          
          // 在best.x附近向左找左边缘
          let gapLeft = best.x;
          for (let x = best.x; x >= Math.max(best.x - 20, 50); x--) {
            const s = scores.find(s => s.x === x);
            if (s && s.total > best.total * 0.5) {
              gapLeft = x;
            } else {
              break;
            }
          }
          
          // 网易易盾的拼图约60px宽，缺口左边缘就是拼图块左边缘需要到达的位置
          
          resolve({ 
            gapLeft, 
            gapRight: gapLeft + 60,
            bestX: best.x,
            bestScore: best.total,
            imgWidth: w, 
            imgHeight: h 
          });
        };
        img.onerror = () => resolve({ error: "图片加载失败" });
        img.src = src;
      });
    }, bgSrc);
    
    if (gapInfo.error) {
      console.log("图片分析失败:", gapInfo.error);
      await page.locator(".yidun_refresh").click();
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }
    
    console.log(`缺口位置: 左边缘=${gapInfo.gapLeft}, 分数=${gapInfo.bestScore.toFixed(0)}`);
    
    if (gapInfo.gapLeft < 45 || gapInfo.gapLeft > gapInfo.imgWidth - 30) {
      console.log(`缺口位置异常(${gapInfo.gapLeft}px)，刷新重试`);
      await page.locator(".yidun_refresh").click();
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }
    
    // 滑块
    const sliderBox = await page.locator(".yidun_slider").boundingBox();
    const trackBox = await page.locator(".yidun_control").boundingBox();
    
    if (!sliderBox || !trackBox) {
      console.log("找不到滑块或轨道");
      break;
    }
    
    console.log(`滑块: x=${sliderBox.x.toFixed(0)} y=${sliderBox.y.toFixed(0)} w=${sliderBox.width} h=${sliderBox.height}`);
    console.log(`轨道: x=${trackBox.x.toFixed(0)} y=${trackBox.y.toFixed(0)} w=${trackBox.width} h=${trackBox.height}`);
    
    // 计算需要移动的距离
    // 图片在轨道内，缺口位置 gapLeft 对应轨道上的位置
    // 图片宽度320px = 轨道宽度320px
    // 滑块左边缘初始在轨道左边缘
    // 需要滑动距离 = gapLeft（图片坐标→屏幕坐标 1:1）
    
    const distance = gapInfo.gapLeft;
    
    // 滑块中心点
    const startX = sliderBox.x + sliderBox.width / 2;
    const startY = sliderBox.y + sliderBox.height / 2;
    
    console.log(`拖动起点: (${startX.toFixed(0)}, ${startY.toFixed(0)})`);
    console.log(`目标距离: ${distance}px`);
    
    // 执行拖动 - 使用更自然的轨迹
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    
    // 使用随机化的拖动路径
    const totalDistance = distance;
    const maxSteps = 25 + Math.floor(Math.random() * 15);
    
    for (let step = 1; step <= maxSteps; step++) {
      const progress = step / maxSteps;
      
      // 起始慢，中间快，结尾慢
      let eased;
      if (progress < 0.1) {
        eased = 5 * progress * progress; // 慢启动
      } else if (progress < 0.85) {
        eased = 0.05 + 0.8 * (progress - 0.1) / 0.75; // 快速
      } else {
        // 慢停止
        const t = (progress - 0.85) / 0.15;
        eased = 0.85 + 0.15 * (1 - Math.pow(1 - t, 2));
      }
      
      const moveX = startX + totalDistance * Math.min(eased, 1);
      const moveY = startY + Math.sin(progress * Math.PI * 6) * 0.6;
      
      await page.mouse.move(moveX, moveY);
      await new Promise(r => setTimeout(r, 8 + Math.random() * 15));
    }
    
    // 精确校准
    await page.mouse.move(startX + totalDistance, startY);
    await new Promise(r => setTimeout(r, 50));
    
    await page.mouse.up();
    console.log("✅ 拖动完成");
    
    await new Promise(r => setTimeout(r, 3000));
    
    // 检查结果
    const result = await page.evaluate(() => {
      const tips = document.querySelector(".yidun_tips__text");
      const slider = document.querySelector(".yidun_slider");
      const stillVisible = slider && slider.offsetParent !== null;
      
      let tipText = "";
      if (tips) tipText = tips.textContent;
      
      return {
        passed: !stillVisible,
        tip: tipText,
        loggedIn: document.body.innerText.includes("消息")
      };
    });
    
    console.log(`结果: passed=${result.passed}, tip="${result.tip}"`);
    
    if (result.passed) {
      verified = true;
      console.log("🎉 滑块验证通过！");
    } else if (result.tip.includes("向右拖动")) {
      console.log("❌ 位置不准，重试");
    } else {
      console.log(`提示: ${result.tip}`);
    }
  }
  
  if (verified) {
    console.log("\n✅ 滑块通过！正在发送短信验证码...");
    
    // 点击发送短信验证码
    await page.evaluate(() => {
      const btns = document.querySelectorAll("button");
      for (const b of btns) {
        if (b.textContent.includes("获取短信验证码")) {
          b.click();
          return;
        }
      }
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    console.log("\n📱 短信验证码已发送到 18207553134！");
    console.log("请查看手机短信，输入收到的6位验证码。");
  } else {
    console.log("\n❌ 滑块验证多次失败");
  }
  
  await browser.close();
})();
