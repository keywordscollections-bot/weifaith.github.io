const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  // 直接打开搜索结果的页面的问题
  // "为什么用SEO思路做GEO总失败？应该怎么操作？" 这个非常合适
  await page.goto("https://www.zhihu.com/question/2020934662076265540", { timeout: 10000 });
  await new Promise(r => setTimeout(r, 3000));
  
  const info = await page.evaluate(() => {
    const title = document.querySelector(".QuestionHeader-title")?.textContent?.trim();
    const answerCount = document.querySelectorAll(".AnswerCard, .AnswerItem, [data-za-module=\"AnswerItem\"]").length;
    return { title, url: window.location.href, answers: answerCount };
  });
  
  console.log("问题:", info.title);
  console.log("已有回答:", info.answers);
  
  // 看有没有回答框
  const hasAnswerInput = await page.evaluate(() => {
    const editor = document.querySelector("[contenteditable=true], .Editable-editor, .DraftEditor-editorContainer");
    return !!editor;
  });
  console.log("有回答框:", hasAnswerInput);
  
  await browser.close();
})();
