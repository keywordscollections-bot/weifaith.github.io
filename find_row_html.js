const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  
  const page = ctx.pages().find(p => p.url().includes("search-question"));
  
  // 看看整个表格行
  const rowInfo = await page.evaluate(() => {
    // 问题标题链接在搜索结果中
    const divs = document.querySelectorAll("div");
    for (const d of divs) {
      if (d.textContent.includes("为什么用SEO思路做GEO总失败")) {
        return {
          className: d.className?.substring(0, 80),
          text: d.textContent.substring(0, 100)
        };
      }
    }
    return null;
  });
  
  console.log("问题容器:", JSON.stringify(rowInfo));
  
  // 找该行的"查看回答"
  const htmlSnippet = await page.evaluate(() => {
    const allDivs = document.querySelectorAll("div");
    for (const d of allDivs) {
      if (d.textContent.includes("为什么用SEO思路做GEO总失败") && d.textContent.includes("查看回答")) {
        return d.innerHTML.substring(0, 2000);
      }
    }
    return null;
  });
  
  console.log("\nHTML片段:");
  console.log(htmlSnippet);
  
  await browser.close();
})();
