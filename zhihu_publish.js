const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const FILE = process.env.FILE || "";
const PORT = process.env.PORT || "9222";

if (!FILE) {
  const mdFiles = fs.readdirSync(".").filter(f => f.endsWith(".md"));
  if (mdFiles.length) {
    // 排除旧的测试文件
    const sorted = mdFiles.sort((a, b) => fs.statSync(b).mtime - fs.statSync(a).mtime);
    process.env.FILE = sorted[0];
  }
}

const filePath = path.resolve(process.env.FILE);

console.log("📄 文件:", path.basename(filePath));

const article = fs.readFileSync(filePath, "utf-8");
const lines = article.split("\n");

// 提取标题 (第一个 # 开头的行)
let title = "";
let bodyLines = [];
let inTitle = true;

for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith("# ") && inTitle) {
    title = trimmed.replace(/^#\s+/, "");
    inTitle = false;
  } else {
    bodyLines.push(line);
  }
}

// 如果没有 # 标题，取第一段非空行
if (!title) {
  for (const line of lines) {
    const t = line.trim();
    if (t && !t.match(/^[=\-]{3,}$/)) { 
      title = t; 
      break; 
    }
  }
}

console.log("📌 标题:", title);

// 清理正文：去掉markdown标记，但保留段落结构
let cleanParagraphs = [];
let currentPara = "";

for (const line of bodyLines) {
  const trimmed = line.trim();
  
  // 跳空行 -> 分段
  if (!trimmed) {
    if (currentPara.trim()) {
      cleanParagraphs.push(currentPara.trim());
      currentPara = "";
    }
    continue;
  }
  
  // 跳图片行
  if (trimmed.match(/^!\[.*\]\(.*\)$/)) continue;
  if (trimmed.includes("此处放你的微信二维码")) continue;
  
  // 处理分隔线
  if (trimmed === "---") {
    if (currentPara.trim()) {
      cleanParagraphs.push(currentPara.trim());
      currentPara = "";
    }
    cleanParagraphs.push("---");
    continue;
  }
  
  // 清理markdown
  let clean = trimmed
    .replace(/^#{1,3}\s+/, "")   // markdown标题
    .replace(/^\*\*(.+)\*\*$/, "$1")  // **加粗**
    .replace(/\*\*/g, "")        // 行内加粗
    .replace(/^[\*\-\+]\s+/, "• ")  // 列表项
    .replace(/^\d+\.\s+/, "• ")  // 数字列表
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")  // 链接
    .trim();
  
  if (currentPara) {
    currentPara += " " + clean;
  } else {
    currentPara = clean;
  }
}
if (currentPara.trim()) {
  cleanParagraphs.push(currentPara.trim());
}

console.log("📝 段落:", cleanParagraphs.length, "段, 共", cleanParagraphs.join("").length, "字符");

(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:" + PORT);
  const ctx = browser.contexts()[0];
  
  // 打开新写文章页（确保从头开始，不继承旧内容）
  let page = ctx.pages().find(p => p.url().includes("zhuanlan.zhihu.com/write"));
  if (page) {
    await page.close();
    await new Promise(r => setTimeout(r, 500));
  }
  
  page = await ctx.newPage();
  await page.goto("https://zhuanlan.zhihu.com/write");
  await new Promise(r => setTimeout(r, 3000));
  
  console.log("✅ 写文章页面已打开");
  
  // === 填标题 ===
  await page.evaluate((t) => {
    const ta = document.querySelector("textarea");
    if (ta) {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      nativeSetter.call(ta, t);
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }, title);
  console.log("✅ 标题已填");
  await new Promise(r => setTimeout(r, 500));
  
  // === 清空编辑器（防止残留）===
  await page.evaluate(() => {
    const editor = document.querySelector("[contenteditable=true]");
    if (editor) {
      editor.focus();
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editor);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  });
  await new Promise(r => setTimeout(r, 200));
  
  // === 逐段填入（每段用回车分割）===
  for (let i = 0; i < cleanParagraphs.length; i++) {
    const para = cleanParagraphs[i];
    if (!para) continue;
    
    // 分隔线用回车代替
    if (para === "---") {
      await page.keyboard.press("Enter");
      await new Promise(r => setTimeout(r, 50));
      continue;
    }
    
    await page.evaluate((text) => {
      document.execCommand("insertText", false, text);
    }, para);
    
    // 段落结束按回车
    if (i < cleanParagraphs.length - 1) {
      await page.keyboard.press("Enter");
      await new Promise(r => setTimeout(r, 100));
    }
  }
  
  console.log("✅ 正文已填入");
  await new Promise(r => setTimeout(r, 1000));
  
  // === 设置语言 ===
  await page.evaluate(() => {
    const inputs = document.querySelectorAll("input");
    for (const inp of inputs) {
      if (inp.placeholder && inp.placeholder.includes("语言")) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeSetter.call(inp, "中文");
        inp.dispatchEvent(new Event("input", { bubbles: true }));
        inp.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
        break;
      }
    }
  });
  console.log("✅ 语言已设置");
  await new Promise(r => setTimeout(r, 500));
  
  // === 发布 ===
  const doPublish = process.env.NOPUBLISH !== "1";
  
  if (doPublish) {
    const pubBtn = await page.evaluate(() => {
      const btns = document.querySelectorAll("button");
      for (const b of btns) {
        if (b.textContent.trim() === "发布" && !b.disabled) {
          b.click();
          return true;
        }
      }
      return false;
    });
    
    if (!pubBtn) {
      console.log("⚠️ 发布按钮不可用");
      await browser.close();
      return;
    }
    
    console.log("✅ 已点击发布");
    await new Promise(r => setTimeout(r, 4000));
    
    const currentUrl = page.url();
    if (currentUrl.includes("zhuanlan.zhihu.com/p/") && !currentUrl.includes("write") && !currentUrl.includes("edit")) {
      const cleanUrl = currentUrl.split("?")[0];
      console.log("🎉 文章发布成功！");
      console.log("🔗 链接: " + cleanUrl);
    } else {
      // 可能有确认弹窗
      await page.evaluate(() => {
        const btns = document.querySelectorAll("button");
        for (const b of btns) {
          const t = b.textContent.trim();
          if ((t === "确定" || t === "确认" || t === "发布") && !b.disabled) { b.click(); return; }
        }
      });
      await new Promise(r => setTimeout(r, 3000));
      
      const url2 = page.url();
      if (url2.includes("zhuanlan.zhihu.com/p/") && !url2.includes("write")) {
        console.log("🎉 文章发布成功！");
        console.log("🔗 链接: " + url2.split("?")[0]);
      } else {
        console.log("📌 当前页面: " + url2.substring(0, 100));
      }
    }
  } else {
    console.log("✅ 预览模式（未发布）");
  }
  
  await browser.close();
})();
