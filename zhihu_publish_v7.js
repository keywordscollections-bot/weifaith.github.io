const { chromium } = require("playwright");
const fs = require("fs");

const FILE = "geo_2026_v2.md";
const lines = fs.readFileSync(FILE, "utf-8").split("\n");

let title = "";
for (const l of lines) {
  const t = l.trim();
  if (t.startsWith("# ")) { title = t.replace(/^#\s+/, ""); break; }
}

// 清除markdown，组装成一段段
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
paras.push("如果你对GEO加跨境电商的实战策略感兴趣，欢迎交流。");
paras.push("微信号：xxxxxx（加微信备注 GEO跨境）");

console.log("标题:", title);
console.log("段落:", paras.length);

(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  
  // 关闭旧写文章页
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
  
  // 聚焦编辑器
  await page.focus("[contenteditable=true]");
  await new Promise(r => setTimeout(r, 300));
  
  // 用 clipboard 方式 + 粘贴
  // 把全文拼接成带换行的文本，写入剪贴板
  const textToPaste = paras.join("\n");
  
  await page.evaluate((txt) => {
    // 方案：通过 Clipboard API
    navigator.clipboard.writeText(txt).catch(() => {});
  }, textToPaste);
  await new Promise(r => setTimeout(r, 500));
  
  // Ctrl+V 粘贴
  await page.keyboard.press("Control+v");
  await new Promise(r => setTimeout(r, 2000));
  
  // 检查编辑器内容
  const editorLen = await page.evaluate(() => {
    const editor = document.querySelector("[contenteditable=true]");
    return editor ? editor.textContent.length : 0;
  });
  console.log("编辑器内容:", editorLen, "字符");
  
  if (editorLen < 500) {
    // 粘贴没成功，用另一种：通过 copy/paste 事件
    console.log("粘贴可能没生效，尝试直接操作...");
    
    // 重新来，先清空编辑器
    await page.evaluate(() => {
      const editor = document.querySelector("[contenteditable=true]");
      if (!editor) return;
      
      // 知乎编辑器是 Draft.js，我们监听它的数据
      // 尝试找到 __editorState 或 __reactInternalInstance
      const keys = Object.keys(editor);
      for (const key of keys) {
        if (key.startsWith("__reactFiber") || key.startsWith("__reactInternalInstance")) {
          // 看看能不能找到 setEditorState
          console.log("react key:", key);
        }
      }
    });
    
    await page.keyboard.type("测试内容...", { delay: 10 });
    await new Promise(r => setTimeout(r, 500));
    const len2 = await page.evaluate(() => {
      const editor = document.querySelector("[contenteditable=true]");
      return editor ? editor.textContent.length : 0;
    });
    console.log("type后:", len2, "字符");
    
    if (len2 > 0) {
      // type 有效，那就清空然后用 type 快速输入
      await page.evaluate(() => {
        const editor = document.querySelector("[contenteditable=true]");
        if (editor) {
          editor.focus();
          const sel = window.getSelection();
          const r = document.createRange();
          r.selectNodeContents(editor);
          sel.removeAllRanges();
          sel.addRange(r);
          document.execCommand("delete", false);
        }
      });
      await new Promise(r => setTimeout(r, 200));
      
      // 批量输入
      await page.keyboard.type(textToPaste, { delay: 1 });
      await new Promise(r => setTimeout(r, 1000));
      
      const len3 = await page.evaluate(() => {
        const editor = document.querySelector("[contenteditable=true]");
        return editor ? editor.textContent.length : 0;
      });
      console.log("批量type后:", len3, "字符");
    }
  }
  
  // 继续
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
  await new Promise(r => setTimeout(r, 200));
  
  // 点击发布
  await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      if (b.textContent.trim() === "发布" && !b.disabled) { b.click(); return; }
    }
  });
  console.log("✅ 点击发布");
  await new Promise(r => setTimeout(r, 3000));
  
  const url = page.url();
  console.log("发布后URL:", url.substring(0, 80));
  
  // 检查
  await page.goto(url.split("?")[0].replace("/edit", ""));
  await new Promise(r => setTimeout(r, 3000));
  
  const text = await page.evaluate(() => {
    const el = document.querySelector(".Post-RichText, .RichText") || document.body;
    return el.innerText;
  });
  console.log("文章内容:", text.length, "字符");
  
  if (text.length > 500) {
    console.log("✅✅✅ 发布成功！");
    const first = "2025年，GEO还只是一个少数人关注的概念";
    const cnt = (text.match(new RegExp(first.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
    console.log("首段重复:", cnt + "次");
  } else {
    console.log("❌ 文章内容为空或404");
  }
  
  await browser.close();
})();
