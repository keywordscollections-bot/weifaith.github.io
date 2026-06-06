const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes("write"));
  if (!page) { console.log("找不到"); await browser.close(); return; }
  
  // 看看编辑器里的实际内容
  const editorContent = await page.evaluate(() => {
    // 找可编辑区域
    const editable = document.querySelector("[contenteditable=true]");
    if (editable) {
      return {
        text: editable.textContent.substring(0, 200),
        innerHTML: editable.innerHTML.substring(0, 200),
        children: editable.children.length
      };
    }
    // 找textarea - 标题
    const titleArea = document.querySelector("textarea");
    return { titleArea: titleArea ? titleArea.value.substring(0, 100) : "no textarea" };
  });
  console.log("编辑器:", JSON.stringify(editorContent, null, 2));
  
  // 检查"选择语言"输入框附近
  const langInfo = await page.evaluate(() => {
    const inputs = document.querySelectorAll("input");
    for (const inp of inputs) {
      if (inp.placeholder && inp.placeholder.includes("语言")) {
        return {
          placeholder: inp.placeholder,
          value: inp.value,
          className: inp.className.substring(0, 60),
          parentHTML: inp.parentElement ? inp.parentElement.innerHTML.substring(0, 200) : ""
        };
      }
    }
    return null;
  });
  console.log("语言输入:", JSON.stringify(langInfo, null, 2));
  
  await browser.close();
})();
