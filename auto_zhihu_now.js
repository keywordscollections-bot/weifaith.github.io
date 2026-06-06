const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  console.log("连接 Chrome...");
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  console.log("✅ 已连接");

  const ctx = browser.contexts()[0];
  
  // 直接打开编辑器
  const page = await ctx.newPage();
  console.log("打开知乎编辑器...");
  await page.goto("https://www.zhihu.com/editor", { waitUntil: "networkidle", timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));
  console.log("✅ 编辑器已打开");
  
  // 看看是否要求登录
  const url = page.url();
  if (url.includes("signin") || url.includes("login")) {
    console.log("⚠️ 需要先登录知乎！请在浏览器中登录后告诉我");
    console.log("当前URL:", url);
    return;
  }

  // 读取文章
  const article = fs.readFileSync("zhihu_article_1.md", "utf-8");

  // 点击编辑器区域
  await page.mouse.click(400, 250);
  await new Promise(r => setTimeout(r, 500));

  // 清除已有内容
  await page.keyboard.press("Control+a");
  await new Promise(r => setTimeout(r, 200));
  await page.keyboard.press("Delete");
  await new Promise(r => setTimeout(r, 500));

  // 输入标题
  await page.keyboard.type("GEO 是什么？跨境电商为什么现在就要做？", { delay: 15 });
  console.log("✅ 标题已输入");

  // 回车到正文
  await page.keyboard.press("Enter");
  await new Promise(r => setTimeout(r, 300));

  // 处理正文
  let text = article;
  // 去掉标题行
  text = text.replace(/^# GEO.*$/m, "");
  // 去掉二维码占位符
  text = text.replace(/\*此处放你的微信二维码\*/g, "");
  // 去掉 markdown 标记
  text = text.replace(/\*\*/g, "");
  text = text.replace(/!\[.*?\]\(.*?\)/g, "");
  
  const lines = text.split("\n").filter(l => l.trim());
  let charCount = 0;
  
  for (const line of lines) {
    let clean = line.trim();
    clean = clean.replace(/^#{1,3}\s+/, "");  // 去掉 ## 标题标记
    clean = clean.replace(/^\d+\.\s+/, "");    // 去掉数字列表
    if (!clean) continue;
    
    await page.keyboard.type(clean, { delay: 1 });
    charCount += clean.length;
    await page.keyboard.press("Enter");
    await new Promise(r => setTimeout(r, 30));
  }
  console.log(`✅ 正文已输入 (${charCount} 字符)`);

  // 上传二维码
  await page.keyboard.press("Control+End");
  await new Promise(r => setTimeout(r, 300));
  await page.keyboard.press("Enter");
  
  // 点击工具栏图片按钮
  await page.evaluate(() => {
    // 多种可能的选择器
    const selectors = [
      '[class*="ImageButton"]',
      '[data-tool="image"]',
      '[aria-label*="图"]',
      'button:has(svg)',
      '.css-1j6p9n6',
      '[class*="toolbar"] button:nth-child(5)'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) { el.click(); return true; }
    }
    return false;
  });
  await new Promise(r => setTimeout(r, 1000));

  // 找文件上传
  const fi = await page.$("input[type=file]");
  if (fi) {
    await fi.setInputFiles(path.join(process.cwd(), "qr.jpg"));
    console.log("✅ 二维码图片已上传");
  } else {
    console.log("⚠️ 未找到文件上传按钮，请手动上传二维码图片");
  }

  console.log("");
  console.log("=================================");
  console.log("✅ 自动化完成！");
  console.log("1. 检查标题和正文是否完整");
  console.log("2. 确认二维码已插入");
  console.log("3. 手动点「发布」按钮");
  console.log("=================================");
})();
