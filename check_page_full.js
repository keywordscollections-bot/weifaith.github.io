const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = ctx.pages()[0];
  
  // 看看页面上是否有"写回答"字样
  const allText = await page.evaluate(() => document.body.innerText);
  
  const lines = allText.split("\n").filter(l => l.includes("写回答") || l.includes("回答") || l.includes("GEO本质"));
  lines.forEach(l => console.log("->", l.substring(0, 100)));
  
  // 看看是否已经被登录信息挡住了
  const bodyHTML = await page.evaluate(() => document.body.innerHTML.substring(0, 5000));
  console.log("body前5000字符:");
  console.log(bodyHTML);
  
  await browser.close();
})();
