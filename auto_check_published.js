const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  for (const p of ctx.pages()) {
    const u = p.url();
    if (u.includes("zhuanlan.zhihu.com/p/")) {
      console.log("已发布文章:", u.split("?")[0]);
    }
  }
  await browser.close();
})();
