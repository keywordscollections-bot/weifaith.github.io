const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  // 去登录页
  await page.goto("https://www.zhihu.com/signin?next=%2F", { timeout: 15000, waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 2000));
  
  // 切换到密码登录
  await page.evaluate(() => {
    const allEls = document.querySelectorAll("*");
    for (const el of allEls) {
      if (el.textContent.trim() === "密码登录" && el.offsetParent !== null && el.tagName !== "INPUT") {
        el.click();
        return;
      }
    }
  });
  await new Promise(r => setTimeout(r, 1500));
  
  // 填写
  await page.locator("input[name=username]").fill("15001376727");
  await page.locator("input[name=password]").fill("Nc19940815");
  
  // 先点登录看看是否会弹验证码
  await page.getByRole("button", { name: "登录", exact: true }).click();
  console.log("点击了登录");
  await new Promise(r => setTimeout(r, 4000));
  
  // 检查页面变化 - 有没有弹验证码
  const afterClick = await page.evaluate(() => {
    // 检查是否有新的元素出现
    const body = document.body.innerText;
    return {
      url: window.location.href,
      hasCaptcha: body.includes("验证码") || body.includes("captcha"),
      hasError: body.includes("错误") || body.includes("密码错误"),
      newElements: Array.from(document.querySelectorAll("[class*=captcha], [class*=Captcha], [class*=geetest], [class*=slide]")).map(el => ({
        tag: el.tagName, class: (el.className || "").substring(0, 40), text: (el.textContent || "").trim().substring(0, 60)
      })),
      preview: body.substring(200, 500)
    };
  });
  console.log("登录后:", JSON.stringify(afterClick, null, 2));
  
  await browser.close();
})();
