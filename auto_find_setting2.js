const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes("write"));
  if (!page) { console.log("找不到"); await browser.close(); return; }
  
  // 查看页面右下部分的结构
  const rightPanel = await page.evaluate(() => {
    // 找到写文章的底层容器
    const root = document.querySelector("#root") || document.querySelector("#app");
    if (!root) return "no root";
    
    // 找到所有包含"发布"的父级
    function findPath(el, maxDepth) {
      if (!el || maxDepth <= 0) return [];
      const parent = el.parentElement;
      if (!parent) return [el.tagName];
      return [...findPath(parent, maxDepth - 1), el.tagName + (el.className ? "." + el.className.substring(0, 20) : "")];
    }
    
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      if (b.textContent.trim() === "发布") {
        // 获取附近的结构
        const parent = b.closest("[class*=Setting], [class*=setting], [class*=publish], [class*=Publish]");
        return { 
          publishBtnParent: parent ? parent.innerHTML.substring(0, 500) : "no setting parent",
          path: findPath(b, 10)
        };
      }
    }
    return { error: "not found" };
  });
  
  console.log(JSON.stringify(rightPanel, null, 2));
  
  await browser.close();
})();
