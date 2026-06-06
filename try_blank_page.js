const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  
  // 找一个未登录的、干净的页面
  // 先看看所有页面状态
  for (const p of ctx.pages()) {
    const url = p.url();
    if (url === "about:blank") {
      // 用这个页面
      await p.goto("https://www.zhihu.com/question/2020934662076265540", { waitUntil: "domcontentloaded", timeout: 10000 });
      await new Promise(r => setTimeout(r, 3000));
      
      const text = await p.evaluate(() => document.body.innerText.substring(0, 500));
      console.log("about:blank页:", text.substring(0, 200));
      
      // 看看登录状态
      const buttons = await p.evaluate(() => {
        return Array.from(document.querySelectorAll("button, a")).map(el => ({
          tag: el.tagName,
          text: el.textContent.trim().substring(0, 25)
        })).filter(el => el.text.length > 0 && el.text.length < 30);
      });
      console.log("按钮:", buttons.slice(0, 20).map(b => b.text).join(", "));
      break;
    }
  }
  
  await browser.close();
})();
