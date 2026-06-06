const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const FILE = "geo_2026_v2.md";
let title = "";
const article = fs.readFileSync(FILE, "utf-8");

// 提取标题
for (const line of article.split("\n")) {
  const t = line.trim();
  if (t.startsWith("# ")) { title = t.replace(/^#\s+/, ""); break; }
}

// 提取并清理正文段落
let paragraphs = article.split("\n").map(l => l.trim()).filter(l => {
  if (!l) return false;
  if (l.startsWith("# ")) return false;
  if (l.match(/^!\[.*\]\(.*\)$/)) return false;
  if (l.includes("二维码")) return false;
  return true;
}).map(l => l.replace(/^#{1,3}\s+/, "").replace(/\*\*/g, "").replace(/\[(.+?)\]\(.+?\)/g, "$1").trim());

// 加联系方式
paragraphs.push("如果你对GEO加跨境电商的实战策略感兴趣，欢迎交流。");
paragraphs.push("微信号：xxxxxx（加微信备注 GEO跨境）");

console.log("标题:", title);
console.log("段落:", paragraphs.length, "段");

(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  
  // 关闭旧写文章页
  for (const p of ctx.pages()) {
    if (p.url().includes("zhuanlan.zhihu.com/write")) await p.close();
  }
  await new Promise(r => setTimeout(r, 300));
  
  const page = await ctx.newPage();
  await page.goto("https://zhuanlan.zhihu.com/write");
  await new Promise(r => setTimeout(r, 3000));
  console.log("✅ 页面打开");
  
  // 填标题
  await page.evaluate((t) => {
    const ta = document.querySelector("textarea");
    if (ta) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      setter.call(ta, t);
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }, title);
  await new Promise(r => setTimeout(r, 300));
  
  // 关键：通过修改editor内部数据来设置内容
  // 知乎编辑器是 Draft.js，我们可以直接操作 editorState
  const filled = await page.evaluate((paras) => {
    const editor = document.querySelector("[contenteditable=true]");
    if (!editor) return "no editor";
    
    // 方法1：直接替换innerHTML（知乎的Draft编辑器可能会识别）
    let html = "";
    for (const p of paras) {
      html += `<p>${p}</p>`;
    }
    editor.innerHTML = html;
    
    // 触发input事件让知乎检测到变化
    editor.dispatchEvent(new Event("input", { bubbles: true }));
    
    return "ok, length=" + editor.textContent.length;
  }, paragraphs);
  
  console.log("填充结果:", filled);
  await new Promise(r => setTimeout(r, 1000));
  
  // 检查
  const len = await page.evaluate(() => {
    const editor = document.querySelector("[contenteditable=true]");
    return editor ? editor.textContent.length : 0;
  });
  console.log("编辑器内容:", len, "字符");
  
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
  await new Promise(r => setTimeout(r, 300));
  
  // 发布
  await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      if (b.textContent.trim() === "发布" && !b.disabled) {
        b.click();
        return "clicked";
      }
    }
    return "not found";
  });
  console.log("发布按钮已点击");
  await new Promise(r => setTimeout(r, 5000));
  
  const url = page.url();
  console.log("当前URL:", url.substring(0, 100));
  
  await browser.close();
})();
