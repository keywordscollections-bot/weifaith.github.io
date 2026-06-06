const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes("write"));
  if (!page) { console.log("找不到"); await browser.close(); return; }
  
  // 看看发布设置区域和所有可交互的元素
  const info = await page.evaluate(() => {
    // 找"发布设置"附近的内容
    const all = document.querySelectorAll("*");
    const results = [];
    for (const el of all) {
      if (el.children.length === 0 && el.textContent.trim() && el.offsetParent !== null) {
        results.push(el.textContent.trim().substring(0, 50));
      }
    }
    return results.filter((v, i, a) => a.indexOf(v) === i).slice(-30);
  });
  console.log("页面文本片段:", info);
  
  // 检查页面上是否有输入框或选择框
  const interactive = await page.evaluate(() => {
    const inputs = document.querySelectorAll("input:not([type=file]), select, textarea, [contenteditable]");
    return Array.from(inputs).map(i => ({
      tag: i.tagName,
      type: i.type,
      placeholder: i.placeholder || "",
      contenteditable: i.getAttribute("contenteditable") || ""
    }));
  });
  console.log("输入框:", interactive);
  
  // 检查右下角发布设置区域是否有下拉或选择
  const clickablePrompts = await page.evaluate(() => {
    const items = document.querySelectorAll('[class*="Setting"], [class*="setting"], [class*="publish"]');
    return Array.from(items).slice(0, 10).map(i => ({
      text: i.textContent.trim().substring(0, 40),
      tag: i.tagName
    }));
  });
  console.log("设置区域:", clickablePrompts);
  
  await browser.close();
})();
