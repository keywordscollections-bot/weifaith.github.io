const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = await context.newPage();
  
  // 打开知乎
  await page.goto("https://www.zhihu.com/signin?next=%2F", { timeout: 15000, waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("登录页加载完成");
  console.log("页面URL:", page.url().substring(0, 60));
  
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
  console.log("切换密码登录:", switched);
  await new Promise(r => setTimeout(r, 1500));
  
  // 填写表单
  const inputs = await page.evaluate(() => {
    const inputs = document.querySelectorAll("input:not([type=hidden])");
    return Array.from(inputs).map(i => ({
      type: i.type,
      name: i.name,
      placeholder: i.placeholder,
      id: i.id,
      visible: i.offsetParent !== null
    }));
  });
  console.log("输入框:", JSON.stringify(inputs));
  
  console.log("\n⚠️ 请告诉我知乎的登录信息（手机号/邮箱和密码）或者使用扫码登录。");
  console.log("页面已打开，你可以手动在打开的浏览器窗口中扫码登录。");
  
  // 等待一下，让用户扫描
  await new Promise(r => setTimeout(r, 8000));
  
  const status = await page.evaluate(() => ({
    url: window.location.href,
    loggedIn: !document.body.innerText.includes("登录/注册") && document.body.innerText.includes("消息")
  }));
  console.log("登录状态:", JSON.stringify(status));
  
  // 如果登录了，就继续
  if (status.loggedIn) {
    console.log("✅ 已登录！");
  } else {
    console.log("⏳ 未登录，需要手动操作");
  }
  
  await browser.close();
})();
