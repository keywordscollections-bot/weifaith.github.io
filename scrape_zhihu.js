const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  // 1. 先爬热榜
  await page.goto("https://www.zhihu.com/hot", { timeout: 15000, waitUntil: "networkidle" });
  await new Promise(r => setTimeout(r, 2000));
  
  // 获取热榜问题
  const hotQuestions = await page.evaluate(() => {
    const items = document.querySelectorAll(".HotList-item, [class*=HotItem]");
    const results = [];
    items.forEach(item => {
      const titleEl = item.querySelector(".HotList-itemTitle, [class*=HotItem-title]");
      const linkEl = item.querySelector("a[href*='question']");
      const metricsEl = item.querySelector(".HotList-itemMetrics, [class*=HotItem-metrics]");
      if (titleEl) {
        results.push({
          title: titleEl.textContent.trim(),
          url: linkEl ? "https://www.zhihu.com" + linkEl.getAttribute("href") : "",
          metrics: metricsEl ? metricsEl.textContent.trim() : ""
        });
      }
    });
    return results;
  });
  
  console.log("热榜问题:");
  hotQuestions.forEach((q, i) => console.log(`  ${i+1}. ${q.title} [${q.metrics}]`));
  
  // 2. 找AI相关话题
  // 去话题广场搜索AI
  await page.goto("https://www.zhihu.com/topics/19551275/hot", { timeout: 15000, waitUntil: "domcontentloaded" }).catch(() => {});
  
  // 直接搜索AI
  await page.goto("https://www.zhihu.com/search?type=content&q=人工智能", { timeout: 15000, waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 2000));
  
  // 获取搜索结果
  const searchResults = await page.evaluate(() => {
    const items = document.querySelectorAll(".SearchResult-card, [class*=SearchItem]");
    const results = [];
    items.forEach(item => {
      const link = item.querySelector("a[href*='question']");
      if (link) {
        results.push({
          text: item.textContent.trim().substring(0, 150),
          url: link.href
        });
      }
    });
    return results;
  });
  
  console.log("\n搜索结果:");
  searchResults.slice(0, 10).forEach((r, i) => console.log(`  ${i+1}. ${r.text}`));
  
  await browser.close();
})();
