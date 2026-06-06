const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  
  // 找到"推荐问题"页面
  const page = ctx.pages().find(p => p.url().includes("zhihu.com/creator/featured-question"));
  if (!page) {
    console.log("找不到页面");
    await browser.close();
    return;
  }
  
  // 直接看页面上有没有输入框
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("input")).map(i => ({
      placeholder: i.placeholder,
      id: i.id,
      className: i.className?.substring(0, 40)
    }));
  });
  
  console.log("输入框:", JSON.stringify(inputs));
  
  // 看看有没有搜索相关的元素
  const searchEles = await page.evaluate(() => {
    const result = [];
    const divs = document.querySelectorAll("div");
    divs.forEach(d => {
      if (d.textContent.includes("问题搜索") || d.textContent.includes("搜索") && d.children.length < 3) {
        result.push({
          text: d.textContent.trim().substring(0, 30),
          className: d.className?.substring(0, 50),
          tag: d.tagName
        });
      }
    });
    return result.slice(0, 5);
  });
  
  console.log("搜索元素:", JSON.stringify(searchEles));
  
  await browser.close();
})();
