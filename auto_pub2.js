const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes("write"));
  if (!page) { console.log("找不到"); await browser.close(); return; }
  
  console.log("标题:", await page.title());
  
  const btns = await page.$$("button");
  console.log("按钮总数:", btns.length);
  
  if (btns[32]) {
    console.log("发布按钮文本:", await btns[32].textContent());
    await btns[32].click();
    console.log("已点击发布");
    await new Promise(r => setTimeout(r, 3000));
    console.log("发布后URL:", page.url().substring(0, 80));
  } else {
    console.log("找不到发布按钮");
  }
  
  await browser.close();
})();
