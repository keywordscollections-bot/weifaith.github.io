const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages().find(p => p.url().includes("zhihu.com")) || await context.newPage();
  
  // 先看看当前页面状态
  console.log("当前URL:", page.url());
  
  // 导航到问题页，看是否已登录
  await page.goto("https://www.zhihu.com/question/2020934662076265540", { timeout: 15000, waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 3000));
  
  const loginStatus = await page.evaluate(() => {
    const body = document.body.innerText;
    return {
      loggedIn: body.includes("消息") || body.includes("私信") || !body.includes("登录/注册"),
      hasName: body.includes("GEO数据挖掘") || body.includes("newstart"),
      preview: body.substring(0, 400)
    };
  });
  console.log("登录状态:", JSON.stringify(loginStatus));
  
  await browser.close();
})();
