const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  // 去登录页
  await page.goto("https://www.zhihu.com/signin?next=%2F", { timeout: 15000, waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 2000));
  
  // 切换到密码登录
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
  
  // 获取图片的src
  const imgSrc = await page.evaluate(() => {
    const bg = document.querySelector(".yidun_bg-img");
    return bg ? bg.src : null;
  });
  console.log("背景图:", imgSrc);
  
  // 下载背景图到本地进行分析
  if (imgSrc) {
    // 获取canvas方式处理 - 检查缺口位置
    // 网易易盾的滑块拼图，缺口在右侧，背景图是320x160
    // 拼图块宽度约60px，高度160px
    
    // 用canvas分析图片
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
          
          // 寻找缺口 - 网易易盾的缺口通常在右侧，寻找灰度差异最大的列
          // 缺口处的像素会有明显不同的灰度
          let maxDiff = 0;
          let gapColumn = 0;
          const threshold = 30;
          
          // 从右侧开始扫描（缺口在右侧）
          for (let x = Math.floor(img.width * 0.4); x < img.width - 10; x++) {
            let diffSum = 0;
            let sampleCount = 0;
            for (let y = 10; y < img.height - 10; y += 2) {
              const idx = (y * img.width + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              
              // 比较旁边列的亮度差
              if (x > 0) {
                const idx2 = (y * img.width + (x - 3)) * 4;
                const r2 = data[idx2];
                const g2 = data[idx2 + 1];
                const b2 = data[idx2 + 2];
                
                const diff = Math.abs(r - r2) + Math.abs(g - g2) + Math.abs(b - b2);
                diffSum += diff;
                sampleCount++;
              }
            }
            const avgDiff = diffSum / sampleCount;
            if (avgDiff > maxDiff) {
              maxDiff = avgDiff;
              gapColumn = x;
            }
          }
          
          resolve({ gapColumn, imgWidth: img.width, maxDiff });
        };
        img.src = bg.src;
      });
    });
    
    console.log("缺口分析结果:", JSON.stringify(gapX));
    
    // 计算需要移动的距离
    // 拼图在左侧起始位置x=304.5，滑块起始x=305.5
    // 拼图块起始x=304.5（在背景图容器内偏移为0）
    // 拼图块宽度60.75px
    // 缺口位置在背景图中的x坐标
    if (gapX && gapX.gapColumn > 0) {
      const sliderWidth = 40; // 滑块宽度
      const trackWidth = 320; // 轨道宽度
      const jigsawWidth = 60.75; // 拼图块宽度
      
      // 需要移动的距离 ≈ 缺口位置 - 拼图块起始偏移（拼图块在左侧的起始位置）
      // 网易易盾的滑块验证码中，拼图块初始在左侧（x=0），需要移动到缺口位置
      // 缺口中心位置 = gapColumn
      // 拼图块中心初始位置 = jigsawWidth / 2
      // 移动距离 = gapColumn - jigsawWidth / 2
      const gapPos = gapX.gapColumn;
      // 移动距离需要计算拼图块的左侧边到缺口左侧边的距离
      // 实际上拼图块初始就在x=0的位置（在背景图容器内）
      const distance = gapPos - 0; // 从0移动到gap位置
      
      console.log(`计算移动距离: ${distance}px (缺口在x=${gapPos})`);
      
      // 获取滑块位置
      const sliderBox = await page.locator(".yidun_slider").boundingBox();
      console.log("滑块位置:", sliderBox);
      
      if (sliderBox) {
        // 模拟拖动
        const startX = sliderBox.x + sliderBox.width / 2;
        const startY = sliderBox.y + sliderBox.height / 2;
        
        // 模拟人类拖动 - 有变速
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        
        // 分段拖动，模拟人类行为
        const steps = 30;
        for (let i = 1; i <= steps; i++) {
          const progress = i / steps;
          // 使用缓动函数让拖动看起来更自然
          const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
          const x = startX + distance * eased;
          const y = startY + Math.sin(progress * Math.PI * 2) * 2; // 轻微抖动
          await page.mouse.move(x, y);
          await new Promise(r => setTimeout(r, 10 + Math.random() * 15));
        }
        
        // 最终微调
        await page.mouse.move(startX + distance, startY);
        await new Promise(r => setTimeout(r, 100));
        
        await page.mouse.up();
        console.log("滑块拖动完成");
        
        // 等待验证结果
        await new Promise(r => setTimeout(r, 3000));
        
        const result = await page.evaluate(() => {
          const bodyText = document.body.innerText;
          const tips = document.querySelector(".yidun_tips__content");
          return {
            url: window.location.href,
            tip: tips ? tips.textContent : "no tip",
            preview: bodyText.substring(200, 500)
          };
        });
        console.log("验证结果:", JSON.stringify(result));
      }
    }
  }
  
  await browser.close();
})();
