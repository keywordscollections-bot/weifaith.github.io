const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  let page = ctx.pages().find(p => p.url().includes("zhuanlan.zhihu.com/write"));
  if (!page) { console.log("找不到"); await browser.close(); return; }
  
  // 看看全文，找到微信二维码相关文本的位置
  const text = await page.evaluate(() => {
    const editor = document.querySelector("[contenteditable=true]");
    if (!editor) return "no editor";
    return editor.textContent.substring(0, 3000);
  });
  
  // 找"微信"在正文中的位置
  const wechatIdx = text.indexOf("微信");
  console.log("全文前200字:", text.substring(0, 200));
  console.log("");
  console.log("微信相关位置:", wechatIdx, "附近内容:", text.substring(Math.max(0, wechatIdx-30), wechatIdx+80));
  console.log("");
  console.log("二维码位置:", text.indexOf("二维码"), "附近:", text.substring(Math.max(0, text.indexOf("二维码")-20), text.indexOf("二维码")+30));
  
  await browser.close();
})();
