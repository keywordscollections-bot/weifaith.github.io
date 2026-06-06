const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = ctx.pages()[0];
  
  // 检查页面是否有"写回答"相关元素
  const buttons = await page.evaluate(() => {
    const allBtns = document.querySelectorAll("button, a, div[role=button]");
    return Array.from(allBtns).map(b => ({
      tag: b.tagName,
      text: b.textContent.trim().substring(0, 30),
      classes: b.className?.substring(0, 50)
    })).filter(b => b.text.length > 0 && b.text.length < 20);
  });
  
  console.log("所有按钮/交互元素:");
  buttons.forEach((b, i) => console.log(`  ${i}. <${b.tag}> "${b.text}" class=${b.classes}`));
  
  // 看页面底部
  const bottomText = await page.evaluate(() => {
    const allDivs = document.querySelectorAll("div");
    let lastRelevant = "";
    for (const d of allDivs) {
      const t = d.textContent.trim();
      if (t.includes("写回答") && t.length < 50) {
        lastRelevant = t;
      }
    }
    return lastRelevant || "未找到写回答";
  });
  console.log("\n底部写回答相关:", bottomText);
  
  await browser.close();
})();
