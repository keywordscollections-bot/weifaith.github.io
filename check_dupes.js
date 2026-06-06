const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  await page.goto("https://zhuanlan.zhihu.com/p/2046340832018567611");
  await new Promise(r => setTimeout(r, 4000));
  
  const fullText = await page.evaluate(() => {
    const el = document.querySelector(".Post-RichText, .RichText") || document.body;
    return el.innerText;
  });
  
  // 看看前500字和后500字有没有重复
  console.log("=== 前500字 ===");
  console.log(fullText.substring(0, 500));
  console.log("\n=== 中段500字 ===");
  console.log(fullText.substring(Math.floor(fullText.length/2) - 250, Math.floor(fullText.length/2) + 250));
  console.log("\n=== 后500字 ===");
  console.log(fullText.substring(Math.max(0, fullText.length - 500)));
  console.log("\n总长度:", fullText.length, "字符");
  
  await browser.close();
})();
