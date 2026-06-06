const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  
  const page = ctx.pages().find(p => p.url().includes("/answer/me"));
  if (page) {
    const text = await page.evaluate(() => document.body.innerText.substring(0, 2000));
    console.log("回答页内容:");
    console.log(text);
  }
  
  await browser.close();
})();
