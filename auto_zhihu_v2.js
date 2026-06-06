const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  // 读取文章内容
  const article = fs.readFileSync("zhihu_article_1.md", "utf-8");
  // 读取二维码 base64
  const qrBase64 = fs.readFileSync("qr_base64.txt", "utf-8");
  
  console.log("✅ 文章已读取，长度:", article.length);
  console.log("✅ 二维码 base64 已读取，长度:", qrBase64.length);

  // 启动浏览器（连接到已有的浏览器实例）
  // 用 CDP 方式连接 Chrome/Edge
  const browser = await chromium.launch({
    headless: false,
    channel: "msedge",
    args: ["--remote-debugging-port=9222"]
  });

  const page = await browser.newPage();
  
  // 先去知乎首页看看是否已登录
  await page.goto("https://www.zhihu.com");
  await page.waitForTimeout(2000);
  
  // 检查是否登录
  const isLoggedIn = await page.evaluate(() => {
    return document.cookie.includes("z_c0") || document.querySelector(".AppHeader-userInfo") !== null;
  });
  
  console.log("登录状态:", isLoggedIn ? "✅ 已登录" : "❌ 未登录");
  
  if (!isLoggedIn) {
    console.log("请手动登录...");
    await page.goto("https://www.zhihu.com/signin");
    // 等待登录，检测到首页出现用户信息
    await page.waitForSelector(".AppHeader-userInfo", { timeout: 60000 });
    console.log("✅ 登录成功");
  }

  // 打开文章编辑页
  await page.goto("https://www.zhihu.com/editor");
  await page.waitForTimeout(3000);
  
  console.log("✅ 编辑器页面已打开");
  console.log("");
  console.log("==========================================");
  console.log("请手动操作：");
  console.log("1. 将文章内容复制粘贴到编辑器");
  console.log("2. 在文章底部插入二维码图片（上传 qr.jpg）");
  console.log("3. 设置标题：GEO 是什么？跨境电商为什么现在就要做？");
  console.log("4. 点击发布");
  console.log("==========================================");
  console.log("");
  console.log("完成后按 Ctrl+C 退出");

  // 保持浏览器打开
  await new Promise(() => {});
})();
