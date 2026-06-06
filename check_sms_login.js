const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  // 去登录页
  await page.goto("https://www.zhihu.com/signin?next=%2F", { timeout: 15000, waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 2000));
  
  // 确认是验证码登录tab
  // 填写手机号
  await page.locator("input[name=username]").fill("15001376727");
  console.log("已填手机号");
  
  // 检查是否有"发送验证码"按钮
  const btnInfo = await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    return Array.from(btns).map(b => ({
      text: (b.textContent || "").trim(),
      type: b.type,
      disabled: b.disabled,
      visible: b.offsetParent !== null
    }));
  });
  console.log("按钮:", JSON.stringify(btnInfo));
  
  await browser.close();
})();
