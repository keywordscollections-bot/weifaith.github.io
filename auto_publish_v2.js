const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes("write"));
  if (!page) { console.log("找不到"); await browser.close(); return; }
  
  // 先关掉"插入链接"弹窗
  await page.evaluate(() => {
    // 点取消
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      if (b.textContent.trim() === "取消") {
        b.click();
        return;
      }
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  
  // 点发布
  await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      if (b.textContent.trim() === "发布") {
        b.click();
        return;
      }
    }
  });
  console.log("点了发布");
  await new Promise(r => setTimeout(r, 2000));
  
  // 看看有没有新的弹窗
  const dialogs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("[role=dialog]")).map(d => d.textContent.replace(/\s+/g, " ").trim().substring(0, 150));
  });
  console.log("弹窗:", dialogs);
  
  // 找确认按钮
  await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      const t = b.textContent.trim();
      if (t === "确定" || t === "确认" || t.includes("发布")) {
        if (b.offsetParent !== null) {
          b.click();
          console.log("点了:", t);
          return;
        }
      }
    }
  });
  await new Promise(r => setTimeout(r, 3000));
  
  console.log("URL:", page.url().substring(0, 100));
  
  await browser.close();
})();
