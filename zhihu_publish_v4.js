const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const FILE = "geo_2026_v2.md";
const PORT = "9222";

const article = fs.readFileSync(FILE, "utf-8");
const lines = article.split("\n");

let title = "";
let bodyLines = [];
let foundTitle = false;
for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith("# ") && !foundTitle) {
    title = trimmed.replace(/^#\s+/, "");
    foundTitle = true;
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

// 生成纯文本
let cleanParagraphs = [];
let currentPara = "";
for (const line of bodyLines) {
  const t = line.trim();
  if (!t) {
    if (currentPara.trim()) { cleanParagraphs.push(currentPara.trim()); currentPara = ""; }
    continue;
  }
  if (t.match(/^!\[.*\]\(.*\)$/)) continue;
  if (t.includes("二维码")) continue;
  
  let clean = t.replace(/^#{1,3}\s+/, "").replace(/\*\*/g, "").replace(/\[(.+?)\]\(.+?\)/g, "$1").trim();
  currentPara += (currentPara ? " " : "") + clean;
}
if (currentPara.trim()) cleanParagraphs.push(currentPara.trim());

// 加上联系方式
cleanParagraphs.push("如果你对GEO加跨境电商的实战策略感兴趣，欢迎交流。");
cleanParagraphs.push("微信号：xxxxxx（加微信备注 GEO跨境）");

// 组装成带换行的纯文本
const fullText = cleanParagraphs.join("\n");

console.log("标题:", title);
console.log("全文:", fullText.length, "字符,", cleanParagraphs.length, "段");

(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:" + PORT);
  const ctx = browser.contexts()[0];
  
  for (const p of ctx.pages()) {
    if (p.url().includes("zhuanlan.zhihu.com/write")) await p.close();
  }
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
  
  // 聚焦编辑器
  await page.evaluate(() => {
    const editor = document.querySelector("[contenteditable=true]");
    if (editor) editor.focus();
  });
  await new Promise(r => setTimeout(r, 500));
  
  // 用剪贴板方式: 先把内容写入剪贴板，然后粘贴
  // 但更好的方式是用 page.fill 或者直接操作 Draft.js 内部状态
  
  // 方案：page.keyboard.type 逐段输入，利用知乎编辑器自带的 keyDown 处理
  for (let i = 0; i < cleanParagraphs.length; i++) {
    const text = cleanParagraphs[i];
    await page.keyboard.type(text, { delay: 5 });
    if (i < cleanParagraphs.length - 1) {
      await page.keyboard.press("Enter");
      await new Promise(r => setTimeout(r, 150));
    }
  }
  
  console.log("✅ 正文已键入");
  await new Promise(r => setTimeout(r, 1000));
  
  // 确认编辑器有内容
  const editorLen = await page.evaluate(() => {
    const editor = document.querySelector("[contenteditable=true]");
    return editor ? editor.textContent.length : 0;
  });
  console.log("编辑器内容长度:", editorLen);
  
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
  await new Promise(r => setTimeout(r, 500));
  
  // 发布
  await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      if (b.textContent.trim() === "发布" && !b.disabled) { b.click(); return; }
    }
  });
  console.log("✅ 已点击发布");
  await new Promise(r => setTimeout(r, 5000));
  
  const url = page.url();
  console.log("发布后URL:", url.substring(0, 100));
  
  if (url.includes("/p/") && !url.includes("write")) {
    console.log("🎉 发布成功！🔗 " + url.split("?")[0]);
  } else {
    // 可能弹窗确认
    await page.evaluate(() => {
      const btns = document.querySelectorAll("button");
      for (const b of btns) {
        const t = b.textContent.trim();
        if ((t === "确定" || t === "确认" || t === "发布") && !b.disabled) { b.click(); return; }
      }
    });
    await new Promise(r => setTimeout(r, 3000));
    const url2 = page.url();
    console.log("最终URL:", url2.substring(0, 100));
    if (url2.includes("/p/") && !url2.includes("write")) console.log("🎉 发布成功！🔗 " + url2.split("?")[0]);
  }
  
  await browser.close();
})();
