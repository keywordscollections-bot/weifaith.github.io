const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes("zhihu.com/creator/featured-question"));
  
  if (!page) {
    console.log("page not found");
    await browser.close();
    return;
  }
  
  // 先聚焦输入框
  await page.click("input");
  await new Promise(r => setTimeout(r, 500));
  
  // 输入
  await page.type("input", "为什么用SEO思路做GEO总失败", { delay: 50 });
  await new Promise(r => setTimeout(r, 3000));
  
  const text = await page.evaluate(() => document.body.innerText.substring(0, 1500));
  console.log(text);
  
  await browser.close();
})();
