const { chromium } = require("playwright");
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
  
  // 更精确的缺口检测 - 网易易盾特征：缺口处有明显的亮度差异边界
  const gapX = await page.evaluate(async () => {
    const bg = document.querySelector(".yidun_bg-img");
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
        
        // 网易易盾缺口特征：
        // 1. 缺口处是一块被挖去的区域，周围有阴影
        // 2. 缺口边缘有明显的亮度突变
        
        // 方法：计算每列的垂直方向梯度变化
        let bestX = 0;
        let bestScore = 0;
        
        // 从40%位置开始扫描到90%
        for (let x = Math.floor(img.width * 0.3); x < img.width - 20; x++) {
          let totalGradient = 0;
          let count = 0;
          
          for (let y = 20; y < img.height - 20; y += 2) {
            const idx = (y * img.width + x) * 4;
            const r = data[idx], g = data[idx+1], b = data[idx+2];
            
            // 水平梯度（与左侧像素的差异）
            if (x > 5) {
              const idxL = (y * img.width + (x - 5)) * 4;
              const rL = data[idxL], gL = data[idxL+1], bL = data[idxL+2];
              const grad = Math.abs(r - rL) + Math.abs(g - gL) + Math.abs(b - bL);
              totalGradient += grad;
              count++;
            }
          }
          
          const avgGrad = count > 0 ? totalGradient / count : 0;
          
          // 缺口处水平梯度应该很大（明暗变化剧烈）
          if (avgGrad > bestScore) {
            bestScore = avgGrad;
            bestX = x;
          }
        }
        
        // 更精细地找到缺口边缘
        // 在bestX附近找缺口左边缘
        let gapLeft = bestX;
        for (let x = Math.max(bestX - 10, 0); x < bestX + 10; x++) {
          let edgeScore = 0;
          let edgeCount = 0;
          for (let y = 20; y < img.height - 20; y += 2) {
            const idx = (y * img.width + x) * 4;
            const idxP = (y * img.width + (x - 3)) * 4;
            const diff = Math.abs(data[idx] - data[idxP]) + Math.abs(data[idx+1] - data[idxP+1]) + Math.abs(data[idx+2] - data[idxP+2]);
            edgeScore += diff;
            edgeCount++;
          }
          const avgEdge = edgeScore / edgeCount;
          if (avgEdge > bestScore * 0.6) {
            gapLeft = x;
            break;
          }
        }
        
        // 网易易盾的拼图块宽度约60px
        // 拼图块的左边缘 = gapLeft
        // 拼图块的中心 ≈ gapLeft + 30
        // 滑块需要移动的距离 = gapLeft（因为拼图块初始在x=0）
        
        resolve({ gapLeft, bestX, bestScore, imgWidth: img.width, imgHeight: img.height });
      };
      img.src = bg.src;
    });
  });
  
  console.log("缺口检测:", JSON.stringify(gapX));
  
  // 获取滑块和轨道信息
  const sliderBox = await page.locator(".yidun_slider").boundingBox();
  const trackBox = await page.locator(".yidun_control").boundingBox();
  console.log("滑块:", sliderBox);
  console.log("轨道:", trackBox);
  
  // 对于网易易盾：
  // 背景图宽320px，在页面中也是320px宽
  // 拼图块初始位置在背景图容器的最左侧（x=0）
  // 滑块在轨道中从左到右移动
  // 需要将拼图块移动到缺口位置（gapLeft）
  // 移动距离 = gapLeft（因为拼图块从x=0开始）
  
  // 但是需要比例换算：图片内坐标 → 屏幕像素坐标
  // 图片宽度320px，容器宽度也是320px，所以1:1比例
  if (sliderBox && trackBox && gapX) {
    // 网易易盾中，拼图块从x=0移动到gapLeft位置
    // 滑块需要滑动的距离 ≈ gapLeft
    
    const distance = gapX.gapLeft;
    console.log(`需要移动距离: ${distance}px`);
    
    // 获取滑块中心
    const sx = sliderBox.x + sliderBox.width / 2;
    const sy = sliderBox.y + sliderBox.height / 2;
    
    // 模拟拖动 - 自然拖动轨迹
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    await new Promise(r => setTimeout(r, 100));
    
    // 人类拖动模式：先慢，再快，再慢
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      // ease-in-out cubic
      const eased = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      const x = sx + distance * eased;
      const y = sy + (Math.random() - 0.5) * 0.5; // 极小垂直抖动
      
      await page.mouse.move(x, y, { steps: 1 });
      await new Promise(r => setTimeout(r, 8 + Math.random() * 12));
    }
    
    // 最终校准
    await page.mouse.move(sx + distance, sy);
    await new Promise(r => setTimeout(r, 50));
    
    await page.mouse.up();
    console.log("拖动完成");
    
    await new Promise(r => setTimeout(r, 3000));
    
    const result = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const tips = document.querySelector(".yidun_tips__content");
      return {
        url: window.location.href,
        tip: tips ? tips.textContent : "no tip",
        hasCaptcha: bodyText.includes("请完成安全验证"),
        loggedIn: bodyText.includes("消息") || bodyText.includes("私信"),
        preview: bodyText.substring(300, 600)
      };
    });
    console.log("验证结果:", JSON.stringify(result));
  }
  
  await browser.close();
})();
