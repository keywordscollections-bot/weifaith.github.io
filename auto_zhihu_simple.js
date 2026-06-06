const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  console.log("连接 Chrome（端口 9222）...");
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  console.log("✅ 已连接");

  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  // 找已有知乎页面或新建
  let page = pages.find(p => p.url().includes("zhihu"));
  if (!page) {
    page = await ctx.newPage();
    await page.goto("https://zhihu.com");
    console.log("已打开知乎首页，请手动登录后按回车继续");
    
    const readline = require("readline");
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    await new Promise(resolve => rl.question("登录好了吗？按回车继续: ", () => { rl.close(); resolve(); }));
  }

  // 打开编辑器
  await page.goto("https://www.zhihu.com/editor");
  await new Promise(r => setTimeout(r, 3000));
  console.log("编辑器已打开");

  // 读取文章
  const article = fs.readFileSync("zhihu_article_1.md", "utf-8");

  // 点击编辑器区域
  await page.mouse.click(500, 300);
  await new Promise(r => setTimeout(r, 300));

  // Ctrl+A 全选后删除
  await page.keyboard.press("Control+a");
  await new Promise(r => setTimeout(r, 200));
  await page.keyboard.press("Delete");
  await new Promise(r => setTimeout(r, 500));

  // 输入标题
  await page.keyboard.type("GEO 是什么？跨境电商为什么现在就要做？", { delay: 20 });
  console.log("✅ 标题完成");

  await page.keyboard.press("Enter");
  await new Promise(r => setTimeout(r, 300));

  // 清理并输入正文
  const text = article
    .replace(/^# GEO.*$/m, "")
    .replace(/\*此处放你的微信二维码\*/g, "")
    .replace(/\*\*/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .trim();

  const lines = text.split("\n").filter(l => l.trim());
  for (const line of lines) {
    const clean = line.replace(/^#{1,3}\s+/, "").replace(/^\d+\.\s+/, "").trim();
    if (clean) {
      await page.keyboard.type(clean, { delay: 2 });
      await page.keyboard.press("Enter");
      await new Promise(r => setTimeout(r, 50));
    }
  }
  console.log("✅ 正文完成");

  // 上传二维码 - 点击工具栏图片按钮
  await page.evaluate(() => {
    const btn = document.querySelector('[class*="ImageButton"], [data-tool="image"], button[aria-label*="图片"], button:has(svg)');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // 找文件输入
  const fi = await page.$("input[type=file]");
  if (fi) {
    await fi.setInputFiles(path.join(process.cwd(), "qr.jpg"));
    console.log("✅ 二维码已上传");
  } else {
    console.log("⚠️ 找不到文件输入框，请手动上传二维码");
  }

  console.log("\n✅ 全部完成！请手动检查并点击「发布」");
})();
