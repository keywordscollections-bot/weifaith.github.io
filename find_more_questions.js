const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  // 尝试另一个问题：看看有没有更多GEO相关的问题
  await page.goto("https://www.zhihu.com/search?type=question&q=%E5%95%86+%E5%A6%82%E4%BD%95%E5%81%9AGEO");
  await new Promise(r => setTimeout(r, 4000));
  
  // 获取页面上所有/question链接
  const questions = await page.evaluate(() => {
    const links = document.querySelectorAll("a");
    const seen = new Set();
    const result = [];
    for (const a of links) {
      const href = a.href.replace(/https:\/\/www\.zhihu\.com/, "").split("?")[0].split("#")[0];
      if (href.startsWith("/question/") && !href.includes("/answer/")) {
        if (!seen.has(href)) {
          seen.add(href);
          result.push({
            href: a.href.split("?")[0],
            text: a.textContent.trim().substring(0, 80)
          });
        }
      }
    }
    return result.slice(0, 20);
  });
  
  console.log("问题总数:", questions.length);

  // 过滤有意义的
  const filtered = questions.filter(q => q.text && q.text.length > 5 && !q.text.includes("关注") && !q.text.includes("回答") && !q.text.includes("赞同"));
  console.log("有效问题:");
  filtered.forEach((q, i) => console.log(`  ${i+1}. ${q.text}\n     ${q.href}`));
  
  await browser.close();
})();
