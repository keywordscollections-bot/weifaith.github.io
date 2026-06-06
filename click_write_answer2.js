const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes("zhihu.com/creator"));
  
  // 找到"写回答"元素的详细信息
  const writeAnswerEl = await page.evaluate(() => {
    const allEls = document.querySelectorAll("*");
    for (const el of allEls) {
      if (el.textContent.trim() === "写回答" && el.children.length === 0) {
        return {
          tag: el.tagName,
          id: el.id,
          className: el.className?.substring(0, 80),
          role: el.getAttribute("role"),
          dataZaModule: el.getAttribute("data-za-module")
        };
      }
    }
    return null;
  });
  
  console.log("写回答元素:", JSON.stringify(writeAnswerEl));
  
  // 点击它
  await page.evaluate(() => {
    const allEls = document.querySelectorAll("*");
    for (const el of allEls) {
      if (el.textContent.trim() === "写回答" && el.children.length === 0) {
        el.click();
        return;
      }
    }
  });
  await new Promise(r => setTimeout(r, 3000));
  
  const url = page.url();
  console.log("点击后URL:", url);
  
  if (url.includes("creator")) {
    // 没跳转，看看是不是弹窗
    const popup = await page.evaluate(() => {
      const modal = document.querySelector(".Modal-content, [role=dialog], .css-1qezv0v");
      return modal ? modal.textContent.substring(0, 300) : null;
    });
    console.log("弹窗:", popup);
  }
  
  await browser.close();
})();
