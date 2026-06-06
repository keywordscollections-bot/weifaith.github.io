const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  // 导航到问题页面（在已有的浏览器实例里）
  await page.goto("https://www.zhihu.com/question/2020934662076265540", { timeout: 15000, waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 4000));
  
  console.log("当前URL:", page.url().substring(0, 100));
  
  // 检查登录状态
  const loginCheck = await page.evaluate(() => {
    return {
      url: window.location.href,
      hasSignIn: document.body.innerText.includes("登录"),
      bodyStart: document.body.innerText.substring(0, 300)
    };
  });
  
  console.log("登录状态:", JSON.stringify(loginCheck));
  
  // 如果页面是问题页面本身
  if (page.url().includes("/question/")) {
    // 滚动到底部找回答编辑器
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 1000));
    
    // 找"写回答"按钮
    const writeBtn = await page.evaluate(() => {
      const btns = document.querySelectorAll("button");
      for (const b of btns) {
        if (b.textContent.trim() === "写回答") return true;
      }
      return false;
    });
    console.log("有写回答按钮:", writeBtn);
  }
  
  await browser.close();
})();
