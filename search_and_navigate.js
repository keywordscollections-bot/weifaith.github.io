const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  
  // 新建一个干净的页面导航到featured-question页面
  const page = await ctx.newPage();
  await page.goto("https://www.zhihu.com/creator/featured-question/invited", { timeout: 10000 });
  await new Promise(r => setTimeout(r, 4000));
  
  // 点击问题搜索
  await page.evaluate(() => {
    const allEls = document.querySelectorAll("*");
    for (const el of allEls) {
      if (el.textContent.trim() === "问题搜索" && el.children.length === 0) {
        el.click();
        return;
      }
    }
  });
  await new Promise(r => setTimeout(r, 2000));
  
  // 在搜索框输入
  await page.click("input");
  await page.type("input", "为什么用SEO思路做GEO总失败", { delay: 30 });
  await new Promise(r => setTimeout(r, 3000));
  
  const text = await page.evaluate(() => document.body.innerText.substring(0, 800));
  console.log(text);
  
  // 查找搜索结果中的问题链接
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a"))
      .filter(a => a.textContent.includes("SEO思路"))
      .map(a => ({ text: a.textContent.trim().substring(0, 50), href: a.href }));
  });
  
  console.log("\n匹配链接:", JSON.stringify(links));
  
  // 如果找到，点击
  if (links.length > 0) {
    await page.click(`a[href="${links[0].href}"]`);
    await new Promise(r => setTimeout(r, 3000));
    console.log("点击后URL:", page.url());
  }
  
  await browser.close();
})();
