const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes("write"));
  if (!page) { console.log("找不到"); await browser.close(); return; }
  
  // 看完整页面看发布设置
  const html = await page.evaluate(() => {
    // 找最右侧的发布设置区域
    const divs = document.querySelectorAll("div");
    for (const d of divs) {
      if (d.textContent.includes("发布设置") && d.offsetParent !== null) {
        return d.innerHTML.substring(0, 1000);
      }
    }
    return "未找到发布设置";
  });
  console.log(html);
  
  await browser.close();
})();
