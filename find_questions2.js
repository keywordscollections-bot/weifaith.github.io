const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  // 搜索GEO相关的问题
  await page.goto("https://www.zhihu.com/search?type=question&q=GEO+%E7%94%B5%E5%95%86");
  await new Promise(r => setTimeout(r, 5000));
  
  const questions = await page.evaluate(() => {
    const links = document.querySelectorAll("a[href*='/question/']");
    const seen = new Set();
    const result = [];
    for (const a of links) {
      const href = a.href.split("?")[0];
      if (!seen.has(href) && !href.includes("/answer/")) {
        seen.add(href);
        result.push({
          title: a.textContent.trim().substring(0, 100),
          url: href
        });
      }
    }
    return result.slice(0, 15);
  });
  
  console.log("问题列表:");
  questions.forEach((q, i) => console.log(`  ${i+1}. ${q.title}\n     ${q.url}`));
  
  await browser.close();
})();
