const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  // "为什么用SEO思路做GEO总失败？应该怎么操作？"
  await page.goto("https://www.zhihu.com/question/2020934662076265540", { timeout: 10000 });
  await new Promise(r => setTimeout(r, 4000));
  
  const info = await page.evaluate(() => {
    const title = document.querySelector(".QuestionHeader-title")?.textContent?.trim();
    const desc = document.querySelector(".QuestionHeader-detail")?.textContent?.trim()?.substring(0, 500);
    const answCnt = document.querySelectorAll("[data-za-module=\"AnswerItem\"], .AnswerCard").length;
    return { title, desc, answers: answCnt };
  });
  
  console.log("问题:", info.title);
  console.log("描述:", info.desc);
  console.log("已有回答:", info.answers);
  
  // 看看有没有"写回答"区域
  const hasWriteAnswer = await page.evaluate(() => {
    // 找写回答按钮
    const btns = Array.from(document.querySelectorAll("button, div, a"));
    const writeBtn = btns.find(b => b.textContent.trim() === "写回答");
    return !!writeBtn;
  });
  console.log("有写回答按钮:", hasWriteAnswer);
  
  await browser.close();
})();
