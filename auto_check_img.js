const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  let page = ctx.pages().find(p => p.url().includes("/edit"));
  if (!page) { console.log("no edit page"); await browser.close(); return; }
  
  const hasImage = await page.evaluate(() => {
    const editor = document.querySelector("[contenteditable=true]");
    if (!editor) return false;
    const imgs = editor.querySelectorAll("img");
    return imgs.length > 0;
  });
  console.log("编辑器中是否有图片:", hasImage);
  
  await browser.close();
})();
