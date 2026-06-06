const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  await page.goto("https://www.zhihu.com/signin?next=%2F", { timeout: 15000, waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 2000));
  
  // 填手机号
  await page.locator("input[name=username]").fill("18207553134");
  
  // 换用语音验证码试试
  await page.getByRole("button", { name: "获取语音验证码", exact: true }).click();
  console.log("已点击获取语音验证码，请注意接听电话");
  
  await new Promise(r => setTimeout(r, 2000));
  
  const status = await page.evaluate(() => {
    const tips = document.querySelectorAll("[class*=tip], [class*=message], [class*=error]");
    return {
      url: window.location.href,
      tips: Array.from(tips).map(t => t.textContent),
      textPreview: document.body.innerText.substring(200, 500)
    };
  });
  console.log("状态:", JSON.stringify(status));
  
  await browser.close();
})();
