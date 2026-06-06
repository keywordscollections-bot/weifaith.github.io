const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  await page.goto("https://zhuanlan.zhihu.com/p/2046340832018567611");
  await new Promise(r => setTimeout(r, 5000));
  
  const fullText = await page.evaluate(() => {
    const article = document.querySelector(".Post-RichText, .RichText") || document.body;
    return article.innerText;
  });
  
  console.log(fullText);
  console.log("\n=== 总字符:", fullText.length, "===");
  
  // 检查是否包含关键段落
  console.log("包含'趋势一':", fullText.includes("趋势一"));
  console.log("包含'趋势二':", fullText.includes("趋势二"));
  console.log("包含'趋势三':", fullText.includes("趋势三"));
  console.log("包含'趋势四':", fullText.includes("趋势四"));
  console.log("包含'趋势五':", fullText.includes("趋势五"));
  console.log("包含'微信':", fullText.includes("微信"));
  console.log("包含'GEO跨境':", fullText.includes("GEO跨境"));
  console.log("包含'二维码':", fullText.includes("二维码"));
  
  await browser.close();
})();
