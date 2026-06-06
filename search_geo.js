const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  // 搜索知乎跨境GEO相关问题
  await page.goto("https://www.zhihu.com/search?type=content&q=%E8%B7%A8%E5%A2%83GEO");
  await new Promise(r => setTimeout(r, 5000));
  
  const results = await page.evaluate(() => {
    const items = document.querySelectorAll(".SearchResult-card, .SearchItem, [data-za-module]");
    const list = [];
    for (const item of items) {
      const link = item.querySelector("a[href*='/question/']");
      if (link) {
        list.push({
          title: link.textContent.trim().substring(0, 100),
          url: link.href
        });
      }
    }
    return list.slice(0, 15);
  });
  
  console.log("搜索\"跨境GEO\"结果:", results.length, "条");
  results.forEach((r, i) => console.log(`  ${i+1}. ${r.title}\n     ${r.url}`));
  
  await browser.close();
})();
