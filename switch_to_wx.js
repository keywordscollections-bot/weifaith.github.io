const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  await page.goto("https://www.zhihu.com/signin?next=%2F", { timeout: 15000, waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 2000));
  
  // 点击"其他扫码方式：微信"
  const clicked = await page.evaluate(() => {
    const all = document.querySelectorAll("*");
    for (const el of all) {
      if (el.textContent.trim().includes("微信") && el.offsetParent !== null) {
        el.click();
        return true;
      }
    }
    return false;
  });
  console.log("点击微信:", clicked);
  await new Promise(r => setTimeout(r, 3000));
  
  const status = await page.evaluate(() => {
    const imgs = document.querySelectorAll("img");
    const imgSrcs = Array.from(imgs).map(i => ({
      src: (i.src || "").substring(0, 100),
      width: i.width,
      height: i.height,
      visible: i.offsetParent !== null
    })).filter(i => i.visible && i.width > 50);
    return {
      url: window.location.href,
      imgs: imgSrcs
    };
  });
  console.log("微信扫码状态:", JSON.stringify(status));
  
  await page.screenshot({ path: "wx_qr_page.png", fullPage: false });
  
  await browser.close();
})();
