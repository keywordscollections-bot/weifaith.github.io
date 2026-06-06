const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes("zhihu.com/creator/featured-question"));
  
  // 点击"问题搜索"
  await page.evaluate(() => {
    const divs = document.querySelectorAll("div");
    for (const d of divs) {
      if (d.textContent.trim() === "问题搜索" && d.children.length === 0) {
        d.click();
        return;
      }
    }
    // 尝试用其他方式找到问题搜索
    const allEls = document.querySelectorAll("*");
    for (const el of allEls) {
      if (el.textContent.trim() === "问题搜索" && !el.querySelector("*")) {
        el.click();
        return;
      }
    }
  });
  
  await new Promise(r => setTimeout(r, 3000));
  
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("input")).map(i => ({
      placeholder: i.placeholder,
      id: i.id,
      visible: i.offsetParent !== null
    }));
  });
  console.log("输入框:", JSON.stringify(inputs));
  
  // 如果有输入框，搜索问题
  if (inputs.length > 0) {
    await page.fill("input", "为什么用SEO思路做GEO总失败");
    await new Promise(r => setTimeout(r, 2000));
    
    const results = await page.evaluate(() => document.body.innerText.substring(0, 500));
    console.log("搜索结果:", results);
  }
  
  await browser.close();
})();
