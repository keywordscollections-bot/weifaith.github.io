const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages().find(p => p.url().includes("zhihu.com/signin")) || await context.newPage();
  
  // 检查验证码类型
  const captchaInfo = await page.evaluate(() => {
    // 找所有带验证码/captcha的div或iframe
    const captchaEls = [];
    const allEls = document.querySelectorAll("*");
    for (const el of allEls) {
      const text = el.textContent.trim();
      const cls = el.className || "";
      const id = el.id || "";
      const tag = el.tagName;
      
      if (cls.includes("captcha") || cls.includes("Captcha") || id.includes("captcha") || id.includes("Captcha")) {
        captchaEls.push({ tag, id: id.substring(0, 30), class: cls.substring(0, 30), text: text.substring(0, 100) });
      }
    }
    
    // 找iframe
    const iframes = document.querySelectorAll("iframe");
    const iframeInfo = Array.from(iframes).map(f => ({
      src: f.src.substring(0, 80),
      id: f.id,
      visible: f.offsetParent !== null
    }));
    
    return {
      captchaEls,
      iframes: iframeInfo,
      bodyText: document.body.innerText.substring(0, 800)
    };
  });
  
  console.log("验证码信息:", JSON.stringify(captchaInfo, null, 2));
  
  await browser.close();
})();
