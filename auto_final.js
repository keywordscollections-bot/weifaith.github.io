const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  console.log("连接 Chrome...");
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  console.log("✅ 已连接");

  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  let page = pages.find(p => p.url().includes("zhihu.com/editor"));
  if (!page) { 
    page = await ctx.newPage();
    await page.goto("https://www.zhihu.com/editor", { timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log("URL:", page.url());

  const article = fs.readFileSync("zhihu_article_1.md", "utf-8");

  await page.mouse.click(400, 250);
  await new Promise(r => setTimeout(r, 500));

  await page.keyboard.press("Control+a");
  await new Promise(r => setTimeout(r, 200));
  await page.keyboard.press("Delete");
  await new Promise(r => setTimeout(r, 500));

  await page.keyboard.type("GEO 是什么？跨境电商为什么现在就要做？", { delay: 10 });
  console.log("✅ 标题已输入");

  await page.keyboard.press("Enter");
  await new Promise(r => setTimeout(r, 200));

  let text = article
    .replace(/^# GEO.*$/m, "")
    .replace(/\*此处放你的微信二维码\*/g, "")
    .replace(/\*\*/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .trim();

  const lines = text.split("\n").filter(l => l.trim());
  let charCount = 0;
  
  for (const line of lines) {
    let clean = line.trim().replace(/^#{1,3}\s+/, "").replace(/^\d+\.\s+/, "");
    if (!clean) continue;
    await page.keyboard.type(clean, { delay: 1 });
    charCount += clean.length;
    await page.keyboard.press("Enter");
    await new Promise(r => setTimeout(r, 20));
  }
  console.log("✅ 正文已输入 (" + charCount + " 字)");

  await page.keyboard.press("Control+End");
  await new Promise(r => setTimeout(r, 300));
  await page.keyboard.press("Enter");

  // 点图片按钮
  await page.evaluate(() => {
    const btn = document.querySelector('[class*="ImageButton"], [data-tool="image"]');
    if (btn) { btn.click(); return true; }
    return false;
  });
  await new Promise(r => setTimeout(r, 1000));

  const fi = await page.input[type=file];
  if (fi) {
    await fi.setInputFiles(path.join(process.cwd(), "qr.jpg"));
    console.log("✅ 二维码已上传");
  } else {
    console.log("⚠️ 请手动上传二维码");
  }

  console.log("");
  console.log("✅ 完成！去浏览器检查并手动发布");
})();
