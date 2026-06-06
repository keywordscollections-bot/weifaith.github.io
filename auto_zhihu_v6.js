const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  console.log("正在连接已运行的 Chrome（端口 9222）...");
  
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  console.log("✅ 连接成功！");
  
  const defaultContext = browser.contexts()[0];
  const pages = defaultContext.pages();
  
  console.log(`当前 ${pages.length} 个标签页:`);
  for (const p of pages) {
    console.log("  " + p.url().substring(0, 80));
  }
  
  // 找知乎页面
  let zhihuPage = pages.find(p => p.url().includes("zhihu.com"));
  
  if (!zhihuPage) {
    zhihuPage = await defaultContext.newPage();
    await zhihuPage.goto("https://www.zhihu.com/editor");
    await new Promise(r => setTimeout(r, 3000));
  }
  
  // 打开编辑器
  await zhihuPage.goto("https://www.zhihu.com/editor");
  await new Promise(r => setTimeout(r, 3000));
  
  console.log("✅ 编辑器页面已打开");
  
  // 读取文章
  const article = fs.readFileSync("zhihu_article_1.md", "utf-8");
  
  // 尝试用鼠标点击编辑器区域来聚焦
  await zhihuPage.mouse.click(400, 300);
  await new Promise(r => setTimeout(r, 500));
  
  // 清除已有内容 - 按 Ctrl+A 再 Delete
  await zhihuPage.keyboard.press("Control+a");
  await new Promise(r => setTimeout(r, 200));
  await zhihuPage.keyboard.press("Delete");
  await new Promise(r => setTimeout(r, 500));
  
  // 输入标题
  await zhihuPage.keyboard.type("GEO 是什么？跨境电商为什么现在就要做？", { delay: 20 });
  console.log("✅ 标题已输入");
  
  // 回车到正文
  await zhihuPage.keyboard.press("Enter");
  await new Promise(r => setTimeout(r, 300));
  
  // 处理文章内容
  let cleanContent = article
    .replace(/^# GEO.*$/m, "")
    .replace(/\*此处放你的微信二维码\*/gi, "")
    .replace(/\*\*/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .trim();
  
  // 按行输入
  const lines = cleanContent.split("\n").filter(l => l.trim());
  let charCount = 0;
  
  for (const line of lines) {
    const text = line.trim();
    if (!text) continue;
    
    // 如果是 Markdown 标题（## xxx），直接输入文字
    const cleanText = text.replace(/^#{1,3}\s+/, "").replace(/^\d+\.\s+/, "");
    
    await zhihuPage.keyboard.type(cleanText, { delay: 2 });
    charCount += cleanText.length;
    
    // 段落末尾按回车
    await zhihuPage.keyboard.press("Enter");
    await new Promise(r => setTimeout(r, 50));
  }
  
  console.log(`✅ 正文已输入，共 ${charCount} 字符`);
  
  // 上传二维码
  // 先回到文章末尾
  await zhihuPage.keyboard.press("Control+End");
  await new Promise(r => setTimeout(r, 300));
  await zhihuPage.keyboard.press("Enter");
  
  // 找上传图片的按钮
  await zhihuPage.evaluate(() => {
    // 尝试点击工具栏的图片按钮
    const buttons = document.querySelectorAll("button");
    for (const btn of buttons) {
      if (btn.textContent.includes("图片") || 
          btn.innerHTML.includes("image") ||
          btn.getAttribute("aria-label")?.includes("图")) {
        btn.click();
        return true;
      }
    }
    // 或者找其他选择器
    const imgBtn = document.querySelector('[class*="ImageButton"]') ||
                   document.querySelector('[data-tool="image"]');
    if (imgBtn) {
      imgBtn.click();
      return true;
    }
    return false;
  });
  
  await new Promise(r => setTimeout(r, 1500));
  
  // 找文件输入框上传
  const fileInput = await zhihuPage.$("input[type=file]");
  if (fileInput) {
    await fileInput.setInputFiles(path.join(process.cwd(), "qr.jpg"));
    console.log("✅ 二维码图片已上传");
  } else {
    console.log("⚠️ 未找到文件输入框，请手动上传二维码图片");
  }
  
  console.log("");
  console.log("==========================================");
  console.log("✅ 自动化完成！请检查：");
  console.log("1. 标题：GEO 是什么？跨境电商为什么现在就要做？");
  console.log("2. 正文内容是否完整");
  console.log("3. 二维码是否已插入");
  console.log("4. 确认无误后手动点「发布」");
  console.log("==========================================");
})();
