const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

(async () => {
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const args = ["--remote-debugging-port=9222", "--no-first-run"];
  
  console.log("正在启动 Chrome（调试模式）...");
  
  // 先杀掉所有旧的 Chrome 进程
  try {
    require("child_process").execSync("taskkill /f /im chrome.exe 2>nul", { stdio: "ignore" });
    console.log("✅ 已关闭旧 Chrome 进程");
    await new Promise(r => setTimeout(r, 1000));
  } catch(e) {}
  
  // 启动 Chrome
  const chromeProcess = spawn(chromePath, args, {
    detached: true,
    stdio: "ignore"
  });
  chromeProcess.unref();
  console.log("✅ Chrome 已启动，等待 3 秒...");
  await new Promise(r => setTimeout(r, 3000));
  
  // 连接
  console.log("正在连接 Chrome...");
  let browser;
  for (let i = 0; i < 10; i++) {
    try {
      browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
      console.log("✅ 连接成功！");
      break;
    } catch(e) {
      console.log(`尝试 ${i+1}/10...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  if (!browser) {
    console.log("❌ 无法连接 Chrome");
    return;
  }
  
  const defaultContext = browser.contexts()[0];
  const page = await defaultContext.newPage();
  
  // 打开知乎登录
  console.log("正在打开知乎...");
  await page.goto("https://www.zhihu.com/signin");
  
  console.log("");
  console.log("==========================================");
  console.log("请在浏览器中手动登录知乎");
  console.log("登录成功后，回到这里输入 'ok' 继续");
  console.log("==========================================");
  console.log("");
  
  // 等待用户输入
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  await new Promise((resolve) => {
    rl.question("登录好了吗？输入 ok 继续: ", (answer) => {
      rl.close();
      resolve();
    });
  });
  
  console.log("正在打开编辑器...");
  await page.goto("https://www.zhihu.com/editor");
  await new Promise(r => setTimeout(r, 3000));
  
  // 读取文章
  const article = fs.readFileSync("zhihu_article_1.md", "utf-8");
  
  // 填入标题
  await page.evaluate(() => {
    const titleInput = document.querySelector('[data-placeholder*="标题"]') || 
                       document.querySelector('[contenteditable="true"]');
    if (titleInput) {
      titleInput.focus();
      titleInput.textContent = "";
    }
  });
  await new Promise(r => setTimeout(r, 500));
  
  // 用更稳定的方式：通过 JS 直接设置
  await page.evaluate((title) => {
    const editor = document.querySelector(".DraftEditor-root") || 
                   document.querySelector('[contenteditable="true"]');
    if (editor) {
      editor.focus();
    }
  }, "");
  
  // 输入标题
  await page.keyboard.type("GEO 是什么？跨境电商为什么现在就要做？", { delay: 20 });
  console.log("✅ 标题已填入");
  
  await page.keyboard.press("Enter");
  await new Promise(r => setTimeout(r, 500));
  
  // 输入正文
  const cleanArticle = article
    .replace(/^# GEO.*$/m, "")      // 去掉标题行
    .replace(/\*此处放你的微信二维码\*/g, "")  // 去掉二维码占位符
    .replace(/\*\*/g, "")           // 去掉加粗标记
    .replace(/!\[.*?\]\(.*?\)/g, "") // 去掉图片标记
    .trim();
  
  // 逐行输入
  const lines = cleanArticle.split("\n").filter(l => l.trim());
  for (const line of lines) {
    await page.keyboard.type(line.trim(), { delay: 3 });
    await page.keyboard.press("Enter");
    await new Promise(r => setTimeout(r, 80));
  }
  
  console.log("✅ 正文已填入");
  
  // 上传二维码
  await page.evaluate(() => {
    const imgBtn = document.querySelector('[aria-label="图片"]') ||
                   document.querySelector('[data-tool="image"]') ||
                   document.querySelector('[class*="ImageButton"]');
    if (imgBtn) imgBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  const fileInput = await page.$("input[type=file]");
  if (fileInput) {
    await fileInput.setInputFiles(path.join(process.cwd(), "qr.jpg"));
    console.log("✅ 二维码已上传");
  }
  
  console.log("");
  console.log("==========================================");
  console.log("✅ 自动化完成！请检查：");
  console.log("1. 标题是否正确");
  console.log("2. 内容是否完整");
  console.log("3. 二维码是否已插入");
  console.log("4. 手动点「发布」按钮");
  console.log("==========================================");
  
})();
