const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  // 导航到知乎登录页
  await page.goto("https://www.zhihu.com/signin?next=%2F", { timeout: 15000, waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 3000));
  
  // 看看登录页
  const loginScreen = await page.evaluate(() => {
    // 检查是否有扫码登录
    const hasQR = document.body.innerText.includes("扫码");
    const hasPassword = document.body.innerText.includes("密码登录");
    const hasPhone = document.body.innerText.includes("手机号") || document.body.innerText.includes("+86");
    
    // 找切换登录方式的按钮
    const tabs = [];
    document.querySelectorAll("div[role='tab'], .SignFlow-tabs, .Tabs-item").forEach(el => {
      tabs.push(el.textContent.trim());
    });
    
    return {
      qrLogin: hasQR,
      passwordLogin: hasPassword,
      phoneLogin: hasPhone,
      tabs: tabs,
      preview: document.body.innerText.substring(0, 500)
    };
  });
  
  console.log("登录页面:", JSON.stringify(loginScreen));
  
  // 如果支持密码登录，切换到密码登录
  if (loginScreen.passwordLogin) {
    console.log("\n尝试切换到密码登录...");
    const switched = await page.evaluate(() => {
      const passwordTab = Array.from(document.querySelectorAll("*")).find(el => 
        el.textContent.trim() === "密码登录" && el.offsetParent !== null
      );
      if (passwordTab) {
        passwordTab.click();
        return true;
      }
      return false;
    });
    console.log("切换结果:", switched);
    await new Promise(r => setTimeout(r, 1000));
    
    // 查看是否有表单
    const formDetails = await page.evaluate(() => {
      const inputs = document.querySelectorAll("input");
      return Array.from(inputs).map(i => ({
        type: i.type,
        name: i.name,
        placeholder: i.placeholder,
        visible: i.offsetParent !== null
      }));
    });
    console.log("输入框:", JSON.stringify(formDetails));
  }
  
  await browser.close();
})();
