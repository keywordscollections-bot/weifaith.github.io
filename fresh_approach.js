const { chromium } = require("playwright");
(async () => {
  // 使用已有的CDP连接，但找一个干净的about:blank页面
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  
  // 找about:blank页面或者新建一个
  let page = ctx.pages().find(p => p.url() === "about:blank");
  if (!page) {
    // 关闭一些知乎的写文章页面释放资源
    const writePages = ctx.pages().filter(p => p.url().includes("/write"));
    for (const wp of writePages.slice(2)) {
      await wp.close().catch(() => {});
    }
    page = await ctx.newPage();
  }
  
  // 用这个页面直接打开问题
  console.log("打开问题页面...");
  await page.goto("https://www.zhihu.com/question/2020934662076265540", { waitUntil: "networkidle", timeout: 15000 });
  console.log("页面加载完成");
  
  // 看看登录状态
  const loginCheck = await page.evaluate(() => {
    // 检查是否有用户头像
    const avatar = document.querySelector(".AppHeader-profile img, .css-1euzrxh, [data-za-module=\"Profile\"]");
    // 检查cookie
    return {
      hasAvatar: !!avatar,
      url: window.location.href,
      cookies: document.cookie?.substring(0, 100)
    };
  });
  console.log("登录状态:", JSON.stringify(loginCheck));
  
  // 等待渲染
  await new Promise(r => setTimeout(r, 3000));
  
  // 看看页面元素
  const elements = await page.evaluate(() => {
    // 找所有div看内容
    const allDivs = document.querySelectorAll("div");
    let answerArea = null;
    for (const d of allDivs) {
      const t = d.textContent.trim();
      if (t.includes("写回答") || t.includes("写下你的回答")) {
        answerArea = t.substring(0, 100);
        break;
      }
    }
    
    return {
      title: document.title,
      bodyHeight: document.body.scrollHeight,
      answerArea,
      // 看看问题标题
      questionTitle: document.querySelector(".QuestionHeader-title")?.textContent?.trim()
    };
  });
  
  console.log("页面元素:", JSON.stringify(elements));
  
  // 如果有写回答区域，点击
  if (elements.answerArea) {
    await page.evaluate(() => {
      const divs = document.querySelectorAll("div");
      for (const d of divs) {
        if (d.textContent.includes("写回答") && d.textContent.length < 30) {
          d.click();
          return;
        }
      }
    });
    await new Promise(r => setTimeout(r, 2000));
    
    const editorExists = await page.evaluate(() => {
      return !!document.querySelector("[contenteditable=true]");
    });
    console.log("编辑器出现:", editorExists);
  } else {
    console.log("页面上没有写回答按钮");
  }
  
  await browser.close();
})();
