const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  
  // 创建新标签页
  const page = await browser.newPage();
  
  // 先去知乎首页获取cookies
  await page.goto("https://www.zhihu.com", { timeout: 10000, waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 3000));
  
  // 获取cookies
  const cookies = await page.context().cookies();
  console.log("Cookie count:", cookies.length);
  cookies.forEach(c => console.log(`${c.name}: ${c.value.substring(0, 30)}`));
  
  // 获取xsrf token
  const xsrf = await page.evaluate(() => {
    const match = document.cookie.match(/xsrf=([^;]+)/);
    return match ? match[1] : "";
  });
  console.log("xsrf:", xsrf);
  
  await browser.close();
})();
