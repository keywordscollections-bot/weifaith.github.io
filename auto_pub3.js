const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes("write"));
  if (!page) { console.log("找不到"); await browser.close(); return; }
  
  console.log("标题:", await page.title());
  
  // 用evaluate来找发布按钮
  const result = await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (let i = 0; i < btns.length; i++) {
      if (btns[i].textContent.trim() === "发布") {
        btns[i].click();
        return "找到了发布按钮, 索引=" + i;
      }
    }
    return "未找到发布按钮";
  });
  console.log(result);
  await new Promise(r => setTimeout(r, 3000));
  console.log("当前URL:", page.url().substring(0, 80));
  
  await browser.close();
})();
