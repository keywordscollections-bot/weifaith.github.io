const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  
  // 先看看有没有已有的页面
  const pages = browser.contexts()[0].pages();
  console.log("已有页面:", pages.length);
  
  // 新建一个页面
  const page = await browser.newPage();
  
  // 导航到知乎首页，确认登录状态
  await page.goto("https://www.zhihu.com", { timeout: 10000, waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 3000));
  
  const status = await page.evaluate(() => {
    return {
      url: window.location.href,
      hasLogin: document.body.innerText.includes("消息") || !document.body.innerText.includes("登录"),
      preview: document.body.innerText.substring(0, 300)
    };
  });
  
  console.log("登录状态:", JSON.stringify(status));
  
  // 获取cookie
  const cookies = await page.context().cookies();
  const xsrfCookie = cookies.find(c => c.name === "_xsrf" || c.name === "xsrf");
  const sessionCookie = cookies.find(c => c.name === "SESSIONID");
  console.log("xsrf:", xsrfCookie?.value || "无");
  console.log("session:", sessionCookie?.value || "无");
  
  await browser.close();
})();
