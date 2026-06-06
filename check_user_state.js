const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  
  // 看看有哪些知乎页面可用
  const zhPages = ctx.pages().filter(p => p.url().includes("zhihu.com"));
  console.log("知乎页面数:", zhPages.length);
  
  // 找一个知乎首页或者其他页面
  const homePage = zhPages.find(p => p.url() === "https://www.zhihu.com/" || p.url().startsWith("https://www.zhihu.com/?"));
  if (homePage) {
    await homePage.bringToFront();
    console.log("使用首页:", homePage.url());
    
    // 看用户信息
    const userInfo = await homePage.evaluate(() => {
      // 检查登录状态
      const userMenu = document.querySelector(".AppHeader-profile, .css-1euzrxh, [data-za-module=\"Profile\"]");
      const avatar = document.querySelector("img[alt]");
      return {
        hasUserMenu: !!userMenu,
        avatarAlt: avatar?.alt || "无"
      };
    });
    console.log("用户信息:", JSON.stringify(userInfo));
    
    // 在首页搜索问题
    await homePage.goto("https://www.zhihu.com/question/2020934662076265540", { waitUntil: "domcontentloaded", timeout: 10000 });
    await new Promise(r => setTimeout(r, 3000));
    
    // 现在尝试看看页面上有没有"写回答"
    const btns = await homePage.evaluate(() => {
      return Array.from(document.querySelectorAll("button")).map(b => ({
        text: b.textContent.trim().substring(0, 20),
        disabled: b.disabled,
        visible: b.offsetParent !== null
      })).filter(b => b.text.length > 0);
    });
    
    console.log("按钮列表:");
    btns.forEach(b => console.log(`  "${b.text}" disabled=${b.disabled} visible=${b.visible}`));
  }
  
  await browser.close();
})();
