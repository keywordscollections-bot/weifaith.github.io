const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  
  const page = ctx.pages().find(p => p.url().includes("question/2020934662076265540"));
  if (!page) {
    console.log("找不到页面");
    await browser.close();
    return;
  }
  
  // 点击"查看我的回答"
  await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll("a"));
    const myAnswerLink = links.find(l => l.textContent.includes("查看我的回答"));
    if (myAnswerLink) myAnswerLink.click();
  });
  await new Promise(r => setTimeout(r, 3000));
  
  const currentUrl = page.url();
  console.log("点击后URL:", currentUrl);
  
  const content = await page.evaluate(() => {
    // 如果已有回答，看看能不能编辑
    const editBtn = document.querySelector(".AnswerItem-editButton, [aria-label=编辑]");
    const answerContent = document.querySelector(".RichText");
    return {
      hasEdit: !!editBtn,
      myAnswer: answerContent?.textContent?.trim()?.substring(0, 200) || "无"
    };
  });
  console.log("我的回答:", JSON.stringify(content));
  
  await browser.close();
})();
