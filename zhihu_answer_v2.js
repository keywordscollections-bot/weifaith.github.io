const { chromium } = require('playwright');

const answers = [
  {
    questionId: '280696372',
    title: 'GEO在2026年还有必要做吗？',
    content: `2026年，GEO已经成为跨境电商绕不开的关键词。

为什么？三个数据告诉你：

1. AI搜索市场份额冲刺30% — 每3个搜索请求中就有1个由AI生成答案
2. 结构化数据成为硬门槛 — 没有LD-JSON的页面，被AI引用的概率降低80%
3. 内容质量决定AI推荐 — ChatGPT优先引用专业、深度、有权威来源的内容

跨境卖家现在要做三件事：
- 给独立站加上Article/FAQ/BreadcrumbList结构化数据
- 在知乎等平台持续输出高质量内容
- 每周查一次品牌在ChatGPT中的表现

技术门槛比SEO低，但时间窗口很短。`,
  },
  {
    questionId: '386174803',
    title: 'GEO是什么？',
    content: `GEO是Generative Engine Optimization的缩写，中文叫"生成式引擎��化"。

简单说：SEO优化的是Google搜索结果的排名，GEO优化的是AI生成答案中的品牌提及率。

举个例子：
- SEO：你搜"best running shoes"，Google给你10个蓝色链接，你点第1个
- GEO：你问ChatGPT"推荐一双适合马拉松的跑鞋"，AI直接给3个品牌名称

如果你的品牌没被AI推荐，你连被看见的机会都没有。

核心就三件事：
1. 网站加结构化数据（LD-JSON）
2. 知乎等平台输出高质量内容
3. 监测品牌在AI搜索中的表现`,
  },
  {
    questionId: '434461306',
    title: '现在做GEO还来得及吗？',
    content: `2025年下半年开始做GEO，时间刚刚好。

说几个判断依据：

1. AI搜索市场份额正在快速增长
2025年AI搜索约占10%的市场，2026年预计突破30%。现在还处于早期。

2. 做GEO的人还很少
大部分跨境卖家还不知道GEO是什么，竞争极低。

3. 结构化数据几乎零成本
给网站加上LD-JSON Schema，几个小时就能搞定，这是一劳永逸的事。

4. 内容可以复用
知乎回答、公众号文章、Blog内容可以交叉发布，一篇内容多个平台同时做GEO。

时间窗口大概还剩6-12个月，现在开始正合适。`,
  },
  {
    questionId: '374249438',
    title: 'GEO和SEO有什么区别？',
    content: `GEO（Generative Engine Optimization）和传统SEO有本质区别：

1. 目标不同
- SEO：让你的网站在Google搜索结果的蓝色链接中排第1
- GEO：让你的品牌出现在ChatGPT/Perplexity的AI回答中

2. 优化对象不同
- SEO：优化页面标题、Meta描述、外链、加载速度
- GEO：优化结构化数据、内容质量、品牌在多平台的存在感

3. 竞价逻辑不同
- SEO：Google Ads可以买排名
- GEO：AI不卖排名，只看内容和权威性

4. 流量形态不同
- SEO：用户点链接进入你的网站
- GEO：AI直接给出品牌名称，用户去电商平台搜你

两者不是替代关系，而是互补。SEO做基础流量，GEO做增量流量。`,
  },
  {
    questionId: '638464105',
    title: 'GEO和传统SEO的核心区别是什么？',
    content: `和传统SEO相比，GEO有几个核心区别：

① 流量来源变了
传统SEO从Google搜索框获取流量，GEO从ChatGPT、Perplexity等AI对话框获取。

② 排名逻辑变了
Google排名看你网站外链多不多、域名权重高不高。AI推荐看你内容质量好不好、结构数据全不全。

③ 内容策略变了
SEO需要大量长尾关键词文��（100篇起）。GEO需要少量高质量的权威内容（10篇精品就够）。

④ 见效周期变了
SEO通常3-6个月才见效。GEO快的话，知乎上的一篇高质量回答24小时内就能被AI索引。

⑤ 成本结构变了
SEO外链建设成本高。GEO核心是内容，没有外部成本。

对于中小跨境电商卖家来说，GEO的性价比远高于传统SEO。`,
  },
  {
    questionId: '268595834',
    title: '2026年做GEO的标准流程是什么？',
    content: `我来说说2026年做GEO的标准流程：

第一步：网站技术准备（1-2天）
- 给网站加上LD-JSON结构化数据（Article、FAQ、BreadcrumbList）
- 提交sitemap到Google Search Console
- 确保网站加载速度快

第二步：内容输出（持续）
- 知乎：每周回答3-5个相关问题
- 公众号：每周1篇深度文章
- 独立站Blog：每周1-2篇

第三步：多平台布局（第2周起）
- 小红书：发GEO实操笔记
- B站：发GEO教学视频
- LinkedIn：发英文行业观点

第四步：监测优化（每周）
- 查品牌词在ChatGPT/Perplexity中的表现
- 查AI引用了哪些页面
- 查竞品的AI可见度

第五步：付费放大（第2月起）
- Google Ads跑GEO关键词
- 知乎/小红书投高互动内容

这套流程我已经跑了3天，第一篇文章上线后24小时就被AI索引了。`,
  },
  {
    questionId: '408175213',
    title: '做GEO的真实感受是什么？',
    content: `作为刚起步做跨境GEO的人，我说说这3天的真实感受：

先说好的：
- 技术门槛确实低，加结构化数据几个小时搞定
- 内容复用率高，一篇Blog改改就能发知乎、公众号
- 目前确实没什么人在做，竞争很小

再说遇到的困难：
- 知乎账号刚起步，回答流量有限
- 品牌知名度需要时间积累
- AI搜索的监测工具还不成熟，需要手动查

我的建议：
1. 先做结构化数据+知乎，这俩投入最低见效最快
2. 内容要持续，不能三天打鱼两天晒网
3. 别等什么都准备好了才开始，边做边优化

这周目标是完成8篇知乎回答，每天在群里分享进展。`,
  },
  {
    questionId: '260104887',
    title: 'GEO诊断是什么？怎么检查？',
    content: `GEO诊断是检查品牌在AI搜索引擎（ChatGPT、Perplexity、Gemini等）中的表现。

主要检查这几项：

1. 品牌词出现率
在ChatGPT搜你的品牌词，看AI是否知道你的品牌，描述是否准确。

2. AI引用来源
AI回答中引用了你哪些页面？来自知乎、公众号还是独立站？

3. 竞品对比
搜行业关键词，看竞品品牌出现了几次，你出现了几次。

4. 内容覆盖度
关于你所在的行业，AI能回答到多深的程度？

5. 结构化数据完整性
AI能否正确理解你的页面内容？

建议每周做一次。工具方面目前没有特别成熟的，可以手动查，也可以找专业的GEO服务商。`,
  }
];

