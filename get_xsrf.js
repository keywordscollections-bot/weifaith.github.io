const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  
  // 从已有页面获取cookie
  const existingPage = ctx.pages().find(p => p.url().includes("zhihu.com"));
  if (!existingPage) {
    console.log("无知乎页面");
    await browser.close();
    return;
  }
  
  const cookies = await ctx.cookies();
  console.log("cookie数:", cookies.length);
  
  // 获取csrf token（知乎用xsrf）
  const xsrfCookie = cookies.find(c => c.name.includes("xsrf") || c.name.includes("XSRF") || c.name === "XSRF-TOKEN" || c.name === "xsrf");
  console.log("xsrf:", xsrfCookie?.value || "无");
  
  // 直接从浏览器上下文中使用fetch
  const result = await existingPage.evaluate(async () => {
    // 先获取csrf token
    const cookieStr = document.cookie;
    const xsrfMatch = cookieStr.match(/xsrf=([^;]+)/);
    const xsrfToken = xsrfMatch ? xsrfMatch[1] : "";
    
    return { xsrfToken };
  });
  
  console.log("获取到的xsrf:", result);
  
  await browser.close();
})();
