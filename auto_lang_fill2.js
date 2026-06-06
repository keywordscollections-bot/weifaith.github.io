const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes("write"));
  if (!page) { console.log("找不到"); await browser.close(); return; }
  
  // 直接用 evaluate 来操作
  const result = await page.evaluate(async () => {
    // 找到语言输入框
    const inputs = document.querySelectorAll("input");
    let langInput = null;
    for (const inp of inputs) {
      if (inp.placeholder && inp.placeholder.includes("语言")) {
        langInput = inp;
        break;
      }
    }
    if (!langInput) return "未找到语言输入框";
    
    // 使用原生事件来设置值并触发
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    nativeInputValueSetter.call(langInput, "中文");
    
    // 派发input事件
    const evt = new Event("input", { bubbles: true });
    langInput.dispatchEvent(evt);
    
    // 等待一下看有没有选项出现
    await new Promise(r => setTimeout(r, 1000));
    
    // 找下拉列表中的"中文"
    const options = document.querySelectorAll("[role=option], [class*=option]");
    for (const opt of options) {
      if (opt.textContent.includes("中文")) {
        opt.click();
        return "已选择: 中文";
      }
    }
    
    // 如果没找到选项，直接回车
    langInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    await new Promise(r => setTimeout(r, 500));
    
    return "输入了中文，未找到下拉选项，已按回车。当前值: " + langInput.value;
  });
  console.log(result);
  
  // 检查发布按钮
  const pubStatus = await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      if (b.textContent.trim() === "发布") return { disabled: b.disabled };
    }
    return null;
  });
  console.log("发布按钮:", JSON.stringify(pubStatus));
  
  if (pubStatus && !pubStatus.disabled) {
    await page.evaluate(() => {
      const btns = document.querySelectorAll("button");
      for (const b of btns) {
        if (b.textContent.trim() === "发布") { b.click(); return; }
      }
    });
    console.log("✅ 点了发布");
    await new Promise(r => setTimeout(r, 3000));
  }
  
  console.log("URL:", page.url().substring(0, 100));
  await browser.close();
})();
