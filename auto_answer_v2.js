// ============================================================
// 知乎批量回答发布脚本 v2.1
// 功能：
//   1. 从 target_urls.txt 读取问题
//   2. 从 test_save/{问题ID}.txt 匹配文章
//   3. 若无匹配，从现有 Blog HTML 提取内容作为回答
//   4. 自动打开问题页面 → 填写回答 → 发布
//   5. 记录进度到 progress.json，支持断点续传
// 用法：node auto_answer_v2.js
//       先确保浏览器以 --remote-debugging-port=9222 启动
// ============================================================

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

// ========== 配置 ==========
const CONFIG = {
  CDP_URL: "http://127.0.0.1:9222",
  TARGET_URLS_FILE: "target_urls.txt",
  ARTICLES_DIR: "test_save",
  PROGRESS_FILE: "progress.json",
  ANSWER_FILE: "article_content.txt",
  BLOG_DIR: "blog",               // 从Blog中提取备选内容
};

// ========== 进度管理 ==========
function loadProgress() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG.PROGRESS_FILE, "utf-8"));
  } catch {
    return { completed: [], failed: [], currentIndex: 0, startedAt: null };
  }
}

function saveProgress(progress) {
  fs.writeFileSync(CONFIG.PROGRESS_FILE, JSON.stringify(progress, null, 2), "utf-8");
}

// ========== 读取目标URL ==========
function loadTargetUrls() {
  try {
    const data = fs.readFileSync(CONFIG.TARGET_URLS_FILE, "utf-8");
    return data.split("\n")
      .map(l => l.trim())
      .filter(l => l.length > 0 && l.startsWith("http"));
  } catch (e) {
    console.error("无法读取 " + CONFIG.TARGET_URLS_FILE + ": " + e.message);
    return [];
  }
}

// ========== 从Blog HTML提取纯文本 ==========
function extractTextFromBlog(filePath) {
  try {
    const html = fs.readFileSync(filePath, "utf-8");
    // 提取 <article> 或 <body> 内的文本
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/);
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
    const content = articleMatch ? articleMatch[1] : (bodyMatch ? bodyMatch[1] : html);
    
    // 去除HTML标签
    let text = content
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, "\"")
      .replace(/\s+/g, " ")
      .trim();
    
    return text;
  } catch (e) {
    return null;
  }
}

// ========== 读取文章 ==========
function loadArticleForQuestion(questionUrl) {
  const match = questionUrl.match(/question\/(\d+)/);
  if (!match) {
    console.log("无法从URL提取问题ID: " + questionUrl);
    return null;
  }
  const qid = match[1];
  
  // 方式1：test_save/{qid}.txt
  const articlePath = path.join(CONFIG.ARTICLES_DIR, qid + ".txt");
  if (fs.existsSync(articlePath)) {
    console.log("读取文章: " + articlePath);
    return fs.readFileSync(articlePath, "utf-8");
  }
  
  // 方式2：test_save/{qid}.md
  const mdPath = path.join(CONFIG.ARTICLES_DIR, qid + ".md");
  if (fs.existsSync(mdPath)) {
    console.log("读取文章: " + mdPath);
    return fs.readFileSync(mdPath, "utf-8");
  }
  
  // 方式3：从Blog目录随机挑一篇提取内容
  if (fs.existsSync(CONFIG.BLOG_DIR)) {
    const files = fs.readdirSync(CONFIG.BLOG_DIR).filter(f => f.endsWith(".html") && f !== "index.html");
    if (files.length > 0) {
      const randomFile = files[Math.floor(Math.random() * files.length)];
      const randomPath = path.join(CONFIG.BLOG_DIR, randomFile);
      const text = extractTextFromBlog(randomPath);
      if (text && text.length > 100) {
        console.log("从Blog提取内容: " + randomPath + " (" + text.length + " chars)");
        return text;
      }
    }
  }
  
  // 方式4：默认回答文件
  if (fs.existsSync(CONFIG.ANSWER_FILE)) {
    console.log("使用默认回答文件: " + CONFIG.ANSWER_FILE);
    return fs.readFileSync(CONFIG.ANSWER_FILE, "utf-8");
  }
  
  return null;
}

