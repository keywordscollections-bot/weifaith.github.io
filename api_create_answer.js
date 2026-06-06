const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const page = await browser.newPage();
  
  // 先导航到首页建立会话
  await page.goto("https://www.zhihu.com", { timeout: 10000, waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 2000));
  
  // 使用知乎API创建回答
  // 知乎的创建回答API：POST https://www.zhihu.com/api/v4/answers
  // 参数：question_id, content (RichText HTML格式)
  
  const questionId = "2020934662076265540";
  
  // 获取xsrf
  const xsrf = await page.evaluate(() => {
    const match = document.cookie.match(/xsrf=([^;]+)/);
    return match ? match[1] : "";
  });
  
  console.log("xsrf:", xsrf);
  
  // 准备回答内容
  const answerContent = `
<h2>GEO不是SEO的替代品，而是搜索引擎进化的必然结果</h2>
<p>用SEO思路做GEO总失败，根本原因在于：<strong>你把AI当成了搜索引擎来优化，而AI其实更像一个"信息整合者"</strong>。</p>
<p>SEO时代的逻辑是：排名靠关键词→点击进入网页→用户阅读内容。而GEO时代的逻辑是：AI读取信息→理解信息→引用信息→直接生成答案。</p>
<p>因此，SEO的很多套路在GEO里开始失效——关键词堆砌、外链建设、低质量内容聚合，这些在AI搜索眼里可能是"噪音"而非"信号"。</p>
<h2>那么，具体应该怎么操作GEO？</h2>
<h3>1. 内容深度 > 内容数量</h3>
<p>AI引用的内容往往是有深度、有逻辑、有数据支撑的。与其每天发10篇伪原创，不如每周打磨1篇原创深度内容。</p>
<h3>2. 结构化数据优先</h3>
<p>用清晰的标题层级（H1/H2/H3）、列表、表格来组织内容，帮助AI快速抓取和理解你的核心观点。</p>
<h3>3. 回答具体问题</h3>
<p>AI搜索的核心场景是回答用户问题。你的内容应该围绕用户的真实痛点来组织，而不是围绕关键词。</p>
<h3>4. 建立权威性</h3>
<p>引用权威来源、展示真实案例、用数据说话——这些在GEO时代比任何SEO技巧都重要。</p>
<h3>5. 关注用户意图</h3>
<p>AI能理解上下文和用户意图。你的内容应该覆盖用户可能问到的相关问题，形成一个完整的信息闭环。</p>
<p>总结：GEO的本质是回归内容价值。不要把精力花在"骗过AI"上，而是花在"真正帮助用户"上。当你的内容对用户有价值时，AI自然会引用你。</p>
  `;
  
  try {
    const result = await page.evaluate(async ({ questionId, answerContent, xsrf }) => {
      const resp = await fetch("https://www.zhihu.com/api/v4/answers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-requested-with": "fetch",
          "x-xsrf-token": xsrf
        },
        body: JSON.stringify({
          question_id: parseInt(questionId),
          content: answerContent,
          reward_enabled: false
        })
      });
      
      const data = await resp.json();
      return { status: resp.status, data: JSON.stringify(data).substring(0, 500) };
    }, { questionId, answerContent, xsrf });
    
    console.log("API结果:", JSON.stringify(result));
  } catch(e) {
    console.log("API失败:", e.message);
  }
  
  await browser.close();
})();
