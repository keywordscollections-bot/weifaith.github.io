const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages().find(p => p.url().includes("zhihu.com/signin"));
  
  // 截个图看看验证码长什么样
  await page.screenshot({ path: "captcha_screenshot.png", fullPage: false });
  
  // 检查验证码
  const captchaInfo = await page.evaluate(() => {
    const iframes = document.querySelectorAll("iframe");
    const iframeInfo = Array.from(iframes).map(f => ({
      src: (f.src || "").substring(0, 100),
      visible: f.offsetParent !== null
    }));
    
    // 检查特定类名
    const potentialCaptchas = [];
    document.querySelectorAll("[class*=captcha], [class*=Captcha], [id*=captcha], [id*=Captcha]").forEach(el => {
      potentialCaptchas.push({
        tag: el.tagName,
        id: (el.id || "").substring(0, 30),
        className: (el.className || "").substring(0, 40),
        text: (el.textContent || "").substring(0, 80)
      });
    });
    
    return { iframes: iframeInfo, captchaElements: potentialCaptchas };
  });
  
  console.log("验证码信息:", JSON.stringify(captchaInfo, null, 2));
  
  await browser.close();
})();
