const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  
  // 找到创作中心页面
  const page = ctx.pages().find(p => p.url().includes("zhihu.com/creator"));
  if (!page) {
    console.log("找不到创作中心页");
    await browser.close();
    return;
  }
  
  // 点击"写回答"
  await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll("a"));
    const writeAnswer = links.find(l => l.textContent.trim() === "写回答");
    if (writeAnswer) {
      writeAnswer.click();
      return true;
    }
    return false;
  });
  await new Promise(r => setTimeout(r, 3000));
  
  const url = page.url();
  console.log("点击写回答后URL:", url);
  
  // 看看是不是到了问题搜索页面
  const text = await page.evaluate(() => document.body.innerText.substring(0, 1000));
  console.log("页面内容:", text.substring(0, 500));
  
  await browser.close();
})();
