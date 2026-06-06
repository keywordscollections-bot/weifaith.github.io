const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  // 直接在搜索框输入"GEO"搜索问题
  await page.goto("https://www.zhihu.com/search?type=question&q=GEO");
  await new Promise(r => setTimeout(r, 5000));
  
  const text = await page.evaluate(() => {
    const allText = document.body.innerText;
    // 提取问题相关的行
    const lines = allText.split("\n");
    return lines.filter(l => l.includes("?") || l.includes("？")).slice(0, 20);
  });
  
  console.log("含问号的行:");
  text.forEach((t, i) => console.log(`  ${i+1}. ${t.substring(0, 80)}`));
  
  await browser.close();
})();
