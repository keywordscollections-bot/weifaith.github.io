const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes("write"));
  if (!page) { console.log("找不到"); await browser.close(); return; }
  
  // 检查发布按钮状态
  const pubInfo = await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      if (b.textContent.trim() === "发布") {
        return {
          disabled: b.disabled,
          visible: b.offsetParent !== null,
          rect: b.getBoundingClientRect(),
          text: b.textContent.trim(),
          cls: b.className
        };
      }
    }
    return null;
  });
  console.log("发布按钮:", JSON.stringify(pubInfo, null, 2));
  
  // 如果可用就点
  if (pubInfo && !pubInfo.disabled) {
    await page.mouse.click(pubInfo.rect.x + pubInfo.rect.width / 2, pubInfo.rect.y + pubInfo.rect.height / 2);
    console.log("点击发布");
    await new Promise(r => setTimeout(r, 3000));
  }
  
  // 再检查弹窗
  const dialogs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("[role=dialog], .Modal")).map(d => d.textContent.replace(/\s+/g, " ").trim().substring(0, 200));
  });
  console.log("弹窗:", dialogs);
  
  // 看确认按钮
  const confirmBtn = await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      if ((b.textContent.trim() === "确定" || b.textContent.trim() === "确认") && b.offsetParent !== null) {
        return { text: b.textContent.trim(), disabled: b.disabled, rect: b.getBoundingClientRect() };
      }
    }
    return null;
  });
  console.log("确认按钮:", JSON.stringify(confirmBtn));
  
  await browser.close();
})();
