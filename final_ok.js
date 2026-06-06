const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  await page.goto("https://zhuanlan.zhihu.com/p/2046349790787657885");
  await new Promise(r => setTimeout(r, 4000));
  
  const text = await page.evaluate(() => {
    const el = document.querySelector(".Post-RichText, .RichText") || document.body;
    return el.innerText;
  });
  
  console.log("=== 全文 ===");
  console.log(text);
  console.log("\n=== 统计 ===");
  console.log("总字符:", text.length);
  console.log("趋势一:", text.includes("趋势一"));
  console.log("趋势二:", text.includes("趋势二"));
  console.log("趋势三:", text.includes("趋势三"));
  console.log("趋势四:", text.includes("趋势四"));
  console.log("趋势五:", text.includes("趋势五"));
  console.log("微信:", text.includes("微信"));
  
  // 检查是否有乱码字符
  const garbled = text.match(/[^\x00-\x7F\u4e00-\u9fff\u3000-\u303f\uff00-\uffef\.,;:!?\-'"()\[\]{}\s\d+]/g);
  if (garbled) {
    console.log("可能乱码:", garbled.join("").substring(0, 20));
  } else {
    console.log("无乱码字符");
  }
  
  await browser.close();
})();
