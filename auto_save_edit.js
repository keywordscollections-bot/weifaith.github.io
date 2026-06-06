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
  
  // 保存
  const btnInfo = await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    const results = [];
    for (const b of btns) {
      const t = b.textContent.trim();
      if (t === "保存" || t === "保存修改" || t === "更新" || t === "发布") {
        results.push({ text: t, disabled: b.disabled, visible: b.offsetParent !== null });
      }
    }
    return results;
  });
  console.log("按钮:", JSON.stringify(btnInfo));
  
  // 检查编辑器底部是否有我们添加的内容
  const editorEnd = await page.evaluate(() => {
    const editor = document.querySelector("[contenteditable=true]");
    if (!editor) return "no editor";
    const text = editor.textContent;
    return text.substring(Math.max(0, text.length - 300));
  });
  console.log("编辑器末尾:", editorEnd);
  
  // 尝试点击保存
  for (const btn of btnInfo) {
    if (btn.text === "保存" || btn.text === "保存修改" || btn.text === "更新") {
      if (!btn.disabled) {
        await page.evaluate((txt) => {
          const btns = document.querySelectorAll("button");
          for (const b of btns) {
            if (b.textContent.trim() === txt) { b.click(); return; }
          }
        }, btn.text);
        console.log("已点击:", btn.text);
        await new Promise(r => setTimeout(r, 2000));
        break;
      }
    }
  }
  
  console.log("✅ 完成");
  await browser.close();
})();
