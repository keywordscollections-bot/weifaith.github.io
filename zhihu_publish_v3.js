const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const FILE = "geo_2026_v2.md";
const PORT = "9222";

const article = fs.readFileSync(FILE, "utf-8");
const lines = article.split("\n");

// 提取标题
let title = "";
let bodyLines = [];
let foundTitle = false;
for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith("# ") && !foundTitle) {
    title = trimmed.replace(/^#\s+/, "");
    foundTitle = true;
  } else if (!foundTitle) {
    bodyLines.push(line);
  } else {
    bodyLines.push(line);
  }
}
if (!title) {
  for (const line of lines) {
    const t = line.trim();
    if (t) { title = t; break; }
  }
}

// 清理正文，生成干净文本
let cleanText = "";
for (const line of bodyLines) {
  const trimmed = line.trim();
  if (!trimmed) {
    cleanText += "\n";
    continue;
  }
  if (trimmed.match(/^!\[.*\]\(.*\)$/)) continue;
  if (trimmed.includes("此处放你的微信二维码")) continue;
  
  let clean = trimmed
    .replace(/^#{1,3}\s+/, "")
    .replace(/\*\*/g, "")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .trim();
  
  cleanText += clean + "\n";
}

// 去除首尾多余的换行
cleanText = cleanText.replace(/\n{3,}/g, "\n\n").trim();

console.log("📌 标题:", title);
console.log("📝 正文:", cleanText.length, "字符");
console.log("段落数:", cleanText.split("\n").filter(l => l.trim()).length);

(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:" + PORT);
  const ctx = browser.contexts()[0];
  
  // 关掉旧页面，打开新的写文章页
  let oldPage = ctx.pages().find(p => p.url().includes("zhuanlan.zhihu.com/write"));
  if (oldPage) await oldPage.close();
  await new Promise(r => setTimeout(r, 500));
  
  const page = await ctx.newPage();
  await page.goto("https://zhuanlan.zhihu.com/write");
  await new Promise(r => setTimeout(r, 3000));
  
  console.log("✅ 写文章页面已打开");
  
  // 填标题
  await page.evaluate((t) => {
    const ta = document.querySelector("textarea");
    if (ta) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      setter.call(ta, t);
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }, title);
  await new Promise(r => setTimeout(r, 500));
  console.log("✅ 标题已填");
  
  // 关键是：完全替换编辑器内容
  // 把cleanText按段落分割，每段作为独立block写入
  const paragraphs = cleanText.split("\n").filter(p => p.trim());
  
  // 聚焦编辑器
  await page.evaluate(() => {
    const editor = document.querySelector("[contenteditable=true]");
    if (editor) editor.focus();
  });
  await new Promise(r => setTimeout(r, 300));
  
  // 先全选删除编辑器内容
  await page.evaluate(() => {
    const editor = document.querySelector("[contenteditable=true]");
    if (!editor) return;
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand("delete", false);
  });
  await new Promise(r => setTimeout(r, 300));
  
  // 验证编辑器为空
  const isEmpty = await page.evaluate(() => {
    const editor = document.querySelector("[contenteditable=true]");
    return editor ? editor.textContent.trim() === "" : false;
  });
  console.log("编辑器已清空:", isEmpty);
  
  // 逐段插入，严格按段落
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i].trim();
    if (!p) continue;
    
    await page.evaluate((text) => {
      document.execCommand("insertText", false, text);
    }, p);
    
    // 每段后按回车（最后一段不按，避免多余空行）
    if (i < paragraphs.length - 1) {
      await page.keyboard.press("Enter");
      await new Promise(r => setTimeout(r, 80));
    }
  }
  
  // 在末尾加空行，然后加联系方式
  await page.keyboard.press("Enter");
  await new Promise(r => setTimeout(r, 100));
  await page.keyboard.press("Enter");
  await new Promise(r => setTimeout(r, 100));
  await page.evaluate(() => {
    document.execCommand("insertText", false, "如果你对GEO加跨境电商的实战策略感兴趣，欢迎交流。");
  });
  await page.keyboard.press("Enter");
  await new Promise(r => setTimeout(r, 100));
  await page.evaluate(() => {
    document.execCommand("insertText", false, "微信号：xxxxxx（加微信备注 GEO跨境）");
  });
  
  console.log("✅ 正文已填入（不含重复）");
  await new Promise(r => setTimeout(r, 1000));
  
  // 设置语言
  await page.evaluate(() => {
    const inputs = document.querySelectorAll("input");
    for (const inp of inputs) {
      if (inp.placeholder && inp.placeholder.includes("语言")) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        setter.call(inp, "中文");
        inp.dispatchEvent(new Event("input", { bubbles: true }));
        inp.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
        break;
      }
    }
  });
  console.log("✅ 语言已设置");
  await new Promise(r => setTimeout(r, 500));
  
  // 发布
  await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      if (b.textContent.trim() === "发布" && !b.disabled) { b.click(); return; }
    }
  });
  console.log("✅ 已点击发布");
  await new Promise(r => setTimeout(r, 4000));
  
  const url = page.url();
  if (url.includes("zhuanlan.zhihu.com/p/") && !url.includes("write")) {
    console.log("🎉 文章发布成功！");
    console.log("🔗 链接: " + url.split("?")[0]);
  } else {
    console.log("📌 当前页面: " + url.substring(0, 100));
    // 可能有点确定弹窗
    await page.evaluate(() => {
      const btns = document.querySelectorAll("button");
      for (const b of btns) {
        const t = b.textContent.trim();
        if ((t === "确定" || t === "确认") && !b.disabled) { b.click(); return; }
      }
    });
    await new Promise(r => setTimeout(r, 2000));
    const url2 = page.url();
    if (url2.includes("zhuanlan.zhihu.com/p/") && !url2.includes("write")) {
      console.log("🎉 文章发布成功！");
      console.log("🔗 链接: " + url2.split("?")[0]);
    } else {
      console.log("📌 最终页面: " + url2.substring(0, 100));
    }
  }
  
  await browser.close();
})();
