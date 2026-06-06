const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  // 去登录页
  await page.goto("https://www.zhihu.com/signin?next=%2F", { timeout: 15000, waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 2000));
  
  // 看是否有"其他扫码方式：微信"
  const pageText = await page.evaluate(() => document.body.innerText);
  console.log("页面关键文本:");
  const lines = pageText.split("\n").filter(l => l.trim());
  lines.forEach(l => console.log(`  "${l.trim()}"`));
  
  // 看有没有微信扫码选项
  const wxBtn = await page.evaluate(() => {
    const all = document.querySelectorAll("*");
    for (const el of all) {
      if (el.textContent.includes("微信") && el.offsetParent !== null) {
        el.click();
        return true;
      }
    }
    return false;
  });
  console.log("\n点击微信选项:", wxBtn);
  await new Promise(r => setTimeout(r, 2000));
  
  if (wxBtn) {
    await page.screenshot({ path: "wx_login.png", fullPage: false });
    
    // 获取微信二维码
    const wxQr = await page.evaluate(() => {
      const imgs = document.querySelectorAll("img");
      return Array.from(imgs).map(i => i.src).filter(s => s.includes("wx") || s.includes("qrcode") || s.includes("wechat"));
    });
    console.log("微信二维码:", wxQr);
  }
  
  await browser.close();
})();
