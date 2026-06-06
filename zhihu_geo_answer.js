const { chromium } = require('playwright');

(async () => {
  let browser;
  try {
    browser = await chromium.launch({ headless: false, channel: 'chrome' });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    
    console.log('🔍 打开知乎...');
    await page.goto('https://www.zhihu.com', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // 检查登录
    const url = page.url();
    if (url.includes('signin') || url.includes('login')) {
      console.log('⚠️ 请手动登录知乎（账号：关键词跨境GEO）');
      console.log('   登录后告诉我，我来操作');
      // 等待用户登录
      while (true) {
        await page.waitForTimeout(2000);
        const cur = page.url();
        if (!cur.includes('signin') && !cur.includes('login')) {
          console.log('✅ 已登录');
          break;
        }
      }
    } else {
      console.log('✅ 已登录知乎');
    }
    
    // 搜索GEO相关的问题
    const searchTerms = ['GEO 跨境电商', 'GEO AI搜索', '跨境GEO', '生成式引擎优化'];
    
    for (let term of searchTerms) {
      console.log(`\n🔍 搜索：${term}`);
      await page.goto('https://www.zhihu.com/search?q=' + encodeURIComponent(term) + '&type=content', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      // 看看搜索结果中有没有问题
      const links = await page.$$('a[href*="/question/"]');
      console.log(`   找到 ${links.length} 个问题链接`);
      
      if (links.length > 0) {
        // 点第一个问题进去
        const href = await links[0].getAttribute('href');
        console.log(`   打开：${href}`);
        await page.goto('https://www.zhihu.com' + href, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);
        
        // 点"写回答"
        const writeBtn = await page.$('.QuestionAnswers-answers .WriteAnswer-input');
        if (writeBtn) {
          await writeBtn.click();
          await page.waitForTimeout(1000);
          
          // 填入内容
          const editor = await page.$('.DraftEditor-root, [contenteditable="true"]');
          if (editor) {
            const content = `GEO（Generative Engine Optimization）在2026年已经成为跨境电商不可忽视的新趋势。简单来说，GEO就是让品牌在ChatGPT、Perplexity等AI搜索引擎的答案中被提及。

对于跨境卖家来说，核心就三件事：

1. 给独立站加上结构化数据（LD-JSON），让AI能读懂你的页面
2. 在知乎等中文平台输出高质量内容，增加品牌在中文AI搜索中的可见度
3. 定期监测品牌在AI搜索中的表现

目前做的人还很少，时间窗口大概还有6-12个月，现在开始正合适。`;
            
            await editor.click();
            await page.waitForTimeout(500);
            await page.keyboard.type(content, { delay: 20 });
            await page.waitForTimeout(1000);
            
            const submitBtn = await page.$('button:has-text("发布回答"), button[type="submit"]');
            if (submitBtn) {
              await submitBtn.click();
              console.log('✅ 已回答并发布！');
            }
          }
        }
        
        break;
      }
    }
    
    console.log('\n✅ 完成一轮搜索回答');
    console.log('如果你想手动操作，可以在Chrome窗口里继续');
    
  } catch(err) {
    console.error('❌ ' + err.message);
  }
})();
