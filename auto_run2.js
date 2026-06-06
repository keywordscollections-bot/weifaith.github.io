const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = browser.contexts()[0];
  
  // 新建一个页面直接去编辑器
  const page = await ctx.newPage();
  console.log('前往编辑器...');
  
  // 尝试几个可能的编辑器URL
  const urls = [
    'https://zhuanlan.zhihu.com/write',
    'https://www.zhihu.com/editor',
    'https://www.zhihu.com/question/editor'
  ];
  
  for (const url of urls) {
    console.log('尝试:', url);
    await page.goto(url, { timeout: 10000, waitUntil: 'domcontentloaded' }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));
    console.log('  =>', page.url().substring(0, 60));
    if (!page.url().includes('404') && !page.url().includes('signin')) {
      console.log('✅ 找到了:', page.url());
      break;
    }
  }
  
  // 读取文章
  const article = fs.readFileSync('zhihu_article_1.md', 'utf-8');
  
  // 等待编辑器加载
  await new Promise(r => setTimeout(r, 2000));
  
  // 点击编辑器区域
  await page.mouse.click(400, 250);
  await new Promise(r => setTimeout(r, 500));
  
  // 清除
  await page.keyboard.press('Control+a');
  await new Promise(r => setTimeout(r, 300));
  await page.keyboard.press('Delete');
  await new Promise(r => setTimeout(r, 500));
  
  // 标题
  await page.keyboard.type('GEO 是什么？跨境电商为什么现在就要做？', { delay: 10 });
  console.log('✅ 标题');
  
  await page.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 200));
  
  // 正文
  let text = article
    .replace(/^# GEO.*$/m, '')
    .replace(/\*此处放你的微信二维码\*/g, '')
    .replace(/\*\*/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .trim();
  
  const lines = text.split('\n').filter(l => l.trim());
  let cc = 0;
  for (const line of lines) {
    let clean = line.trim().replace(/^#{1,3}\s+/, '').replace(/^\d+\.\s+/, '');
    if (!clean) continue;
    await page.keyboard.type(clean, { delay: 1 });
    cc += clean.length;
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 15));
  }
  console.log('✅ 正文 (' + cc + ' 字)');
  
  // 插入二维码
  await page.keyboard.press('Control+End');
  await new Promise(r => setTimeout(r, 200));
  await page.keyboard.press('Enter');
  
  // 找图片上传按钮
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.innerHTML.includes('svg') || btn.textContent.includes('图片') || btn.textContent.includes('插图')) {
        btn.click(); return;
      }
    }
  });
  await new Promise(r => setTimeout(r, 1500));
  
  const fi = await page.waitForSelector('input[type=file]', { timeout: 5000 }).catch(() => null);
  if (fi) {
    await fi.setInputFiles(path.join(process.cwd(), 'qr.jpg'));
    console.log('✅ 二维码');
  } else {
    console.log('⚠️ 请手动上传二维码');
  }
  
  console.log('\\n✅ 完成！去浏览器检查并手动发布');
  await browser.close();
})();
