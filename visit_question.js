const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  // 直接从搜索结果中看到的问题链接
  // "为什么用SEO思路做GEO总失败？应该怎么操作？" - 这个和GEO强相关
  await page.goto("https://www.zhihu.com/question/2020934662076265540");
  await new Promise(r => setTimeout(r, 5000));
  
  const info = await page.evaluate(() => {
    return {
      title: document.querySelector(".QuestionHeader-title")?.textContent?.trim(),
      url: window.location.href
    };
  });
  
  console.log("问题:", info.title);
  console.log("URL:", info.url);
  
  await browser.close();
})();
