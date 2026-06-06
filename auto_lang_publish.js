const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes("write"));
  if (!page) { console.log("找不到"); await browser.close(); return; }
  
  // 选择语言
  await page.evaluate(() => {
    const inputs = document.querySelectorAll("input");
    for (const inp of inputs) {
      if (inp.placeholder && inp.placeholder.includes("语言")) {
        inp.click();
        return;
      }
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  
  // 看看是否有下拉选项
  const dropdowns = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("[role=listbox], [role=option], [class*=option], [class*=Option]")).map(d => d.textContent.trim().substring(0, 30));
  });
  console.log("下拉选项:", dropdowns);
  
  // 可能已经弹出了选择列表，找"中文"
  await page.evaluate(() => {
    const all = document.querySelectorAll("*");
    for (const el of all) {
      if (el.textContent.trim() === "中文" && el.offsetParent !== null) {
        el.click();
        console.log("选了中文");
        return;
      }
    }
  });
  await new Promise(r => setTimeout(r, 1500));
  
  // 检查发布按钮
  const pubStatus = await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      if (b.textContent.trim() === "发布") {
        return { disabled: b.disabled, text: b.textContent.trim() };
      }
    }
    return null;
  });
  console.log("发布按钮:", JSON.stringify(pubStatus));
  
  if (pubStatus && !pubStatus.disabled) {
    await page.evaluate(() => {
      const btns = document.querySelectorAll("button");
      for (const b of btns) {
        if (b.textContent.trim() === "发布") { b.click(); return; }
      }
    });
    console.log("✅ 点了发布");
    await new Promise(r => setTimeout(r, 3000));
  }
  
  console.log("URL:", page.url().substring(0, 100));
  await browser.close();
})();
