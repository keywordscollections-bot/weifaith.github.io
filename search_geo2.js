const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  // 直接打开知乎首页搜索
  await page.goto("https://www.zhihu.com/search?type=question&q=GEO+%E8%B7%A8%E5%A2%83%E7%94%B5%E5%95%86");
  await new Promise(r => setTimeout(r, 5000));
  
  const text = await page.evaluate(() => document.body.innerText.substring(0, 3000));
  console.log(text);
  
  await browser.close();
})();