// ========== 发布回答到单个问题 ==========
async function publishAnswer(page, questionUrl, articleContent) {
  console.log("\n打开问题: " + questionUrl);
  await page.goto(questionUrl, { timeout: 20000, waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 3000));
  
  // 点击"写回答"
  const clickedWrite = await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const btn of btns) {
      if (btn.textContent.includes("写回答") && btn.offsetParent !== null) {
        btn.click();
        return true;
      }
    }
    return false;
  });
  
  if (clickedWrite) {
    console.log("点击了写回答按钮");
  } else {
    console.log("未找到写回答按钮，尝试滚动到底部...");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 2000));
  }
  
  await new Promise(r => setTimeout(r, 3000));
  
  // 填写内容
  console.log("填写回答内容...");
  let cleanContent = articleContent
    .replace(/^#\s+.*$/gm, "")  // 去除Markdown标题
    .replace(/\*\*(.*?)\*\*/g, "$1")  // 去除加粗
    .replace(/---+/g, "")  // 去除分隔线
    .trim();
  
  // 如果太长，截取前3000字
  if (cleanContent.length > 3000) {
    cleanContent = cleanContent.substring(0, 3000) + "...\n\n（全文较长，建议点击查看完整内容）";
  }
  
  const filled = await page.evaluate((content) => {
    // 找可编辑区域
    const editor = document.querySelector("[contenteditable=true]") || 
                   document.querySelector(".DraftEditor-editorContainer [data-contents]") ||
                   document.querySelector(".PublicDraftEditor-content") ||
                   document.querySelector("[class*=ql-editor]");
    
    if (editor) {
      editor.innerHTML = "";
      const paragraphs = content.split("\n").filter(p => p.trim());
      for (const p of paragraphs) {
        const pEl = document.createElement("p");
        pEl.textContent = p.trim();
        editor.appendChild(pEl);
      }
      editor.dispatchEvent(new InputEvent("input", { bubbles: true }));
      editor.dispatchEvent(new Event("change", { bubbles: true }));
      return "editor_filled";
    }
    
    // textarea
    const ta = document.querySelector("textarea");
    if (ta && ta.offsetParent !== null) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      setter.call(ta, content);
      ta.dispatchEvent(new Event("input", { bubbles: true }));
      ta.dispatchEvent(new Event("change", { bubbles: true }));
      return "textarea_filled";
    }
    
    return "no_editor";
  }, cleanContent);
  
  console.log("填写结果: " + filled);
  await new Promise(r => setTimeout(r, 2000));
  
  // 点击发布
  console.log("查找发布按钮...");
  const published = await page.evaluate(() => {
    const selectors = ["button:has-text('发布回答')", "button:has-text('发布')", "button:has-text('提交回答')"];
    for (const sel of selectors) {
      try {
        const btns = document.querySelectorAll(sel);
        for (const b of btns) {
          if (b.offsetParent !== null && !b.disabled) {
            b.click();
            return "clicked";
          }
        }
      } catch(e) {}
    }
    return "no_button";
  });
  
  console.log("发布结果: " + published);
  
  if (published === "clicked") {
    console.log("回答已提交！");
    await new Promise(r => setTimeout(r, 3000));
    return true;
  }
  
  // Fallback: Playwright点击
  try {
    const publishBtn = page.locator("button").filter({ hasText: /发布回答|发布/ });
    if (await publishBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await publishBtn.first().click();
      console.log("Playwright点击发布按钮");
      await new Promise(r => setTimeout(r, 3000));
      return true;
    }
  } catch(e) {
    console.log("Playwright点击失败: " + e.message);
  }
  
  return false;
}

// ========== 主流程 ==========
(async () => {
  console.log("=".repeat(60));
  console.log("  知乎批量回答发布脚本 v2.1");
  console.log("=".repeat(60));
  
  const progress = loadProgress();
  const urls = loadTargetUrls();
  
  if (urls.length === 0) {
    console.error("target_urls.txt 中没有找到URL");
    console.log("请创建该文件，每行一个知乎问题链接");
    process.exit(1);
  }
  
  if (!progress.startedAt) {
    progress.startedAt = new Date().toISOString();
  }
  
  console.log("\n共 " + urls.length + " 个问题待处理");
  console.log("已完成: " + progress.completed.length + ", 失败: " + progress.failed.length);
  console.log("当前进度索引: " + progress.currentIndex);
  
  // 连接浏览器
  console.log("\n连接浏览器...");
  const browser = await chromium.connectOverCDP(CONFIG.CDP_URL);
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log("当前页面: " + page.url());
  
  // 确认登录
  if (page.url().includes("signin") || page.url() === "about:blank") {
    console.log("未检测到登录，尝试导航到知乎...");
    await page.goto("https://www.zhihu.com/", { timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    
    for (let i = 0; i < 60; i++) {
      const url = page.url();
      if (!url.includes("signin") && !url.includes("login")) {
        console.log("检测到登录成功");
        break;
      }
      process.stdout.write(".");
      await new Promise(r => setTimeout(r, 1000));
    }
    console.log("");
  }
  
  console.log("登录确认完成，开始处理...");
  
  // 主循环
  for (let i = progress.currentIndex; i < urls.length; i++) {
    const questionUrl = urls[i];
    
    console.log("\n" + "=".repeat(60));
    console.log("[" + (i+1) + "/" + urls.length + "] " + questionUrl);
    
    if (progress.completed.includes(questionUrl)) {
      console.log("  已跳过（之前已完成）");
      progress.currentIndex = i + 1;
      saveProgress(progress);
      continue;
    }
    
    const article = loadArticleForQuestion(questionUrl);
    if (!article || article.trim().length < 50) {
      console.log("未找到合适文章，跳过");
      progress.failed.push(questionUrl + " (no_content)");
      progress.currentIndex = i + 1;
      saveProgress(progress);
      continue;
    }
    
    console.log("文章长度: " + article.length + " 字符");
    
    try {
      const success = await publishAnswer(page, questionUrl, article);
      if (success) {
        console.log("回答发布成功！");
        progress.completed.push(questionUrl);
      } else {
        console.log("回答发布可能失败，请检查浏览器页面");
        progress.failed.push(questionUrl + " (publish_failed)");
        await new Promise(r => setTimeout(r, 5000));
      }
    } catch (e) {
      console.error("错误: " + e.message);
      progress.failed.push(questionUrl + " (error: " + e.message.substring(0, 50) + ")");
    }
    
    progress.currentIndex = i + 1;
    saveProgress(progress);
    
    // 休息
    const restMs = 3000 + Math.random() * 4000;
    console.log("休息 " + (restMs/1000).toFixed(1) + " 秒...");
    await new Promise(r => setTimeout(r, restMs));
  }
  
  console.log("\n所有问题处理完成！");
  console.log("成功: " + progress.completed.length);
  console.log("失败: " + progress.failed.length);
  console.log("进度已���存到 " + CONFIG.PROGRESS_FILE);
  
  await browser.close();
})();
