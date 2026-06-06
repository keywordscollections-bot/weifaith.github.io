const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  
  // 找一个已有的页面打开新tab，搜索问题
  const page = await ctx.newPage();
  
  // 直接打开一个具体的问题页面 - 从搜索结果看有哪些问题
  // "跨境电商如何做GEO？" 这个问题看起来不错
  await page.goto("https://www.zhihu.com/search?type=question&q=%E8%B7%A8%E5%A2%83%E7%94%B5%E5%95%86+%E5%A6%82%E4%BD%95%E5%81%9AGEO");
  await new Promise(r => setTimeout(r, 5000));
  
  // 看看搜索结果中有哪些问题链接
  const questions = await page.evaluate(() => {
    const links = document.querySelectorAll("a[href*='/question/']");
    const seen = new Set();
    const result = [];
    for (const a of links) {
      const href = a.href.split("?")[0];
      if (!seen.has(href)) {
        seen.add(href);
        result.push({
          title: a.textContent.trim().substring(0, 80),
          url: href
        });
      }
    }
    return result.slice(0, 10);
  });
  
  console.log("找到的问题:");
  questions.forEach((q, i) => console.log(`  ${i+1}. ${q.title}\n     ${q.url}`));
  
  await browser.close();
})();
