const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('连接 Chrome...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = browser.contexts()[0];
  
  // 开编辑器页面
  const page = await ctx.newPage();
  console.log('打开创作中心...');
  await page.goto('https://www.zhihu.com/creator', { timeout: 20000 });
  await new Promise(r => setTimeout(r, 2000));
  console.log('URL:', page.url());
  
  // 点「写文章」
  const writeBtn = await page.waitForSelector('a:has-text("写文章"), button:has-text("写文章"), [href*="editor"], [href*="write"]', { timeout: 5000 }).catch(() => null);
  if (writeBtn) {
    await writeBtn.click();
    await new Promise(r => setTimeout(r, 3000));
  } else {
    // 直接导航到编辑器试试
    console.log('未找到写文章按钮，尝试直接导航...');
  }
  
  console.log('当前URL:', page.url());
  
  // 读取文章
  const article = fs.readFileSync('zhihu_article_1.md', 'utf-8');
  
  // 等待编辑器
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
  
  // 到末尾插二维码
  await page.keyboard.press('Control+End');
  await new Promise(r => setTimeout(r, 200));
  await page.keyboard.press('Enter');
  
  // 点击图片按钮
  await page.evaluate(() => {
    const imgs = document.querySelectorAll('[class*="Image"], [data-tool="image"]');
    for (const el of imgs) { el.click(); return; }
    document.querySelectorAll('button').forEach(b => { if (b.innerHTML.includes('svg')) b.click(); });
  });
  await new Promise(r => setTimeout(r, 1500));
  
  const fi = await page.waitForSelector('input[type=file]', { timeout: 5000 }).catch(() => null);
  if (fi) {
    await fi.setInputFiles(path.join(process.cwd(), 'qr.jpg'));
    console.log('✅ 二维码');
  } else {
    console.log('⚠️ 请手动上传二维码');
  }
  
  console.log('');
  console.log('✅ 完成！请检查并手动发布');
})();
