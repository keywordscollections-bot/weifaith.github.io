const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  // 重新加载登录页
  await page.goto("https://www.zhihu.com/signin?next=%2F", { timeout: 15000, waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 2000));
  
  // 确保在验证码登录tab
  // 直接发送验证码 - 先填手机号
  await page.locator("input[name=username]").fill("15001376727");
  console.log("已填手机号");
  
  // 点击"获取短信验证码"
  await page.getByRole("button", { name: "获取短信验证码", exact: true }).click();
  console.log("已点击获取短信验证码");
  
  await new Promise(r => setTimeout(r, 2000));
  
  // 检查是否发送成功
  const status = await page.evaluate(() => {
    return {
      url: window.location.href,
      text: document.body.innerText.substring(0, 400)
    };
  });
  console.log("状态:", JSON.stringify(status));
  
  console.log("\n⚠️ 请在下方输入收到的6位短信验证码（手机号15001376727）");
  
  await browser.close();
})();
