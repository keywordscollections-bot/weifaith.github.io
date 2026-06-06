const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  let page = ctx.pages().find(p => p.url().includes("/edit"));
  if (!page) {
    page = await ctx.newPage();
    await page.goto("https://zhuanlan.zhihu.com/p/2046339515598557912/edit");
    await new Promise(r => setTimeout(r, 3000));
  }
  
  // 滚动到底部
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 1000));
  
  // 聚焦编辑器并移到末尾
  await page.evaluate(() => {
    const editor = document.querySelector("[contenteditable=true]");
    if (!editor) return;
    editor.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  });
  await new Promise(r => setTimeout(r, 500));
  
  // 输入联系方式文字
  const wechatText = "如果你对GEO+跨境电商的实战策略感兴趣，欢迎加微信交流。我会持续分享最新的GEO动态和实操方法。";
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await new Promise(r => setTimeout(r, 200));
  await page.keyboard.type(wechatText, { delay: 10 });
  await page.keyboard.press("Enter");
  await new Promise(r => setTimeout(r, 200));
  await page.keyboard.type("微信号：xxxxxx（加微信备注 GEO跨境）", { delay: 10 });
  await page.keyboard.press("Enter");
  await new Promise(r => setTimeout(r, 300));
  
  console.log("✅ 联系方式文字已添加");
  
  // 上传二维码图片
  const imgBtnClicked = await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      const html = b.innerHTML.toLowerCase();
      if (html.includes("image") || html.includes("picture") || html.includes("图")) {
        b.click();
        return true;
      }
    }
    return false;
  });
  console.log("图片按钮点击:", imgBtnClicked);
  await new Promise(r => setTimeout(r, 1500));
  
  const fileInput = await page.$("input[type=file]");
  if (fileInput) {
    await fileInput.setInputFiles("E:\\五年计划\\site\\qr.jpg");
    console.log("✅ 二维码图片已上传");
  } else {
    console.log("⚠️ 找不到文件上传框");
  }
  
  await new Promise(r => setTimeout(r, 2000));
  
  // 保存
  const saved = await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      const t = b.textContent.trim();
      if (t === "保存" || t === "保存修改" || t === "更新") {
        b.click();
        return t;
      }
    }
    return "not found";
  });
  console.log("保存:", saved);
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("✅ 完成");
  await browser.close();
})();
