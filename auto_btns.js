const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  let page = pages.find(p => p.url().includes("write"));
  if (!page) { console.log("找不到编辑器页面"); await browser.close(); return; }
  
  // 先看看编辑器里有什么按钮
  const buttons = await page.evaluate(() => {
    const all = document.querySelectorAll("button, [role=button], a");
    return Array.from(all).map((el, i) => ({
      idx: i,
      tag: el.tagName,
      text: (el.textContent || "").trim().substring(0, 20),
      cls: (el.className || "").substring(0, 30),
      html: el.innerHTML.substring(0, 60)
    }));
  });
  
  console.log("所有按钮:");
  for (const b of buttons) {
    if (b.html) console.log("  [" + b.idx + "] " + b.tag + " | " + b.text + " | " + b.cls + " | " + b.html);
  }
  
  await browser.close();
})();
