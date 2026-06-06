const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  await page.goto("https://www.zhihu.com/signin?next=%2F", { timeout: 15000, waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 2000));
  
  // 尝试多种方式点击微信
  const result = await page.evaluate(() => {
    // 找文本包含"其他扫码方式"的元素，再找里面的"微信"
    const spans = document.querySelectorAll("span");
    for (const s of spans) {
      if (s.textContent.trim() === "微信" && s.offsetParent !== null) {
        s.click();
        return "clicked span with text 微信";
      }
    }
    
    // 找包含"其他扫码方式"的元素
    const all = document.querySelectorAll("*");
    for (const el of all) {
      if (el.textContent.includes("其他扫码方式") && el.offsetParent !== null) {
        // 点这个元素本身
        el.click();
        return "clicked Other element";
      }
    }
    return "not found";
  });
  console.log("结果:", result);
  
  await new Promise(r => setTimeout(r, 2000));
  
  await page.screenshot({ path: "after_wx_click.png", fullPage: false });
  
  const status = await page.evaluate(() => {
    return {
      url: window.location.href,
      textPreview: document.body.innerText.substring(0, 400)
    };
  });
  console.log("状态:", JSON.stringify(status));
  
  await browser.close();
})();
