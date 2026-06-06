const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  // 导航到知乎登录页
  await page.goto("https://www.zhihu.com/signin?next=%2F", { timeout: 15000, waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 3000));
  
  // 切换到密码登录
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
  console.log("切换密码登录:", switched);
  await new Promise(r => setTimeout(r, 1000));
  
  // 查看表单
  const formDetails = await page.evaluate(() => {
    const inputs = document.querySelectorAll("input");
    return Array.from(inputs).map(i => ({
      type: i.type,
      name: i.name,
      placeholder: i.placeholder,
      visible: i.offsetParent !== null,
      id: i.id
    }));
  });
  console.log("输入框:", JSON.stringify(formDetails));
  
  await browser.close();
})();
