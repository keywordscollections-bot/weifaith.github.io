const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes("write"));
  if (!page) { console.log("找不到"); await browser.close(); return; }
  
  // 先把所有弹窗关掉 - 按Escape
  await page.keyboard.press("Escape");
  await new Promise(r => setTimeout(r, 500));
  await page.keyboard.press("Escape");
  await new Promise(r => setTimeout(r, 500));
  await page.keyboard.press("Escape");
  await new Promise(r => setTimeout(r, 500));
  
  // 点击发布按钮
  await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      if (b.textContent.trim() === "发布") {
        b.click();
        return;
      }
    }
  });
  console.log("点击了发布");
  await new Promise(r => setTimeout(r, 2000));
  
  // 看看弹窗
  const after = await page.evaluate(() => {
    const dialogs = document.querySelectorAll('[role=dialog], [class*=Modal]');
    return Array.from(dialogs).map(d => d.textContent.replace(/\s+/g, " ").trim().substring(0, 100));
  });
  console.log("当前弹窗:");
  for (const a of after) if (a) console.log("  [" + a + "]");
  
  // 如果有确认发布弹窗，点确认
  await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      const t = b.textContent.trim();
      if (t === "确定" || t === "确认" || t.includes("发布文章") || t.includes("确认发布")) {
        b.click();
        console.log("点击:", t);
        return;
      }
    }
  });
  await new Promise(r => setTimeout(r, 3000));
  
  console.log("最终URL:", page.url().substring(0, 100));
  
  await browser.close();
})();
