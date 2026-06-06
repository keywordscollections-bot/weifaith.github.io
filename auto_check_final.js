const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  
  // 打开文章页面看效果
  const page = await ctx.newPage();
  await page.goto("https://zhuanlan.zhihu.com/p/2046339515598557912");
  await new Promise(r => setTimeout(r, 3000));
  
  const content = await page.evaluate(() => {
    const article = document.querySelector(".Post-RichText, .RichText, article");
    return article ? article.textContent.substring(0, 500) : document.body.textContent.substring(0, 500);
  });
  console.log("文章内容预览:");
  console.log(content);
  console.log("\n--- 末尾200字 ---");
  console.log(content.substring(Math.max(0, content.length - 200)));
  
  await browser.close();
})();
