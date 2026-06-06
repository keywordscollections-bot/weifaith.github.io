const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  
  // 获取当前所有页面
  const pages = ctx.pages();
  console.log("当前页面数:", pages.length);
  pages.forEach((p, i) => console.log(`  ${i}. ${p.url().substring(0, 80)}`));
  
  // 如果已有知乎页面，直接用它
  let targetPage = pages.find(p => p.url().includes("zhihu.com"));
  
  if (!targetPage) {
    // 否则新建
    targetPage = await ctx.newPage();
    await targetPage.goto("https://www.zhihu.com/search?type=question&q=GEO", { timeout: 10000 });
    await new Promise(r => setTimeout(r, 4000));
  }
  
  console.log("使用页面:", targetPage.url().substring(0, 80));
  
  // 在当前页面搜索 GEO 相关的问题
  await targetPage.goto("https://www.zhihu.com/question/2020934662076265540", { timeout: 10000 });
  await new Promise(r => setTimeout(r, 4000));
  
  const title = await targetPage.evaluate(() => {
    return document.querySelector(".QuestionHeader-title")?.textContent?.trim();
  });
  console.log("当前问题:", title);
  
  await browser.close();
})();
