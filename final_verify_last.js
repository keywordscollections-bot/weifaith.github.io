const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  await page.goto("https://zhuanlan.zhihu.com/p/2046350072238044473", { timeout: 10000 });
  await new Promise(r => setTimeout(r, 4000));
  
  const text = await page.evaluate(() => {
    const el = document.querySelector(".Post-RichText, .RichText") || document.body;
    return el.innerText;
  });
  
  if (text.includes("你似乎来到了没有知识存在的荒原")) {
    console.log("❌ 404 - 文章不存在或内容为空");
    await browser.close();
    return;
  }
  
  console.log("=== 完整文章 ===");
  console.log(text);
  console.log("\n=== 检查 ===");
  console.log("总字符:", text.length);
  console.log("首段重复:", (text.match(/2025年，GEO还只是一个少数人关注的概念/g) || []).length, "次");
  console.log("微信:", text.includes("微信号"));
  console.log("乱码:", (text.match(/[^\x00-\x7F\u4e00-\u9fff\u3000-\u303f\uff00-\uffef\.,;:!?\-'"()\[\]{}\s\d+]/g) || []).length > 0 ? "有" : "无");
  
  await browser.close();
})();
