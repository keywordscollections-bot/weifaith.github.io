const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  await page.goto("https://zhuanlan.zhihu.com/p/2046339515598557912");
  await new Promise(r => setTimeout(r, 5000));
  
  // 向下滚动触发懒加载
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 2000));
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 1000));
  
  // 再次获取全文
  const fullText = await page.evaluate(() => {
    const article = document.querySelector(".Post-RichText, .RichText, article") || document.body;
    // 获取全文长度
    return article.innerText.length + " 字符";
  });
  console.log("文章总长度:", fullText);
  
  // 完整获取
  const allText = await page.evaluate(() => {
    const article = document.querySelector(".Post-RichText, .RichText, article") || document.body;
    return article.innerText;
  });
  console.log("=== 完整文章内容 ===");
  console.log(allText);
  
  await browser.close();
})();
