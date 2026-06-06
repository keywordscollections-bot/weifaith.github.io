const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  // 直接访问文章页（不带edit）
  await page.goto("https://zhuanlan.zhihu.com/p/2046348818992599380", { waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 4000));
  
  const url = page.url();
  console.log("当前URL:", url);
  
  // 如果在知乎首页（404），则说明发布有问题
  if (url.includes("zhihu.com") && !url.includes("/p/")) {
    console.log("❌ 文章404了，发布失败");
    await browser.close();
    return;
  }
  
  const text = await page.evaluate(() => {
    const el = document.querySelector(".Post-RichText, .RichText") || document.body;
    return el.innerText;
  });
  
  const firstPara = "2025年，GEO还只是一个少数人关注的概念";
  const count = (text.match(new RegExp(firstPara, "g")) || []).length;
  
  console.log("总字符:", text.length);
  console.log("首段重复:", count + "次");
  console.log("趋势都包含:", text.includes("趋势一") && text.includes("趋势五"));
  console.log("微信:", text.includes("微信"));
  
  if (count <= 1 && text.length > 1000) {
    console.log("\n✅✅✅ 发布成功，内容无重复！");
  } else if (text.length < 100) {
    console.log("\n❌ 内容太短，有问题");
  } else {
    console.log("\n⚠️ 有重复或内容异常");
  }
  
  await browser.close();
})();
