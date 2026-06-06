const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  await page.goto("https://www.zhihu.com/signin?next=%2F", { timeout: 15000, waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 2000));
  
  // 点击"其他扫码方式：微信"
  await page.evaluate(() => {
    const all = document.querySelectorAll("*");
    for (const el of all) {
      if (el.textContent.trim().includes("其他扫码方式") || 
          (el.textContent.trim() === "微信" && el.offsetParent !== null)) {
        el.click();
        return;
      }
    }
  });
  await new Promise(r => setTimeout(r, 3000));
  
  // 截屏微信二维码
  await page.screenshot({ path: "wx_qr.png", fullPage: false });
  
  // 查找微信二维码图片
  const wxInfo = await page.evaluate(() => {
    const imgs = document.querySelectorAll("img");
    const visibleImgs = Array.from(imgs)
      .filter(i => i.offsetParent !== null && i.width > 100)
      .map(i => ({
        src: i.src.substring(0, 150),
        w: i.width,
        h: i.height,
        x: i.getBoundingClientRect().x,
        y: i.getBoundingClientRect().y
      }));
    return {
      url: window.location.href,
      textPreview: document.body.innerText.substring(0, 500),
      visibleImages: visibleImgs
    };
  });
  
  console.log(JSON.stringify(wxInfo, null, 2));
  
  await browser.close();
})();
