const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  await page.goto("https://www.zhihu.com/question/2020934662076265540", { timeout: 15000, waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 4000));
  
  const text = await page.evaluate(() => document.body.innerText);
  
  // 查找回答区域
  const answerSection = text.match(/为什么用SEO思路做GEO总失败[\s\S]{0,2000}/);
  if (answerSection) {
    console.log("问题及回答:");
    console.log(answerSection[0].substring(0, 1000));
  }
  
  // 看看有没有"GEO不是SEO的替代品"内容
  if (text.includes("GEO不是SEO的替代品")) {
    console.log("\n✅ 回答内容已找到！");
  } else if (text.includes("GEO数据挖掘")) {
    console.log("\n⚠️ 看到的是旧回答内容");
  } else {
    console.log("\n❌ 未找到回答内容");
    console.log("页面文本前300字符:", text.substring(0, 300));
  }
  
  await browser.close();
})();
