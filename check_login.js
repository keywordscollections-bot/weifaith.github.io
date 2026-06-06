const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log("当前URL:", page.url());
  console.log("标题:", await page.title());
  
  // 确认登录状态
  const isLoggedIn = await page.evaluate(() => {
    return {
      hasMsg: document.body.innerText.includes("消息"),
      hasNotify: document.body.innerText.includes("通知"),
      hasHome: window.location.href === "https://www.zhihu.com/" || window.location.href.includes("zhihu.com"),
      preview: document.body.innerText.substring(0, 300)
    };
  });
  
  console.log("登录状态:", JSON.stringify(isLoggedIn, null, 2));
  
  await browser.close();
})();
