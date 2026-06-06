const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes("zhihu.com/creator/featured-question"));
  
  // 在搜索框输入问题title
  await page.fill("input[placeholder*=\"搜索\"]", "为什么用SEO思路做GEO总失败");
  await new Promise(r => setTimeout(r, 3000));
  
  // 看搜索结果
  const results = await page.evaluate(() => {
    // 点击搜索结果
    const allLinks = document.querySelectorAll("a");
    for (const a of allLinks) {
      if (a.textContent.includes("SEO思路做GEO")) {
        return { found: true, text: a.textContent.trim().substring(0, 60), href: a.href };
      }
    }
    
    // 看看搜索面板
    const popover = document.querySelector(".Popover-content");
    return { found: false, popoverText: popover?.textContent?.substring(0, 300) || "无popover" };
  });
  
  console.log("搜索结果:", JSON.stringify(results));
  
  await browser.close();
})();
