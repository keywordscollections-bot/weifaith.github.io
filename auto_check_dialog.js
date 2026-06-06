const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes("write"));
  if (!page) { console.log("找不到"); await browser.close(); return; }
  
  // 看看弹窗内容
  const dialogHtml = await page.evaluate(() => {
    const dialogs = document.querySelectorAll('[role=dialog], div[class*=Modal], div[class*=modal]');
    return Array.from(dialogs).map((d, i) => ({
      idx: i,
      text: d.textContent.replace(/\s+/g, " ").trim().substring(0, 200),
      inner: d.innerHTML.substring(0, 300)
    }));
  });
  console.log("弹窗内容:");
  for (const d of dialogHtml) {
    console.log("--- 弹窗", d.idx, "---");
    console.log("文本:", d.text);
    console.log("HTML:", d.inner);
  }
  
  if (dialogHtml.length === 0) {
    console.log("没有弹窗，尝试点击发布");
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      if (b.textContent.trim() === "发布") {
        b.click();
        console.log("已点发布");
        break;
      }
    }
  }
  
  await browser.close();
})();
