const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  // 搜索更精确的问题
  await page.goto("https://www.zhihu.com/search?type=question&q=%E5%81%9AGEO+%E8%B7%A8%E5%A2%83");
  await new Promise(r => setTimeout(r, 5000));
  
  const questions = await page.evaluate(() => {
    const links = document.querySelectorAll("a[href*='/question/']");
    const seen = new Set();
    const result = [];
    for (const a of links) {
      const href = a.href.split("?")[0];
      if (!seen.has(href) && !href.includes("/answer/")) {
        seen.add(href);
        const text = a.textContent.trim().substring(0, 100);
        if (text) {
          result.push({ title: text, url: href });
        }
      }
    }
    return result.slice(0, 15);
  });
  
  console.log("问题列表:");
  questions.forEach((q, i) => console.log(`  ${i+1}. ${q.title}\n     ${q.url}`));
  
  // 如果没有，看看搜索页的body文字
  if (questions.length === 0) {
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 1500));
    console.log("\n页面内容:", bodyText);
  }
  
  await browser.close();
})();
