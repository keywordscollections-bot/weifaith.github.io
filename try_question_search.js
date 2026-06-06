const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes("zhihu.com/creator/featured-question"));
  
  // 点击"问题搜索"标签
  await page.evaluate(() => {
    const divs = document.querySelectorAll("div");
    for (const d of divs) {
      if (d.textContent.trim() === "问题搜索") {
        d.click();
        return true;
      }
    }
    return false;
  });
  await new Promise(r => setTimeout(r, 3000));
  
  const url = page.url();
  console.log("URL:", url);
  
  const text = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log("页面:", text);
  
  // 看看有没有搜索框
  const searchInput = await page.evaluate(() => {
    const input = document.querySelector("input[placeholder*=\"搜索\"]");
    return input ? input.placeholder : null;
  });
  console.log("搜索框:", searchInput);
  
  await browser.close();
})();
