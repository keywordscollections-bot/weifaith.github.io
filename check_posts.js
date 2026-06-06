const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  await page.goto("https://www.zhihu.com/people/self/posts");
  await new Promise(r => setTimeout(r, 4000));
  
  // 找到并删除那篇重复文章（删最新一篇）
  const posts = await page.evaluate(() => {
    const links = document.querySelectorAll("a[href*=\"/p/\"]");
    const results = [];
    for (const a of links) {
      const h = a.href;
      const text = a.textContent.trim().substring(0, 60);
      if (h.includes("/p/") && text) results.push({ href: h, text: text });
    }
    return results;
  });
  
  console.log("最近文章:");
  posts.slice(0, 10).forEach((p, i) => console.log(`  ${i+1}. ${p.text} -> ${p.href}`));
  
  await browser.close();
})();
