const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  await page.goto("https://zhuanlan.zhihu.com/p/2046348575991506915");
  await new Promise(r => setTimeout(r, 4000));
  
  const text = await page.evaluate(() => {
    const el = document.querySelector(".Post-RichText, .RichText") || document.body;
    return el.innerText;
  });
  
  console.log("总字符:", text.length);
  
  // 检查是否还有重复（关键词出现次数）
  const firstPara = "2025年，GEO还只是一个少数人关注的概念";
  const count = (text.match(new RegExp(firstPara, "g")) || []).length;
  console.log(`首段重复次数: ${count}`);
  
  // 输出开头300字和结尾300字
  console.log("\n=== 开头 ===");
  console.log(text.substring(0, 300));
  console.log("\n=== 结尾 ===");
  console.log(text.substring(Math.max(0, text.length - 300)));
  
  // 检查包含
  console.log("\n趋势:", text.includes("趋势一") && text.includes("趋势五"));
  console.log("联系方式:", text.includes("微信"));
  
  await browser.close();
})();
