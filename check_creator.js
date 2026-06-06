const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  
  // 使用创作中心
  const page = await ctx.newPage();
  await page.goto("https://www.zhihu.com/creator", { timeout: 10000 });
  await new Promise(r => setTimeout(r, 4000));
  
  const text = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log("创作中心:", text);
  
  // 看看有没有"写回答"的入口
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a")).map(a => ({
      text: a.textContent.trim().substring(0, 40),
      href: a.href.substring(0, 100)
    })).filter(a => a.text.length > 0).slice(0, 30);
  });
  
  console.log("链接:");
  links.forEach(l => console.log(`  "${l.text}" -> ${l.href}`));
  
  await browser.close();
})();
