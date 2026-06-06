const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes("write"));
  if (!page) { console.log("找不到"); await browser.close(); return; }
  
  // 点击"添加封面"区域
  await page.evaluate(() => {
    const all = document.querySelectorAll("*");
    for (const el of all) {
      if (el.textContent.includes("添加封面") && el.offsetParent !== null && el.tagName !== "SCRIPT") {
        el.click();
        return;
      }
    }
  });
  console.log("点击添加封面");
  await new Promise(r => setTimeout(r, 2000));
  
  // 找文件输入框
  let fi = await page.$("input[type=file]");
  if (fi) {
    await fi.setInputFiles(path.join(process.cwd(), "qr.jpg"));
    console.log("✅ 封面已上传");
    await new Promise(r => setTimeout(r, 3000));
  }
  
  // 再点发布
  const pubStatus = await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      if (b.textContent.trim() === "发布") {
        if (!b.disabled) {
          b.click();
          return "已点击, 可用";
        } else {
          return "仍被禁用";
        }
      }
    }
    return "未找到";
  });
  console.log("发布状态:", pubStatus);
  await new Promise(r => setTimeout(r, 2000));
  
  // 看看有没有确认弹窗
  const dialogs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("[role=dialog]")).map(d => d.textContent.replace(/\s+/g, " ").trim().substring(0, 150));
  });
  console.log("弹窗:", dialogs);
  
  if (dialogs.length > 0) {
    // 点确认
    await page.evaluate(() => {
      const btns = document.querySelectorAll("button");
      for (const b of btns) {
        const t = b.textContent.trim();
        if ((t === "确定" || t === "确认") && b.offsetParent !== null) {
          b.click();
          return;
        }
      }
    });
    await new Promise(r => setTimeout(r, 3000));
    console.log("点了弹窗确认");
  }
  
  console.log("最终URL:", page.url().substring(0, 100));
  
  await browser.close();
})();
