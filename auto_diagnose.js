const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes("write"));
  if (!page) { console.log("找不到"); await browser.close(); return; }
  
  // 全面检查发布按钮
  const pubBtn = await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      if (b.textContent.trim() === "发布") {
        const rect = b.getBoundingClientRect();
        return {
          disabled: b.disabled,
          ariaDisabled: b.getAttribute("aria-disabled"),
          className: b.className,
          innerHTML: b.innerHTML.substring(0, 200),
          rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height }
        };
      }
    }
    return null;
  });
  console.log("发布按钮详细:", JSON.stringify(pubBtn, null, 2));
  
  // 查看页面语言输入框附近是否有其他选项
  const rtPanel = await page.evaluate(() => {
    // 找所有包含"发布设置"的区域
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, null, false);
    const nodes = [];
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent.includes("发布设置") && node.children.length > 0) {
        nodes.push(node.tagName + "." + (node.className || "").substring(0, 30));
      }
    }
    return nodes;
  });
  console.log("发布设置区域:", rtPanel);
  
  // 查看"选择语言"输入框附近的所有交互元素
  const nearLang = await page.evaluate(() => {
    const inputs = document.querySelectorAll("input");
    for (const inp of inputs) {
      if (inp.placeholder && inp.placeholder.includes("语言")) {
        const parent = inp.parentElement;
        if (!parent) return null;
        const container = parent.closest("div[class]");
        if (!container) return null;
        // 获取同级的标签、选择器等
        const labels = container.querySelectorAll("label, span");
        const otherInputs = container.querySelectorAll("input, select, textarea, button");
        return {
          labels: Array.from(labels).map(l => l.textContent.trim().substring(0, 30)),
          otherInputs: Array.from(otherInputs).map(i => i.tagName + " " + (i.placeholder || "") + " " + (i.value || "")).slice(0, 5)
        };
      }
    }
    return null;
  });
  console.log("语言附近:", JSON.stringify(nearLang, null, 2));
  
  // 看整个发布设置面板
  const panelHtml = await page.evaluate(() => {
    const els = document.querySelectorAll('[class*="WriteIndexMain"]');
    for (const el of els) {
      return el.innerHTML.substring(0, 3000);
    }
    return "not found";
  });
  console.log("\n发布面板HTML片段:");
  console.log(panelHtml);
  
  await browser.close();
})();
