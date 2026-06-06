const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  
  // 找到问题页面
  const page = ctx.pages().find(p => p.url().includes("question/2020934662076265540"));
  if (!page) {
    console.log("找不到问题页面");
    await browser.close();
    return;
  }
  
  // 点击"邀请回答"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const inviteBtn = btns.find(b => b.textContent.includes("邀请回答"));
    if (inviteBtn) inviteBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  
  // 看看有没有弹出对话框
  const dialog = await page.evaluate(() => {
    const modal = document.querySelector(".Modal-content, .css-1qezv0v, [role=dialog]");
    return modal ? modal.textContent.substring(0, 300) : null;
  });
  console.log("弹窗:", dialog);
  
  // 关闭弹窗（如果有）
  await page.evaluate(() => {
    const closeBtn = document.querySelector(".Modal-closeButton, button[aria-label=关闭]");
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  // 现在看看有没有"写回答"按钮在更底部或者页面中间
  const allText = await page.evaluate(() => document.body.innerText);
  
  // 查找包含"写回答"或"回答"的行
  const lines = allText.split("\n");
  const relevantLines = [];
  lines.forEach((l, i) => {
    if (l.includes("写回答") || l.includes("写下你的") || l.includes("回答 ") || l.includes("回答\n")) {
      relevantLines.push({ index: i, text: l.substring(0, 80) });
    }
  });
  
  console.log("\n相关行:", relevantLines.length);
  relevantLines.slice(0, 10).forEach(l => console.log(`  L${l.index}: "${l.text}"`));
  
  // 再找所有链接
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a")).map(a => ({
      text: a.textContent.trim().substring(0, 40),
      href: a.href.substring(0, 80)
    })).filter(a => a.text.length > 0);
  });
  
  console.log("\n所有链接:");
  links.filter(l => l.text.includes("回答") || l.text.includes("GEO") || l.text.includes("写")).forEach(l => console.log(`  "${l.text}" -> ${l.href}`));
  
  await browser.close();
})();
