const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes("zhihu.com/creator"));
  
  // 点击"推荐问题"
  await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll("a"));
    const recommendQuestions = links.find(l => l.textContent.trim() === "推荐问题");
    if (recommendQuestions) {
      recommendQuestions.click();
      return true;
    }
    return false;
  });
  await new Promise(r => setTimeout(r, 3000));
  
  const url = page.url();
  console.log("URL:", url);
  const text = await page.evaluate(() => document.body.innerText.substring(0, 1000));
  console.log("内容:", text);
  
  await browser.close();
})();
