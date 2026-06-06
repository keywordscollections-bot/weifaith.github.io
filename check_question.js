const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  // 我选这个问题：如何评价浙江联保推出的GEO智能体独立站？跨境电商中小企业的新红利吗？
  // 这是一个有讨论价值的问题，且与我们的内容相关
  await page.goto("https://www.zhihu.com/question/1876583724058679912");
  await new Promise(r => setTimeout(r, 5000));
  
  const pageText = await page.evaluate(() => {
    return {
      title: document.querySelector(".QuestionHeader-title")?.textContent?.trim() || "",
      detail: document.querySelector(".QuestionHeader-detail")?.textContent?.trim()?.substring(0, 500) || "",
      answers: document.querySelectorAll(".AnswerCard, .AnswerItem").length
    };
  });
  
  console.log("问题:", pageText.title);
  console.log("详情:", pageText.detail);
  console.log("已有回答:", pageText.answers);
  
  // 也看看另一个问题 "跨境电商如何做GEO？"
  await page.goto("https://www.zhihu.com/question/1876583724058679912?search=1");
  
  await browser.close();
})();
