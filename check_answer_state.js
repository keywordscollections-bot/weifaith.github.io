const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  
  const page = ctx.pages().find(p => p.url().includes("/answer/me"));
  if (!page) {
    console.log("页面已关闭或导航失败");
    await browser.close();
    return;
  }
  
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log("Body:", bodyText);
  
  // 可能页面已经404了（之前试过这个路径404）
  // 回退到问题页
  await page.goBack();
  await new Promise(r => setTimeout(r, 3000));
  
  const url = page.url();
  console.log("回退到:", url.substring(0, 100));
  
  // 再试试看页面上有没有写回答区域
  const hasWriteAnswer = await page.evaluate(() => {
    // 查找编辑框
    const editor = document.querySelector("[contenteditable=true]");
    // 或者查找有"写回答"文字���div
    const divs = document.querySelectorAll("div");
    for (const d of divs) {
      const text = d.textContent.trim();
      if (text.includes("写回答") && text.length < 30) return { text, tag: d.tagName, cls: d.className?.substring(0, 50) };
    }
    return { text: "无", found: editor ? "有编辑器" : "无编辑器" };
  });
  
  console.log("回答状态:", JSON.stringify(hasWriteAnswer));
  
  await browser.close();
})();
