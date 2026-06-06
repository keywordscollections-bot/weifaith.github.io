const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  
  // 查看当前页面列表
  const pages = context.pages();
  console.log("当前页面数:", pages.length);
  for (let i = 0; i < pages.length; i++) {
    console.log(`页面${i}: ${pages[i].url().substring(0, 80)}`);
  }
  
  // 如果没有页面，新建一个
  const page = pages.length > 0 ? pages[0] : await context.newPage();
  
  // 导航到知乎登录页
  await page.goto("https://www.zhihu.com/signin?next=%2F", { timeout: 15000, waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("\n当前URL:", page.url());
  
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
  console.log("切换到密码登录:", switched);
  await new Promise(r => setTimeout(r, 1500));
  
  // 获取输入框详情
  const inputInfo = await page.evaluate(() => {
    const inputs = document.querySelectorAll("input:not([type=hidden])");
    return Array.from(inputs).map(i => ({
      type: i.type,
      name: i.name,
      placeholder: i.placeholder,
      id: i.id,
      className: i.className.substring(0, 50),
      visible: i.offsetParent !== null,
      rect: i.getBoundingClientRect()
    }));
  });
  console.log("\n输入框:", JSON.stringify(inputInfo, null, 2));
  
  // 检查是否有button元素
  const buttonInfo = await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    return Array.from(btns).map(b => ({
      text: b.textContent.trim().substring(0, 30),
      type: b.type,
      visible: b.offsetParent !== null,
      disabled: b.disabled
    }));
  });
  console.log("\n按钮:", JSON.stringify(buttonInfo, null, 2));
  
  await browser.close();
})();
