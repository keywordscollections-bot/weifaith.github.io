const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  
  // 获取所有cookies
  const cookies = await context.cookies();
  console.log("Cookies数量:", cookies.length);
  cookies.forEach(c => {
    console.log(`  ${c.name} = ${c.value.substring(0, 40)}... (domain: ${c.domain})`);
  });
  
  // 查看知乎相关cookie
  const zhihuCookies = cookies.filter(c => c.domain.includes("zhihu"));
  console.log("\n知乎cookies:", zhihuCookies.length);
  zhihuCookies.forEach(c => console.log(`  ${c.name}: ${c.value.substring(0, 50)}`));
  
  await browser.close();
})();
