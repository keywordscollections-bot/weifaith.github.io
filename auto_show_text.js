const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes("write"));
  if (!page) { console.log("找不到"); await browser.close(); return; }
  
  // 看看发布按钮旁边还有什么
  const allText = await page.evaluate(() => {
    return document.body.innerText.replace(/\s+/g, " ").trim();
  });
  console.log("页面文本:", allText);
  await browser.close();
})();
