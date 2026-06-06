const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ 
    headless: false,    // 显示浏览器窗口
    channel: "msedge"   // 用 Edge 浏览器
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. 打开知乎登录页
  await page.goto("https://www.zhihu.com/signin");
  console.log("✅ 知乎登录页已打开");
  console.log("请手动登录...");

  // 2. 等待用户手动登录（检测到页面跳转到首页即登录成功）
  await page.waitForURL("https://www.zhihu.com/**", { timeout: 120000 });
  console.log("✅ 登录成功！");

  // 保存登录状态
  await context.storageState({ path: "zhihu_auth.json" });
  console.log("✅ 登录状态已保存，下次不用再登录");

  // 3. 打开写文章页面
  await page.goto("https://www.zhihu.com/creator/manage");
  console.log("✅ 创作者中心已打开");

  // 4. 点击「写文章」
  await page.goto("https://www.zhihu.com/creator/manage");
  
  // 等待几秒让页面完全加载
  await page.waitForTimeout(2000);

  // 寻找写文章按钮
  const writeBtn = await page.locator("a[href*='/edit']").first();
  if (await writeBtn.isVisible()) {
    await writeBtn.click();
    console.log("✅ 已点击写文章");
  } else {
    // 直接去编辑页面
    await page.goto("https://www.zhihu.com/editor");
    console.log("✅ 直接打开编辑器");
  }

  console.log("请手动粘贴文章内容并发布。");
  console.log("完成后按 Ctrl+C 关闭浏览器。");
})();
