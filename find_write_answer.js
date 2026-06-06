const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  
  const page = await ctx.newPage();
  // 使用load状态而非networkidle
  await page.goto("https://www.zhihu.com/question/2020934662076265540", { waitUntil: "domcontentloaded", timeout: 10000 });
  await new Promise(r => setTimeout(r, 4000));
  
  // 检查写回答按钮
  const result = await page.evaluate(() => {
    // 找所有有写回答文本的元素
    const texts = [];
    const allEls = document.querySelectorAll("*");
    for (const el of allEls) {
      const t = el.textContent.trim();
      if ((t === "写回答" || t.startsWith("写回答")) && el.children.length === 0) {
        texts.push({
          tag: el.tagName,
          text: t.substring(0, 20),
          visible: el.offsetParent !== null,
          rect: el.getBoundingClientRect()
        });
      }
    }
    return texts;
  });
  
  console.log("写回答元素:", JSON.stringify(result));
  
  // 如果没有，看看"回答"按钮
  const answerBtns = await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    return Array.from(btns).filter(b => b.textContent.includes("回答")).map(b => ({
      text: b.textContent.trim().substring(0, 15),
      disabled: b.disabled,
      visible: b.offsetParent !== null,
      rect: { x: b.getBoundingClientRect().x, y: b.getBoundingClientRect().y, w: b.getBoundingClientRect().width }
    }));
  });
  console.log("回答按钮:", JSON.stringify(answerBtns));
  
  await browser.close();
})();
