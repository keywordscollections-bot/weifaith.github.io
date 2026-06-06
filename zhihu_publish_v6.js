const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const FILE = "geo_2026_v2.md";
let title = "";

const lines = fs.readFileSync(FILE, "utf-8").split("\n");
for (const l of lines) {
  const t = l.trim();
  if (t.startsWith("# ")) { title = t.replace(/^#\s+/, ""); break; }
}

// 清理出纯文本段落
let paragraphs = [];
let current = "";
for (const l of lines) {
  const t = l.trim();
  if (!t || t.startsWith("# ")) { 
    if (current) { paragraphs.push(current); current = ""; }
    continue; 
  }
  if (t.match(/^!\[.*\]\(.*\)$/)) continue;
  if (t.includes("二维码")) continue;
  let clean = t.replace(/^#{1,3}\s+/, "").replace(/\*\*/g, "").replace(/\[(.+?)\]\(.+?\)/g, "$1").trim();
  current += (current ? " " : "") + clean;
}
if (current) paragraphs.push(current);

// 加联系方式
paragraphs.push("如果你对GEO加跨境电商的实战策略感兴趣，欢迎交流。");
paragraphs.push("微信号：xxxxxx（加微信备注 GEO跨境）");

console.log("标题:", title);
console.log("段落:", paragraphs.length);

(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  
  for (const p of ctx.pages()) {
    if (p.url().includes("zhuanlan.zhihu.com/write")) await p.close();
  }
  await new Promise(r => setTimeout(r, 300));
  
  const page = await ctx.newPage();
  await page.goto("https://zhuanlan.zhihu.com/write");
  await new Promise(r => setTimeout(r, 3000));
  console.log("✅ 页面打开");
  
  // 标题
  await page.evaluate((t) => {
    const ta = document.querySelector("textarea");
    if (ta) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      setter.call(ta, t);
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }, title);
  await new Promise(r => setTimeout(r, 300));
  console.log("✅ 标题");
  
  // 聚焦编辑器
  await page.focus("[contenteditable=true]");
  await new Promise(r => setTimeout(r, 300));
  
  // 先清空
  await page.evaluate(() => {
    const editor = document.querySelector("[contenteditable=true]");
    if (!editor) return;
    editor.focus();
    const sel = window.getSelection();
    const r = document.createRange();
    r.selectNodeContents(editor);
    sel.removeAllRanges();
    sel.addRange(r);
  });
  
  // 逐段 type 输入
  for (let i = 0; i < paragraphs.length; i++) {
    await page.keyboard.type(paragraphs[i], { delay: 10 });
    if (i < paragraphs.length - 1) {
      await page.keyboard.press("Enter", { delay: 100 });
    }
  }
  
  console.log("✅ 正文已输入");
  await new Promise(r => setTimeout(r, 1000));
  
  // 检查编辑器内容
  const editorLen = await page.evaluate(() => {
    const editor = document.querySelector("[contenteditable=true]");
    return editor ? editor.textContent.length : 0;
  });
  console.log("编辑器内容:", editorLen, "字符");
  
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
  
  console.log("✅ 语言已设");
  await new Promise(r => setTimeout(r, 300));
  
  // 发布
  const btnResult = await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      if (b.textContent.trim() === "发布" && !b.disabled) {
        b.click();
        return "ok";
      }
    }
    return "no btn";
  });
  console.log("发布按钮:", btnResult);
  
  // 等待跳转
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const cur = page.url();
    if (cur.includes("/p/") && !cur.includes("write")) {
      console.log("🎉 发布成功！");
      console.log("🔗 " + cur.split("?")[0]);
      break;
    }
    // 弹窗确认
    if (i < 5) {
      await page.evaluate(() => {
        const btns = document.querySelectorAll("button");
        for (const b of btns) {
          const t = b.textContent.trim();
          if ((t === "确定" || t === "确认" || t === "发布") && !b.disabled) { b.click(); return; }
        }
      });
    }
  }
  
  console.log("最终URL:", page.url().substring(0, 90));
  
  // 验证
  const finalUrl = page.url().split("?")[0];
  if (finalUrl.includes("/p/") && !finalUrl.includes("write") && !finalUrl.includes("edit")) {
    // 再次验证文章内容
    const text = await page.evaluate(() => {
      const el = document.querySelector(".Post-RichText, .RichText") || document.body;
      return el.innerText;
    });
    console.log("文章字符:", text.length);
    const firstPara = "2025年，GEO还只是一个少数人关注的概念";
    const regex = new RegExp(firstPara.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    const count = (text.match(regex) || []).length;
    console.log("首段重复:", count + "次");
    if (count <= 1 && text.length > 1000) console.log("✅✅✅ 完美发布！");
  }
  
  await browser.close();
})();
