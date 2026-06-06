const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  
  // 不获取contexts，直接拿第一个页面的cookies用fetch
  const context = browser.contexts()[0];
  const cookies = await context.cookies();
  
  const xsrfCookie = cookies.find(c => c.name === "xsrf" || c.name === "XSRF-TOKEN");
  const sessionCookie = cookies.find(c => c.name === "SESSIONID");
  
  console.log(JSON.stringify({
    xsrf: xsrfCookie?.value || "无",
    session: sessionCookie?.value || "无",
    cookieCount: cookies.length
  }));
  
  // 先尝试用其中一个页面来做API请求
  for (const page of context.pages()) {
    if (page.url().includes("zhihu.com")) {
      try {
        const ready = await page.evaluate(() => document.readyState);
        console.log(`页面 ${page.url().substring(0,50)} ready=${ready}`);
      } catch(e) {
        console.log(`页面不可用`);
      }
      // 只检查一个
      break;
    }
  }
  
  await browser.close();
})();
