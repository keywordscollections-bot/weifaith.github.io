const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  await page.goto("https://www.zhihu.com/signin?next=%2F", { timeout: 15000, waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 2000));
  
  const pageText = await page.evaluate(() => document.body.innerText);
  const lines = pageText.split("\n").filter(l => l.trim());
  lines.forEach(l => console.log(`  "${l.trim()}"`));
  
  await browser.close();
})();
