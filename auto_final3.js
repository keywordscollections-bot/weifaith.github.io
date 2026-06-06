const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  let page = pages.find(p => p.url().includes("write"));
  if (!page) { console.log("找不到页面"); await browser.close(); return; }
  
  // 关闭可能打开的弹窗
  await page.keyboard.press("Escape");
  await new Promise(r => setTimeout(r, 500));
  
  // 点击图片按钮 (索引17)
  const allBtns = await page.$$("button");
  if (allBtns[17]) {
    await allBtns[17].click();
    console.log("✅ 点击了图片按钮");
  } else {
    console.log("找不到图片按钮");
  }
  await new Promise(r => setTimeout(r, 2000));
  
  // 找文件上传框
  let fi = await page.$("input[type=file]");
  
  if (fi) {
    await fi.setInputFiles(path.join(process.cwd(), "qr.jpg"));
    console.log("✅ 二维码已上传");
    await new Promise(r => setTimeout(r, 3000));
  } else {
    console.log("⚠️ 没有文件输入框");
    await page.screenshot({ path: "debug2.png" });
  }
  
  // 点发布按钮 (索引32)
  const btns2 = await page.$$("button");
  if (btns2[32]) {
    await btns2[32].click();
    console.log("✅ 已点发布");
    await new Promise(r => setTimeout(r, 3000));
  } else {
    console.log("找不到发布按钮");
  }
  
  console.log("✅ 完成");
  await browser.close();
})();
