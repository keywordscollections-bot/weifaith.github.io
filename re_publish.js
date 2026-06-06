const { chromium } = require("playwright");
const fs = require("fs");

const FILE = "geo_2026.md";
const PORT = "9222";

(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:" + PORT);
  const ctx = browser.contexts()[0];
  
  let page = ctx.pages().find(p => p.url().includes("zhuanlan.zhihu.com/write"));
  if (!page) {
    page = await ctx.newPage();
    await page.goto("https://zhuanlan.zhihu.com/write");
    await new Promise(r => setTimeout(r, 3000));
  } else {
    await page.goto("https://zhuanlan.zhihu.com/write");
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log("✅ 写文章页面已打开");
  
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
      if (t && !t.match(/^[=\-]{3,}$/)) { title = t; break; }
    }
  }
  
  console.log("📌 标题:", title);
  
  // 填标题
  await page.evaluate((t) => {
    const ta = document.querySelector("textarea");
    if (ta) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      setter.call(ta, t);
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }, title);
  console.log("✅ 标题已填");
  await new Promise(r => setTimeout(r, 500));
  
  // 聚焦编辑器
  await page.evaluate(() => {
    const editor = document.querySelector("[contenteditable=true]");
    if (editor) editor.focus();
  });
  await new Promise(r => setTimeout(r, 500));
  
  // 逐段插入正文，每段用回车分开
  const paragraphs = [];
  let currentPara = "";
  
  for (const line of bodyLines) {
    const trimmed = line.trim();
    
    // 空行或--- 分隔线 -> 分段
    if (!trimmed || trimmed === "---") {
      if (currentPara.trim()) {
        paragraphs.push(currentPara.trim());
        currentPara = "";
      }
      if (trimmed === "---") {
        paragraphs.push("---");
      }
      continue;
    }
    
    // 跳过图片行和二维码占位行
    if (trimmed.match(/^!\[.*?\]/) || trimmed.includes("此处放你的微信二维码")) {
      continue;
    }
    
    // 去掉markdown标记
    let clean = trimmed.replace(/^\#+\s+/, "")  // 去掉 ## ###
                       .replace(/^\*\*/, "")     // 去掉 **
                       .replace(/\*\*$/, "")
                       .replace(/\*\*/g, "");
    
    if (currentPara) {
      currentPara += " " + clean;
    } else {
      currentPara = clean;
    }
  }
  if (currentPara.trim()) {
    paragraphs.push(currentPara.trim());
  }
  
  console.log("📝 段落数:", paragraphs.length, "总字符:", paragraphs.join("").length);
  
  // 逐段插入
  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    if (!para) continue;
    
    await page.evaluate((text) => {
      document.execCommand("insertText", false, text);
    }, para);
    
    // 按回车创建新段落（保存段落结构）
    if (i < paragraphs.length - 1) {
      await page.keyboard.press("Enter");
      await new Promise(r => setTimeout(r, 100));
    }
  }
  
  console.log("✅ 正文已分段落填入");
  await new Promise(r => setTimeout(r, 1000));
  
  // 在末尾插入微信联系方式
  await page.keyboard.press("Enter");
  await new Promise(r => setTimeout(r, 200));
  await page.keyboard.press("Enter");
  await new Promise(r => setTimeout(r, 200));
  await page.evaluate(() => {
    document.execCommand("insertText", false, "---");
  });
  await page.keyboard.press("Enter");
  await new Promise(r => setTimeout(r, 200));
  await page.evaluate(() => {
    document.execCommand("insertText", false, "如果你对GEO+跨境电商的实战策略感兴趣，欢迎加微信交流。我会持续分享最新的GEO动态和实操方法。");
  });
  await page.keyboard.press("Enter");
  await new Promise(r => setTimeout(r, 200));
  await page.evaluate(() => {
    document.execCommand("insertText", false, "微信号：xxxxxx（加微信备注 GEO跨境）");
  });
  await page.keyboard.press("Enter");
  await new Promise(r => setTimeout(r, 200));
  
  console.log("✅ 联系方式已添加");
  
  // 上传二维码图片到文章末尾
  await page.keyboard.press("Enter");
  await new Promise(r => setTimeout(r, 500));
  
  // 通过点击添加图片按钮
  await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      const html = b.innerHTML.toLowerCase();
      if (html.includes("image") || html.includes("picture")) {
        console.log("click image btn");
        b.click();
        return;
      }
    }
  });
  await new Promise(r => setTimeout(r, 1500));
  
  // 找输入框
  const qrPath = require("path").join(__dirname, "qr.jpg");
  const fileInput = await page.$("input[type=file]");
  if (fileInput) {
    await fileInput.setInputFiles(qrPath);
    console.log("✅ 二维码图片已上传");
  } else {
    console.log("⚠️ 文件输入框未找到");
  }
  
  await new Promise(r => setTimeout(r, 3000));
  
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
  const pubStatus = await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      if (b.textContent.trim() === "发布") return { disabled: b.disabled };
    }
    return null;
  });
  
  if (!pubStatus || pubStatus.disabled) {
    console.log("⚠️ 发布按钮不可用，请检查");
    await browser.close();
    return;
  }
  
  await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      if (b.textContent.trim() === "发布") { b.click(); return; }
    }
  });
  console.log("✅ 已点击发布");
  await new Promise(r => setTimeout(r, 3000));
  
  const url = page.url();
  if (url.includes("zhuanlan.zhihu.com/p/") && !url.includes("write")) {
    console.log("🎉 文章发布成功！");
    console.log("🔗 链接: " + url.split("?")[0]);
  } else {
    console.log("📌 当前页面:", url.substring(0, 80));
  }
  
  await browser.close();
})();
