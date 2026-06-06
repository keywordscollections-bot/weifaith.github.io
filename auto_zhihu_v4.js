const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  console.log("正在连接 Chrome（调试端口 9222）...");
  
  try {
    const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
    console.log("✅ 连接成功！");
    
    // 获取默认浏览器上下文
    const defaultContext = browser.contexts()[0];
    let pages = defaultContext.pages();
    
    // 看看有没有知乎编辑器页面
    let editorPage = pages.find(p => p.url().includes("zhihu.com/editor"));
    
    if (!editorPage) {
      // 找知乎页面
      let zhihuPage = pages.find(p => p.url().includes("zhihu.com"));
      if (!zhihuPage) {
        // 新建标签页
        zhihuPage = await defaultContext.newPage();
      }
      await zhihuPage.goto("https://www.zhihu.com/editor");
      editorPage = zhihuPage;
      await new Promise(r => setTimeout(r, 3000));
    }
    
    console.log("✅ 编辑器页面 URL:", editorPage.url());
    
    // 读取文章内容
    const article = fs.readFileSync("zhihu_article_1.md", "utf-8");
    
    // 填入标题
    await editorPage.evaluate(() => {
      const titleArea = document.querySelector('[contenteditable="true"][data-placeholder*="标题"]') ||
                        document.querySelector('[contenteditable="true"][placeholder*="标题"]') ||
                        document.querySelector(".title");
      if (titleArea) {
        titleArea.focus();
        titleArea.textContent = "";
      }
    });
    await new Promise(r => setTimeout(r, 500));
    
    // 用 keyboard 输入标题
    await editorPage.keyboard.type("GEO 是什么？跨境电商为什么现在就要做？", { delay: 30 });
    console.log("✅ 标题已填入");
    
    // 按回车进入正文
    await editorPage.keyboard.press("Enter");
    await new Promise(r => setTimeout(r, 300));
    
    // 填入正文（逐段粘贴）
    const paragraphs = article.split("\n").filter(p => p.trim());
    for (const para of paragraphs) {
      // 跳过标题行（第一行）和二维码占位符
      if (para.startsWith("# GEO") || para.includes("此处放你的微信二维码")) continue;
      
      const text = para.replace(/\*\*/g, "").replace(/^#+ /, "").replace(/^\d+\. /, "").trim();
      if (!text) continue;
      
      // 处理 markdown 图片标记
      if (text.startsWith("![")) {
        await editorPage.keyboard.press("Enter");
        continue;
      }
      
      await editorPage.keyboard.type(text, { delay: 5 });
      await editorPage.keyboard.press("Enter");
      await new Promise(r => setTimeout(r, 100));
    }
    
    console.log("✅ 正文已填入");
    
    // 上传二维码图片
    // 查找文件上传 input
    // 先点击图片按钮
    await editorPage.evaluate(() => {
      // 找上传图片的按钮
      const buttons = document.querySelectorAll("button");
      for (const btn of buttons) {
        if (btn.textContent.includes("图片") || btn.getAttribute("aria-label")?.includes("图片")) {
          btn.click();
          return;
        }
      }
      // 或者找 toolbar 里的图片图标
      const imgIcon = document.querySelector('[class*="ImageButton"]') || 
                      document.querySelector('[data-tool="image"]');
      if (imgIcon) imgIcon.click();
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    // 找到文件 input 并上传
    const fileInput = await editorPage.$("input[type=file]");
    if (fileInput) {
      const qrPath = path.join(process.cwd(), "qr.jpg");
      await fileInput.setInputFiles(qrPath);
      console.log("✅ 二维码图片已上传");
      await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log("");
    console.log("==========================================");
    console.log("✅ 自动化完成！请检查：");
    console.log("1. 标题是否正确：GEO 是什么？跨境电商为什么现在就要做？");
    console.log("2. 正文内容是否完整");
    console.log("3. 二维码图片是否已插入");
    console.log("4. 确认无误后手动点「发布」按钮");
    console.log("==========================================");
    
  } catch (err) {
    console.log("❌ 连接失败:", err.message);
    console.log("");
    console.log("请按以下步骤操作：");
    console.log("1. 完全关闭 Chrome");
    console.log("2. Win+R 输入:");
    console.log('   "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222');
    console.log("3. 打开知乎并登录，点写文章");
    console.log("4. 告诉我「好了」");
  }
})();

