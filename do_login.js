const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages().find(p => p.url().includes("zhihu.com/signin")) || await context.newPage();
  
  // 确保在登录页
  if (!page.url().includes("zhihu.com/signin")) {
    await page.goto("https://www.zhihu.com/signin?next=%2F", { timeout: 15000, waitUntil: "domcontentloaded" });
    await new Promise(r => setTimeout(r, 2000));
  }
  
  // 切换到密码登录
  const switched = await page.evaluate(() => {
    const allEls = document.querySelectorAll("*");
    for (const el of allEls) {
      if (el.textContent.trim() === "密码登录" && el.offsetParent !== null) {
        el.click();
        return true;
      }
    }
    return false;
  });
  await new Promise(r => setTimeout(r, 1000));
  
  // 填写手机号
  const usernameInput = page.locator("input[name=username]");
  const passwordInput = page.locator("input[name=password]");
  
  // 清空并填写
  await usernameInput.fill("");
  await usernameInput.fill("15001376727");
  await new Promise(r => setTimeout(r, 500));
  
  await passwordInput.fill("");
  await passwordInput.fill("Nc19940815");
  await new Promise(r => setTimeout(r, 500));
  
  console.log("已填写账号和密码");
  
  // 点击登录按钮
  const loginBtn = page.locator("button:has-text(\"登录\")");
  await loginBtn.click();
  console.log("已点击登录按钮");
  
  // 等待登录结果
  await new Promise(r => setTimeout(r, 5000));
  
  const result = await page.evaluate(() => ({
    url: window.location.href,
    hasCaptcha: document.body.innerText.includes("验证码") || document.body.innerText.includes("captcha") || document.body.innerText.includes("拼图"),
    content: document.body.innerText.substring(0, 500)
  }));
  console.log("\n登录结果:", JSON.stringify(result));
  
  await browser.close();
})();
