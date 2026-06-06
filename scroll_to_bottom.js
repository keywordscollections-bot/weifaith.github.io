const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes("question/2020934662076265540"));
  
  if (!page) {
    console.log("找不到问题页面");
    await browser.close();
    return;
  }
  
  // 滚动到底部
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 2000));
  
  // 看看底部有什么
  const bottomInfo = await page.evaluate(() => {
    // 找编辑框
    const editor = document.querySelector("[contenteditable=true]");
    const richText = document.querySelector(".RichText");
    const textarea = document.querySelector("textarea");
    
    // 页面底部文本
    const scrollY = window.scrollY;
    const bodyHeight = document.body.scrollHeight;
    
    return {
      hasEditor: !!editor,
      hasRichText: !!richText,
      hasTextarea: !!textarea,
      scrollY,
      bodyHeight
    };
  });
  
  console.log("底部信息:", JSON.stringify(bottomInfo));
  
  // 看看有没有"写回答"的容器
  const answerArea = await page.evaluate(() => {
    const divs = document.querySelectorAll("div");
    for (const d of divs) {
      if (d.textContent.includes("写回答") || d.textContent.includes("写下你的回答")) {
        return {
          text: d.textContent.trim().substring(0, 100),
          className: d.className?.substring(0, 50),
          tag: d.tagName,
          id: d.id
        };
      }
    }
    return null;
  });
  
  console.log("写回答区域:", JSON.stringify(answerArea));
  
  await browser.close();
})();
