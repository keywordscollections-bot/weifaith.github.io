const { chromium } = require("playwright");
const fs = require("fs");

const FILE = "geo_2026_v2.md";
const lines = fs.readFileSync(FILE, "utf-8").split("\n");

let title = "";
for (const l of lines) {
  const t = l.trim();
  if (t.startsWith("# ")) { title = t.replace(/^#\s+/, ""); break; }
}

// 提取段落（去掉标题行，保留原文最后一段联系方式）
let paras = [];
let cur = "";
for (const l of lines) {
  const t = l.trim();
  if (!t || t.startsWith("# ")) {
    if (cur.trim()) { paras.push(cur.trim()); cur = ""; }
    continue;
  }
  if (t.match(/^!\[.*\]/) || t.includes("二维码")) continue;
  let clean = t.replace(/^#{1,3}\s+/, "").replace(/\*\*/g, "").replace(/\[(.+?)\]\(.+?\)/g, "$1").trim();
  cur += (cur ? " " : "") + clean;
}
if (cur.trim()) paras.push(cur.trim());

// 不加额外联系方式，源文件末尾已有"欢迎交流"
// 但源文件没有微信号，加上
// 如果最后一段不包含"微信"，加一句
if (!paras[paras.length - 1]?.includes("微信")) {
  paras.push("微信号：xxxxxx（加微信备注 GEO跨境）");
}

console.log("标题:", title);
console.log("段落:", paras.length);
console.log("最后3段:", paras.slice(-3));

(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  
  for (const p of ctx.pages()) {
    if (p.url().includes("zhuanlan.zhihu.com/write")) await p.close();
  }
  await new Promise(r => setTimeout(r, 200));
  
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
  console.log("✅ 标题");
  await new Promise(r => setTimeout(r, 300));
  
  // 清空编辑器
  await page.focus("[contenteditable=true]");
  await new Promise(r => setTimeout(r, 200));
  await page.evaluate(() => {
    const editor = document.querySelector("[contenteditable=true]");
    if (editor) editor.innerHTML = "";
    document.execCommand("selectAll", false);
    document.execCommand("delete", false);
  });
  await new Promise(r => setTimeout(r, 200));
  
  // 写入剪贴板并粘贴
  const textToPaste = paras.join("\n");
  await page.evaluate((txt) => {
    navigator.clipboard.writeText(txt);
  }, textToPaste);
  await new Promise(r => setTimeout(r, 300));
  await page.keyboard.press("Control+v");
  await new Promise(r => setTimeout(r, 1500));
  
  const editorLen = await page.evaluate(() => {
    const editor = document.querySelector("[contenteditable=true]");
    return editor ? editor.textContent.length : 0;
  });
  console.log("编辑器内容:", editorLen, "字符 (预期约1700)");
  
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
  console.log("✅ 语言");
  await new Promise(r => setTimeout(r, 200));
  
  // 发布
  await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      if (b.textContent.trim() === "发布" && !b.disabled) { b.click(); return; }
    }
  });
  console.log("✅ 发布");
  await new Promise(r => setTimeout(r, 4000));
  
  let finalUrl = page.url().split("?")[0];
  if (finalUrl.includes("/edit")) finalUrl = finalUrl.replace("/edit", "");
  
  // 验证
  await page.goto(finalUrl, { waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 3000));
  
  const text = await page.evaluate(() => {
    const el = document.querySelector(".Post-RichText, .RichText") || document.body;
    return el.innerText;
  });
  
  console.log("\n文章内容:", text.length, "字符");
  
  const first = "2025年，GEO还只是一个少数人关注的概念";
  const cnt = (text.match(new RegExp(first.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
  
  console.log("首段重复:", cnt + "次");
  console.log("趋势1-5:", text.includes("趋势一") && text.includes("趋势五"));
  console.log("微信:", text.includes("微信"));
  
  if (cnt <= 1 && text.length > 1000) {
    console.log("\n🎉🎉🎉 最终版发布成功！");
    console.log("🔗 " + finalUrl);
  }
  
  await browser.close();
})();
