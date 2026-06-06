const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  // 先重定向到文章页，不带edit
  await page.goto("https://zhuanlan.zhihu.com/p/2046348575991506915", { waitUntil: "networkidle" });
  await new Promise(r => setTimeout(r, 3000));
  
  const text = await page.evaluate(() => {
    const el = document.querySelector(".Post-RichText, .RichText") || document.body;
    return el.innerText;
  });
  
  console.log("总字符:", text.length);
  
  const firstPara = "2025年，GEO还只是一个少数人关注的概念";
  const count = (text.match(new RegExp(firstPara, "g")) || []).length;
  console.log(`首段重复次数: ${count}`);
  
  console.log("\n=== 前200字 ===");
  console.log(text.substring(0, 200));
  console.log("\n=== 后200字 ===");
  console.log(text.substring(Math.max(0, text.length - 200)));
  
  console.log("\n趋势一至五同时存在:", text.includes("趋势一") && text.includes("趋势五"));
  console.log("联系方式:", text.includes("微信"));
  
  await browser.close();
})();
