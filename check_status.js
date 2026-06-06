const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages().find(p => p.url().includes("zhihu.com")) || await context.newPage();
  
  const info = await page.evaluate(() => ({
    url: window.location.href,
    loggedIn: !document.body.innerText.includes("登录/注册") || document.body.innerText.includes("消息"),
    preview: document.body.innerText.substring(0, 300)
  }));
  console.log("当前状态:", JSON.stringify(info));
  
  await browser.close();
})();
