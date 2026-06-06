const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  // 去登录页
  await page.goto("https://www.zhihu.com/signin?next=%2F", { timeout: 15000, waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 2000));
  
  // 截图看二维码
  await page.screenshot({ path: "login_page.png", fullPage: false });
  
  // 获取二维码canvas数据
  const qrInfo = await page.evaluate(() => {
    const qrcode = document.querySelector(".Qrcode-qrcode");
    const qrImg = document.querySelector(".Qrcode-img");
    return {
      canvasExists: !!qrcode,
      imgExists: !!qrImg,
      canvasSize: qrcode ? { w: qrcode.width, h: qrcode.height } : null,
      // 看看二维码区域
      qrVisible: qrcode ? qrcode.offsetParent !== null : false
    };
  });
  
  console.log("二维码信息:", JSON.stringify(qrInfo));
  
  await browser.close();
})();