(async () => {
  let browser;
  try {
    browser = await chromium.launch({ headless: false, channel: 'chrome' });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    
    console.log('🔍 正在打开知乎创作者中心...');
    await page.goto('https://www.zhihu.com/creator/featured-question/invited', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // 检查是否已登录
    const currentUrl = page.url();
    if (currentUrl.includes('signin') || currentUrl.includes('login')) {
      console.log('⚠️ 未登录，请在打开的浏览器中手动登录知乎');
      console.log('   登录后按回车继续...');
      await new Promise(resolve => process.stdin.once('data', resolve));
    }
    
    console.log('✅ 已登录知乎');
    
    for (let i = 0; i < answers.length; i++) {
      const a = answers[i];
      console.log(`\n--- 第 ${i+1}/${answers.length} 篇：${a.title} ---`);
      
      try {
        // 直接用写回答页面
        const writeUrl = `https://www.zhihu.com/question/${a.questionId}/answer/write`;
        console.log(`🔗 打开写回答页面...`);
        await page.goto(writeUrl, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);
        
        // 等编辑器加载
        await page.waitForSelector('.DraftEditor-root, [contenteditable="true"]', { timeout: 10000 });
        await page.waitForTimeout(1000);
        
        // 点击编辑器
        const editor = await page.$('.DraftEditor-root, [contenteditable="true"]');
        if (editor) {
          await editor.click();
          await page.waitForTimeout(500);
          
          // 逐段输入
          const paragraphs = a.content.split('\n').filter(p => p.trim());
          for (let p of paragraphs) {
            await page.keyboard.type(p.trim());
            await page.keyboard.press('Enter');
            await page.waitForTimeout(100);
          }
          
          console.log('✅ 内容已填入');
          await page.waitForTimeout(1000);
          
          // 发布
          const submitBtn = await page.$('button:has-text("发布回答"), button:has-text("发布"), button[type="submit"]');
          if (submitBtn) {
            await submitBtn.click();
            console.log('✅ 已点击发布');
            await page.waitForTimeout(3000);
          } else {
            console.log('⚠️ 未找到发布按钮');
          }
        } else {
          console.log('⚠️ 未找到编辑器');
        }
      } catch (err) {
        console.log(`❌ 失败：${err.message}`);
      }
      
      if (i < answers.length - 1) {
        const waitTime = 5;
        console.log(`⏳ 等待 ${waitTime} 秒后继续...`);
        await page.waitForTimeout(waitTime * 1000);
      }
    }
    
    console.log('\n🎉 全部完成！共发布 ' + answers.length + ' 篇回答');
    console.log('   请到知乎创作者中心确认发布状态');
    
  } catch (err) {
    console.error('❌ 脚本出错：' + err.message);
  } finally {
    if (browser) await browser.close();
  }
})();
