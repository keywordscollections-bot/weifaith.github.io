const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  
  const page = ctx.pages().find(p => p.url().includes("search-question"));
  if (!page) {
    console.log("找不到搜索页面");
    await browser.close();
    return;
  }
  
  // 点击"查看回答"按钮
  const clicked = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll("a"));
    const viewAnswer = links.find(l => l.textContent.trim() === "查看回答");
    if (viewAnswer) {
      viewAnswer.click();
      return true;
    }
    return false;
  });
  
  console.log("点击查看回答:", clicked);
  await new Promise(r => setTimeout(r, 4000));
  
  console.log("URL:", page.url());
  const text = await page.evaluate(() => document.body.innerText.substring(0, 1000));
  console.log(text);
  
  await browser.close();
})();
