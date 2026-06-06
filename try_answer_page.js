const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  
  // 用一个已有的知乎页
  const page = ctx.pages().find(p => p.url().includes("zhihu.com") && !p.url().includes("write")) || ctx.pages()[0];
  
  // 直接导航到这个特定问题
  await page.goto("https://www.zhihu.com/question/2020934662076265540/answer/me", { waitUntil: "domcontentloaded", timeout: 15000 });
  await new Promise(r => setTimeout(r, 4000));
  
  const text = await page.evaluate(() => document.body.innerText.substring(0, 1000));
  console.log(text);
  
  await browser.close();
})();
