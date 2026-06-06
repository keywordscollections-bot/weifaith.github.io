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
  
  // 直接尝试点击"查看我的回答"链接 - 这会打开我的回答（如果有）或创建新回答
  await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll("a"));
    const myAnswerLink = links.find(l => l.textContent.includes("查看我的回答"));
    if (myAnswerLink) myAnswerLink.click();
  });
  await new Promise(r => setTimeout(r, 4000));
  
  const url = page.url();
  console.log("当前URL:", url);
  
  // 现在看页面上有什么
  const content = await page.evaluate(() => {
    const hasEditor = !!document.querySelector("[contenteditable=true]");
    const editBtn = document.querySelector(".AnswerItem-editButton");
    return {
      hasEditor,
      hasEditBtn: !!editBtn,
      url: window.location.href,
      bodyText: document.body.innerText.substring(0, 500)
    };
  });
  
  console.log("状态:", JSON.stringify(content));
  
  await browser.close();
})();
