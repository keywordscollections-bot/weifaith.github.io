const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes("question/2020934662076265540"));
  
  if (!page) {
    console.log("页面不存在");
    await browser.close();
    return;
  }
  
  // 看看问题标题下面的操作栏
  const headerActions = await page.evaluate(() => {
    // 在 QuestionHeader 附近找按钮
    const header = document.querySelector(".QuestionHeader");
    if (!header) return "无 QuestionHeader";
    
    const buttons = header.querySelectorAll("button, a");
    return Array.from(buttons).map(b => ({
      text: b.textContent.trim().substring(0, 30),
      tag: b.tagName,
      className: b.className?.substring(0, 40)
    }));
  });
  
  console.log("头部操作项:");
  headerActions.forEach((b, i) => console.log(`  ${i}. ${b.tag} "${b.text}" ${b.className}`));
  
  // 看看问题描述下面的区域
  const belowQuestion = await page.evaluate(() => {
    const header = document.querySelector(".QuestionHeader");
    if (!header) return "无";
    
    // 找header后面的兄弟元素
    let next = header.nextElementSibling;
    return next?.className?.substring(0, 80) || "无兄弟元素";
  });
  console.log("\nHeader下方:", belowQuestion);
  
  // 看看页面中间部分的按钮
  const allInteractive = await page.evaluate(() => {
    // 收集所有有 class 的顶级 div 的结构
    const topDivs = document.querySelectorAll("#root > div > div > div");
    const info = [];
    topDivs.forEach((d, i) => {
      const text = d.textContent.trim().substring(0, 60);
      if (text.length > 2) {
        info.push({ index: i, text, height: d.offsetHeight });
      }
    });
    return info.slice(0, 20);
  });
  
  console.log("\n页面结构:");
  allInteractive.forEach(d => console.log(`  div[${d.index}]: "${d.text}" height=${d.height}`));
  
  await browser.close();
})();
