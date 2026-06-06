const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  // 直接打开之前创建的回答
  await page.goto("https://www.zhihu.com/question/2020934662076265540/answer/2044585251293464345", { 
    timeout: 15000, waitUntil: "domcontentloaded" 
  });
  await new Promise(r => setTimeout(r, 3000));
  
  const info = await page.evaluate(() => ({
    url: window.location.href,
    preview: document.body.innerText.substring(0, 500)
  }));
  
  console.log("回答页面:", JSON.stringify(info));
  
  await browser.close();
})();
