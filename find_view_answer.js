const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  
  const page = ctx.pages().find(p => p.url().includes("search-question"));
  
  // 只查找包含"查看回答"的HTML片段
  const snippet = await page.evaluate(() => {
    const matches = document.body.innerHTML.match(/查看回答[^<]*<\/[^>]+>/g);
    return matches ? matches.slice(0, 5) : "无匹配";
  });
  
  console.log("查看回答匹配:", snippet);
  
  // 再试一次，这次用outerHTML
  const snippet2 = await page.evaluate(() => {
    const result = [];
    const walker = document.createTreeWalker(document.body, 4 /* SHOW_ELEMENT */, null, false);
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent.trim() === "查看回答" && node.children.length === 0) {
        result.push({
          tag: node.tagName,
          outerHTML: node.outerHTML.substring(0, 200)
        });
      }
    }
    return result;
  });
  
  console.log("\n深度匹配:", JSON.stringify(snippet2));
  
  await browser.close();
})();
