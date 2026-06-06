const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  await page.goto("https://zhuanlan.zhihu.com/p/2046349258438316851", { waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 4000));
  
  const url = page.url();
  console.log("URL:", url.substring(0, 90));
  if (!url.includes("/p/")) { console.log("❌ 404"); await browser.close(); return; }
  
  const text = await page.evaluate(() => {
    const el = document.querySelector(".Post-RichText, .RichText") || document.body;
    return el.innerText;
  });
  
  console.log("总字符:", text.length);
  
  const firstPara = "2025年，GEO还只是一个少数人关注的概念";
  const count = (text.match(new RegExp(firstPara.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
  console.log("首段重复:", count + "次");
  
  if (count <= 1 && text.length > 1000) {
    console.log("\n✅✅✅ 发布成功！无重复，内容完整！");
    console.log("开头:", text.substring(0, 120));
    console.log("结尾:", text.substring(Math.max(0, text.length - 100)));
  } else {
    console.log("情况:", text.substring(0, 200));
  }
  
  await browser.close();
})();
