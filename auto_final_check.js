const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  await page.goto("https://zhuanlan.zhihu.com/p/2046339515598557912");
  await new Promise(r => setTimeout(r, 4000));
  
  const text = await page.evaluate(() => {
    const article = document.querySelector(".Post-RichText, .RichText, article") || document.body;
    return article.innerText.substring(0, 800);
  });
  
  console.log("=== 文章内容 ===");
  console.log(text);
  
  // 检查是否有图片
  const img = await page.evaluate(() => {
    const article = document.querySelector(".Post-RichText, .RichText, article");
    if (!article) return false;
    const imgs = article.querySelectorAll("img");
    return imgs.length;
  });
  console.log("\n文章内图片数:", img);
  
  await browser.close();
})();
