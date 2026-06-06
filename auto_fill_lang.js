const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes("write"));
  if (!page) { console.log("找不到"); await browser.close(); return; }
  
  // 先看看页面结构 - 找到"选择语言"输入框
  const langInput = await page.$("input[placeholder*=\"语言\"]");
  if (langInput) {
    console.log("找到了语言输入框");
    await langInput.click();
    await new Promise(r => setTimeout(r, 500));
    
    // 输入"中文"
    await langInput.fill("中文");
    await new Promise(r => setTimeout(r, 1000));
    
    // 看看是否有下拉选项出现
    const options = await page.$$("[role=option]");
    console.log("选项数:", options.length);
    for (const opt of options) {
      const text = await opt.textContent();
      console.log("  选项:", text);
      if (text.includes("中文")) {
        await opt.click();
        console.log("选了中文");
        await new Promise(r => setTimeout(r, 1000));
        break;
      }
    }
  } else {
    console.log("未找到语言输入框");
    // 看看页面上所有input
    const inputs = await page.$$("input");
    for (const inp of inputs) {
      const ph = await inp.getAttribute("placeholder");
      const val = await inp.inputValue();
      console.log("input placeholder:", ph, "value:", val);
    }
  }
  
  // 检查发布按钮
  const pubDisabled = await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      if (b.textContent.trim() === "发布") return b.disabled;
    }
    return "not found";
  });
  console.log("发布按钮禁用状态:", pubDisabled);
  
  await browser.close();
})();
