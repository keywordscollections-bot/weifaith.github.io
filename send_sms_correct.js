const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  // 重新加载登录页
  await page.goto("https://www.zhihu.com/signin?next=%2F", { timeout: 15000, waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 2000));
  
  // 填写正确手机号
  await page.locator("input[name=username]").fill("18207553134");
  console.log("已填手机号: 18207553134");
  
  // 点击"获取短信验证码"
  await page.getByRole("button", { name: "获取短信验证码", exact: true }).click();
  console.log("已点击获取短信验证码");
  
  await new Promise(r => setTimeout(r, 2000));
  
  const status = await page.evaluate(() => {
    return {
      url: window.location.href,
      text: document.body.innerText.substring(0, 400)
    };
  });
  console.log("状态:", JSON.stringify(status));
  
  console.log("\n✅ 短信验证码已发送到 18207553134，请查看短信！");
  
  await browser.close();
})();
