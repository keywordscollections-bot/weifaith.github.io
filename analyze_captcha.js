const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  // 去登录页，切换密码，填写，点击登录触发验证码
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
  
  // 截图
  await page.screenshot({ path: "yidun_captcha.png", fullPage: false });
  
  // 分析验证码界面
  const captchaUI = await page.evaluate(() => {
    const yidunEls = document.querySelectorAll("[class*=yidun]");
    const result = [];
    yidunEls.forEach(el => {
      const rect = el.getBoundingClientRect();
      result.push({
        tag: el.tagName,
        class: (el.className || "").substring(0, 50),
        text: (el.textContent || "").trim().substring(0, 30),
        rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
        visible: rect.width > 0 && rect.height > 0
      });
    });
    return result;
  });
  
  console.log("易盾元素:", JSON.stringify(captchaUI, null, 2));
  
  // 检查文字提示
  const textPrompt = await page.evaluate(() => {
    const tips = document.querySelectorAll(".yidun_tips, .yidun--tips, [class*=tip]");
    return Array.from(tips).map(t => t.textContent);
  });
  console.log("提示文字:", textPrompt);
  
  // 检查所有可见的图片元素
  const images = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("img, canvas, [class*=img]")).map(el => ({
      tag: el.tagName,
      class: (el.className || "").substring(0, 40),
      src: (el.src || "").substring(0, 80),
      rect: el.getBoundingClientRect()
    })).filter(i => i.rect.width > 0 && i.rect.height > 0);
  });
  console.log("图片/画布元素:", JSON.stringify(images, null, 2));
  
  await browser.close();
})();
