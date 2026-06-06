const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  
  const page = await ctx.newPage();
  await page.goto("https://www.zhihu.com/creator/featured-question/invited", { timeout: 10000 });
  await new Promise(r => setTimeout(r, 4000));
  
  // 点击问题搜索
  await page.evaluate(() => {
    const allEls = document.querySelectorAll("*");
    for (const el of allEls) {
      if (el.textContent.trim() === "问题搜索" && el.children.length === 0) {
        el.click();
        return;
      }
    }
  });
  await new Promise(r => setTimeout(r, 2000));
  
  // 清空输入框并输入
  const input = await page.$("input");
  if (input) {
    await input.click();
    await input.fill("");
    await new Promise(r => setTimeout(r, 200));
    await input.type("为什么用SEO思路做GEO总失败", { delay: 20 });
    await new Promise(r => setTimeout(r, 1000));
    await page.keyboard.press("Enter");
    await new Promise(r => setTimeout(r, 4000));
    
    const text = await page.evaluate(() => document.body.innerText.substring(0, 1000));
    console.log(text);
    
    // 看url有没有变化
    console.log("URL:", page.url());
  }
  
  await browser.close();
})();
