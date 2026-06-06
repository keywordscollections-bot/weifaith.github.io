const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  let page = ctx.pages().find(p => p.url().includes("/edit"));
  if (!page) {
    page = await ctx.newPage();
    await page.goto("https://zhuanlan.zhihu.com/p/2046339515598557912/edit");
    await new Promise(r => setTimeout(r, 4000));
  }
  
  const editorText = await page.evaluate(() => {
    const editor = document.querySelector("[contenteditable=true]");
    if (!editor) return "no editor";
    return editor.textContent;
  });
  console.log("=== 编辑器中内容 ===");
  console.log(editorText);
  console.log("\n总字符数:", editorText.length);
  
  await browser.close();
})();
