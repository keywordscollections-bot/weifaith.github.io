const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  let page = pages.find(p => p.url().includes("zhuanlan.zhihu.com/write"));
  if (!page) { console.log("未找到写文章页面"); await browser.close(); return; }
  
  // 文章末尾
  await page.keyboard.press("Control+End");
  await new Promise(r => setTimeout(r, 500));
  await page.keyboard.press("Enter");
  await new Promise(r => setTimeout(r, 300));
  
  // 找图片上传按钮
  const btnResult = await page.evaluate(() => {
    const all = document.querySelectorAll("button, [role=button]");
    for (const el of all) {
      const html = el.innerHTML.toLowerCase();
      if (html.includes("image") || html.includes("photo") || html.includes("picture") || html.includes("img") || html.includes("upload")) {
        el.click();
        return el.textContent.trim().substring(0, 30) || "icon-button";
      }
    }
    return "not-found";
  });
  console.log("图片按钮结果:", btnResult);
  await new Promise(r => setTimeout(r, 2000));
  
  // 找文件输入
  let fi = await page.waitForSelector("input[type=file]", { timeout: 3000 }).catch(() => null);
  if (!fi) {
    await page.mouse.click(400, 350);
    await new Promise(r => setTimeout(r, 500));
    fi = await page.waitForSelector("input[type=file]", { timeout: 3000 }).catch(() => null);
  }
  
  if (fi) {
    await fi.setInputFiles(path.join(process.cwd(), "qr.jpg"));
    console.log("✅ 二维码已上传");
    await new Promise(r => setTimeout(r, 2000));
  } else {
    console.log("⚠️ 未找到文件上传框");
    await page.screenshot({ path: "debug_editor.png" });
    await browser.close();
    return;
  }
  
  // 点发布
  const pubBtn = await page.waitForSelector("button:has-text(\"发布\")", { timeout: 5000 }).catch(() => null);
  if (pubBtn) {
    await pubBtn.click();
    console.log("✅ 已点击发布");
    await new Promise(r => setTimeout(r, 3000));
  } else {
    console.log("⚠️ 找不到发布按钮");
  }
  
  console.log("✅ 完成");
  await browser.close();
})();
