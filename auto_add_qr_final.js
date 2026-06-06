const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  let page = ctx.pages().find(p => p.url().includes("/edit"));
  if (!page) {
    page = await ctx.newPage();
    await page.goto("https://zhuanlan.zhihu.com/p/2046339515598557912/edit");
    await new Promise(r => setTimeout(r, 4000));
  }
  
  // 滚动到底部，在联系方式后面插入二维码
  await page.evaluate(() => {
    const editor = document.querySelector("[contenteditable=true]");
    if (!editor) return;
    window.scrollTo(0, document.body.scrollHeight);
    editor.focus();
    const sel = window.getSelection();
    const r = document.createRange();
    r.selectNodeContents(editor);
    r.collapse(false);
    sel.removeAllRanges();
    sel.addRange(r);
  });
  await new Promise(r => setTimeout(r, 500));
  
  // 按回车到新行
  await page.keyboard.press("Enter");
  await new Promise(r => setTimeout(r, 300));
  
  // 点击工具条的图片按钮
  const clicked = await page.evaluate(() => {
    // 知乎编辑器通常有工具栏按钮带图片图标
    const allEls = document.querySelectorAll("[class*=\"toolbar\"] button, [class*=\"Toolbar\"] button, [data-tool]");
    for (const el of allEls) {
      const html = el.innerHTML.toLowerCase();
      if (html.includes("image") || html.includes("图")) {
        el.click();
        return "toolbar:" + html.substring(0, 50);
      }
    }
    return "not found";
  });
  console.log("点击结果:", clicked);
  await new Promise(r => setTimeout(r, 2000));
  
  // 查找所有 input[type=file]
  const inputs = await page.$$("input[type=file]");
  console.log("找到文件输入框:", inputs.length);
  
  for (const inp of inputs) {
    const visible = await inp.isVisible();
    console.log("  可见:", visible);
    if (visible) {
      await inp.setInputFiles("E:\\五年计划\\site\\qr.jpg");
      console.log("✅ 已上传文件");
      break;
    }
  }
  
  await new Promise(r => setTimeout(r, 3000));
  
  // 检查是否有图片了
  const hasImg = await page.evaluate(() => {
    const editor = document.querySelector("[contenteditable=true]");
    if (!editor) return false;
    const imgs = editor.querySelectorAll("img");
    return imgs.length;
  });
  console.log("编辑器图片数:", hasImg);
  
  // 发布更新
  await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      if (b.textContent.trim() === "发布") { b.click(); return; }
    }
  });
  console.log("✅ 已点击发布更新");
  await new Promise(r => setTimeout(r, 3000));
  
  const url = page.url();
  console.log("最终URL:", url.substring(0, 80));
  
  await browser.close();
})();
