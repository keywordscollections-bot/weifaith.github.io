const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  await page.goto("https://zhuanlan.zhihu.com/write");
  await new Promise(r => setTimeout(r, 3000));
  
  const initText = await page.evaluate(() => {
    const editor = document.querySelector("[contenteditable=true]");
    if (!editor) return "no editor";
    // 检查所有层级
    return {
      text: editor.textContent,
      innerHTML: editor.innerHTML.substring(0, 500),
      children: editor.children.length
    };
  });
  console.log("初始化编辑器:", JSON.stringify(initText, null, 2));
  
  // 看是不是有默认占位文本
  const hasPlaceholder = await page.evaluate(() => {
    const editor = document.querySelector("[contenteditable=true]");
    if (!editor) return false;
    const blocks = editor.querySelectorAll("[data-block], .DraftEditor-block, p");
    return blocks.length;
  });
  console.log("已有blocks:", hasPlaceholder);
  
  await browser.close();
})();
