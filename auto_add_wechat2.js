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
  
  // 滚动到底部
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 1000));
  
  // 聚焦编辑器，插入联系方式
  await page.evaluate(() => {
    const editor = document.querySelector("[contenteditable=true]");
    if (!editor) return;
    editor.focus();
    
    // 移到末尾
    const sel = window.getSelection();
    const r = document.createRange();
    r.selectNodeContents(editor);
    r.collapse(false);
    sel.removeAllRanges();
    sel.addRange(r);
    
    // 插入空行
    document.execCommand("insertHTML", false, "<br><br>");
    
    // 用execCommand直接插入格式化的内容
    const content = "---<br>" +
      "如果你对GEO+跨境电商的实战策略感兴趣，欢迎加微信交流。我会持续分享最新的GEO动态和实操方法。<br>" +
      "微信号：xxxxxx（加微信备注 GEO跨境）<br>";
    
    document.execCommand("insertHTML", false, content);
  });
  console.log("✅ 联系方式已插入");
  await new Promise(r => setTimeout(r, 1000));
  
  // 找图片上传按钮
  await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      const html = b.innerHTML.toLowerCase();
      if (html.includes("image") || html.includes("picture")) {
        b.click();
        return;
      }
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  
  // 上传二维码
  const fileInput = await page.$("input[type=file]");
  if (fileInput) {
    await fileInput.setInputFiles(path.join(__dirname, "qr.jpg"));
    console.log("✅ 二维码已上传");
  }
  
  await new Promise(r => setTimeout(r, 2000));
  
  // 保存
  const saveResult = await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      const t = b.textContent.trim();
      if (t === "保存" || t === "保存修改" || t === "更新") {
        b.click();
        return t;
      }
    }
    return "no save btn";
  });
  console.log("保存:", saveResult);
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("✅ 完成");
  await browser.close();
})();
