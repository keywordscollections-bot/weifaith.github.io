const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes("write"));
  if (!page) { console.log("找不到"); await browser.close(); return; }
  
  // 1. 先填标题
  await page.evaluate(() => {
    const ta = document.querySelector("textarea");
    if (ta) {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      nativeSetter.call(ta, "GEO 是什么？跨境电商为什么现在就要做？");
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
  console.log("✅ 标题已填");
  
  // 2. 读取文章内容
  const article = fs.readFileSync("zhihu_article_1.md", "utf-8");
  
  // 清理内容
  let cleanContent = article
    .replace(/^# GEO.*$/m, "")
    .replace(/\*此处放你的微信二维码\*/gi, "")
    .replace(/\*\*/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .trim();
  
  // 3. 用Draft.js的方法填充编辑器
  await page.evaluate((content) => {
    const editor = document.querySelector("[contenteditable=true]");
    if (!editor) return "没有编辑器";
    
    // 聚焦编辑器
    editor.focus();
    
    // 使用Draft.js的API插入内容
    // 查找React内部状态
    const editorNode = editor;
    const reactKey = Object.keys(editorNode).find(k => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$"));
    if (!reactKey) return "无React fiber";
    
    // 尝试通过Clipboard API插入大量文本
    // 先选中已有内容
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // 插入文本
    const textLines = content.split("\n").filter(l => l.trim());
    for (const line of textLines) {
      const cleanLine = line.replace(/^#{1,3}\s+/, "").replace(/^\d+\.\s+/, "").trim();
      if (!cleanLine) continue;
      
      // 对每一段，用execCommand插入
      document.execCommand("insertText", false, cleanLine);
      
      // 插入换行
      const br = document.createElement("br");
      range.insertNode(br);
      range.setStartAfter(br);
      range.setEndAfter(br);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    return "内容已插入";
  }, cleanContent);
  console.log("✅ 正文已填");
  
  await new Promise(r => setTimeout(r, 2000));
  
  // 4. 检查发布按钮
  const pubStatus = await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      if (b.textContent.trim() === "发布") return { disabled: b.disabled, text: b.textContent.trim() };
    }
    return null;
  });
  console.log("发布按钮:", JSON.stringify(pubStatus));
  
  if (pubStatus && !pubStatus.disabled) {
    console.log("✅ 发布可用，点击发布");
    await page.evaluate(() => {
      const btns = document.querySelectorAll("button");
      for (const b of btns) {
        if (b.textContent.trim() === "发布") { b.click(); return; }
      }
    });
    await new Promise(r => setTimeout(r, 3000));
  }
  
  console.log("当前URL:", page.url().substring(0, 100));
  await browser.close();
})();
