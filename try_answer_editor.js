const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  
  // 直接用创作中心 - 回答问题的API入口
  // 知乎的回答创建URL: https://www.zhihu.com/answer/editor?questionId=xxx
  
  const page = await ctx.newPage();
  await page.goto("https://www.zhihu.com/answer/editor?questionId=2020934662076265540", { timeout: 10000 });
  await new Promise(r => setTimeout(r, 5000));
  
  const text = await page.evaluate(() => document.body.innerText.substring(0, 1000));
  console.log("回答编辑器:", text.substring(0, 500));
  
  await browser.close();
})();
