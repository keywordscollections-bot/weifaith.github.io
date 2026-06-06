const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  
  // 找一个新页面
  const page = await ctx.newPage();
  
  // 直接打开问题页，看有没有写回答的弹窗或功能
  await page.goto("https://www.zhihu.com/question/2020934662076265540", { timeout: 10000 });
  await new Promise(r => setTimeout(r, 5000));
  
  // 看看页面底部是否有"写回答"的占位区域
  const bottomArea = await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
    return document.body.scrollHeight;
  });
  await new Promise(r => setTimeout(r, 2000));
  
  // 现在看看最底部
  const lastContent = await page.evaluate(() => {
    const allDivs = document.querySelectorAll("div");
    let lastAnswerArea = null;
    for (const d of allDivs) {
      if (d.textContent.includes("写回答") || d.textContent.includes("写下你的回答")) {
        lastAnswerArea = d.textContent.substring(0, 100);
      }
    }
    return lastAnswerArea || "无写回答区域";
  });
  
  console.log("底部写回答:", lastContent);
  
  // 检查是否有编辑框或者回答icon
  const editor = await page.evaluate(() => {
    const editable = document.querySelector("[contenteditable]");
    const richText = document.querySelector(".RichText");
    return {
      hasContentEditable: !!editable,
      hasRichText: !!richText
    };
  });
  
  console.log("编辑器:", JSON.stringify(editor));
  
  await browser.close();
})();
