const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  await page.goto("https://zhuanlan.zhihu.com/p/2046348220637487915");
  await new Promise(r => setTimeout(r, 4000));
  
  const text = await page.evaluate(() => {
    const el = document.querySelector(".Post-RichText, .RichText") || document.body;
    return el.innerText;
  });
  
  console.log("=== 全文 ===");
  console.log(text);
  console.log("\n=== 总字符:", text.length, "===");
  
  // 检查重复
  const first500 = text.substring(0, 500);
  const last500 = text.substring(Math.max(0, text.length - 500));
  const mid = text.substring(Math.floor(text.length/2) - 250, Math.floor(text.length/2) + 250);
  
  console.log("\n首500字:", first500.substring(0, 100) + "...");
  console.log("中段:", mid.substring(0, 100) + "...");
  console.log("尾500字:", last500.substring(0, 100) + "...");
  
  // 检查乱码
  const garbled = text.match(/[���]/g);
  console.log("\n乱码字符:", garbled ? garbled.length : 0);
  
  // 检查关键内容
  console.log("\n趋势一:", text.includes("趋势一"));
  console.log("趋势二:", text.includes("趋势二"));
  console.log("趋势三:", text.includes("趋势三"));
  console.log("趋势四:", text.includes("趋势四"));
  console.log("趋势五:", text.includes("趋势五"));
  
  await browser.close();
})();
