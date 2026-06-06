const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  
  const page = ctx.pages().find(p => p.url().includes("search-question"));
  
  // 显示"查看回答"按钮的详细信息
  const info = await page.evaluate(() => {
    const allEls = document.querySelectorAll("*");
    for (const el of allEls) {
      if (el.textContent.trim() === "查看回答") {
        return {
          tag: el.tagName,
          id: el.id,
          className: el.className?.substring(0, 80),
          href: el.href || "无href",
          innerHTML: el.innerHTML.substring(0, 200)
        };
      }
    }
    return null;
  });
  
  console.log("查看回答详细信息:", JSON.stringify(info));
  
  // 尝试用��直接的方式点击
  const result = await page.evaluate(() => {
    const allEls = document.querySelectorAll("*");
    for (const el of allEls) {
      if (el.textContent.trim() === "查看回答") {
        el.click();
        return "点击了: " + el.tagName;
      }
    }
    return "没找到";
  });
  
  console.log("点击结果:", result);
  await new Promise(r => setTimeout(r, 3000));
  
  console.log("新URL:", page.url().substring(0, 100));
  
  const text2 = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log(text2);
  
  await browser.close();
})();
