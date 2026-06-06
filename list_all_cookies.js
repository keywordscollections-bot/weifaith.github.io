const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const cookies = await context.cookies();
  
  // 列出所有cookies的名字和部分值
  cookies.forEach(c => {
    console.log(`${c.name} = ${c.value.substring(0, 30)} (domain: ${c.domain})`);
  });
  
  await browser.close();
})();
