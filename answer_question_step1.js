const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  
  // 页面0是目标问题！
  const page = ctx.pages()[0];
  const url = page.url();
  console.log("当前URL:", url.substring(0, 100));
  
  // 获取问题信息
  const info = await page.evaluate(() => {
    const title = document.querySelector(".QuestionHeader-title")?.textContent?.trim();
    const desc = document.querySelector(".QuestionHeader-detail")?.textContent?.trim()?.substring(0, 300);
    
    // 已有回答数
    const ansItems = document.querySelectorAll("[data-za-module=\"AnswerItem\"]").length;
    
    // 有无写回答按钮
    const btns = Array.from(document.querySelectorAll("button"));
    const writeBtn = btns.find(b => b.textContent.trim() === "��回答");
    
    return { title, desc, answers: ansItems, hasWrite: !!writeBtn };
  });
  
  console.log("问题:", info.title);
  console.log("描述:", info.desc);
  console.log("已有回答:", info.answers);
  console.log("写回答按钮:", info.hasWrite);
  
  if (info.hasWrite) {
    // 点击写回答
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const writeBtn = btns.find(b => b.textContent.trim() === "写回答");
      if (writeBtn) writeBtn.click();
    });
    console.log("已点击写回答");
    await new Promise(r => setTimeout(r, 2000));
    
    // 检查编辑器是否出现
    const hasEditor = await page.evaluate(() => {
      const editor = document.querySelector("[contenteditable=true]");
      return !!editor;
    });
    console.log("编辑器出现:", hasEditor);
  }
  
  await browser.close();
})();
