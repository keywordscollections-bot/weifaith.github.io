const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes("write"));
  if (!page) { console.log("找不到"); await browser.close(); return; }
  
  // 看看页面上有什么
  const html = await page.evaluate(() => {
    // 所有button
    const btns = Array.from(document.querySelectorAll("button"));
    return btns.map(b => ({
      text: b.textContent.trim().substring(0, 15),
      visible: b.offsetParent !== null
    })).filter(b => b.text);
  });
  console.log("当前按钮:");
  for (const b of html) console.log("  " + b.text + (b.visible ? "" : " (不可见)"));
  
  // 找"确定"或"确认发布"或"发布文章"的按钮
  const r2 = await page.evaluate(() => {
    const btns = document.querySelectorAll("button, [role=button]");
    for (const b of btns) {
      const txt = b.textContent.trim();
      if (txt.includes("确认") || txt.includes("确定") || txt.includes("发布文章")) {
        b.click();
        return "点击了: " + txt;
      }
    }
    return "未找到确认按钮";
  });
  console.log(r2);
  await new Promise(r => setTimeout(r, 2000));
  
  // 再按一次发布
  await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      if (b.textContent.trim() === "发布") { b.click(); return; }
    }
  });
  await new Promise(r => setTimeout(r, 3000));
  
  // 再看看弹窗
  await page.evaluate(() => {
    const dialogs = document.querySelectorAll('[role=dialog], .Modal, [class*=modal], [class*=Modal]');
    console.log("弹窗数:", dialogs.length);
    dialogs.forEach((d, i) => {
      const txt = d.textContent.substring(0, 100);
      console.log("  弹窗" + i + ":", txt);
    });
  });
  
  console.log("当前URL:", page.url().substring(0, 80));
  await browser.close();
})();
