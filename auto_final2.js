const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  let page = pages.find(p => p.url().includes("write"));
  if (!page) { console.log("找不到页面"); await browser.close(); return; }
  
  // 按钮35是"导入链接"，但上传的是"导入文档"
  // 先往回退到编辑器，然后点击图片按钮[17]
  
  // 关闭可能打开的弹窗 - 按ESC
  await page.keyboard.press("Escape");
  await new Promise(r => setTimeout(r, 500));
  
  // 点击图片按钮 [17]
  const btns = await page.("button");
  if (btns[17]) {
    await btns[17].click();
    console.log("✅ 点击了图片按钮");
  } else {
    console.log("找不到第17个按钮");
  }
  await new Promise(r => setTimeout(r, 2000));
  
  // 现在找文件上传框
  let fi = await page.input[type=file];
  if (!fi) {
    // 看看页面结构变化
    const html = await page.evaluate(() => document.querySelectorAll("input[type=file]").length);
    console.log("文件输入框数量:", html);
    
    // 也许图片上传是另一个方式 - 点击编辑器区域看看
    await page.mouse.click(400, 350);
    await new Promise(r => setTimeout(r, 1000));
    fi = await page.input[type=file];
  }
  
  if (fi) {
    await fi.setInputFiles(path.join(process.cwd(), "qr.jpg"));
    console.log("✅ 二维码已上传");
    await new Promise(r => setTimeout(r, 3000));
  } else {
    console.log("⚠️ 没有文件输入框");
    await page.screenshot({ path: "debug2.png" });
  }
  
  // 点发布
  if (btns[32]) {
    await btns[32].click();
    console.log("✅ 已点发布");
    await new Promise(r => setTimeout(r, 3000));
  }
  
  console.log("✅ 完成");
  await browser.close();
})();
