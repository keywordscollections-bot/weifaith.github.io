const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  // 尝试连接已有的 Chrome 浏览器（需要你先启动 Chrome 时开启远程调试）
  // 方法：先关闭所有 Chrome，然后重新打开时用这个命令：
  // "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
  
  try {
    // 先尝试通过 CDP 连接
    const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
    console.log("✅ 成功连接到 Chrome 浏览器");
    
    // 获取所有页面
    const contexts = browser.contexts();
    const pages = contexts[0].pages();
    console.log("当前标签页数量:", pages.length);
    
    for (const p of pages) {
      const url = p.url();
      console.log("标签页:", url.substring(0, 80));
      
      // 找到知乎标签页
      if (url.includes("zhihu.com/editor")) {
        console.log("✅ 找到知乎编辑器页面！");
        
        // 读取文章内容
        const article = fs.readFileSync("zhihu_article_1.md", "utf-8");
        // 读取二维码
        const qrBuffer = fs.readFileSync("qr.jpg");
        const qrBase64 = qrBuffer.toString("base64");
        
        // 先清空编辑器
        // 知乎用的是富文本编辑器，先选中全部内容删除
        await p.evaluate(() => {
          const editor = document.querySelector(".DraftEditor-root");
          if (editor) {
            editor.focus();
            document.execCommand("selectAll");
            document.execCommand("delete");
          }
        });
        
        await p.waitForTimeout(500);
        
        // 逐段插入内容（知乎编辑器比较特殊，需要处理）
        // 先把文章按段落拆分
        const paragraphs = article.split("\n\n");
        
        for (let i = 0; i < paragraphs.length; i++) {
          const para = paragraphs[i].trim();
          if (!para) continue;
          
          await p.evaluate((text) => {
            const editor = document.querySelector(".DraftEditor-root");
            if (editor) {
              editor.focus();
              document.execCommand("insertText", false, text);
            }
          }, para);
          
          // 段落之间加回车
          if (i < paragraphs.length - 1) {
            await p.keyboard.press("Enter");
            await p.waitForTimeout(100);
          }
        }
        
        console.log("✅ 文章内容已填入编辑器");
        
        // 插入二维码图片
        // 找到上传按钮
        await p.evaluate(() => {
          // 点击图片上传按钮
          const imgBtn = document.querySelector('[aria-label="图片"]') || 
                         document.querySelector(".InsertImageButton");
          if (imgBtn) imgBtn.click();
        });
        
        await p.waitForTimeout(1000);
        
        // 通过文件输入上传
        const fileInput = await p.$('input[type="file"]');
        if (fileInput) {
          await fileInput.setInputFiles("qr.jpg");
          console.log("✅ 二维码图片已上传");
        }
        
        await p.waitForTimeout(2000);
        
        // 设置标题
        const titleInput = await p.$('[contenteditable="true"][placeholder*="标题"]');
        if (titleInput) {
          await titleInput.fill("");
          await titleInput.type("GEO 是什么？跨境电商为什么现在就要做？", { delay: 50 });
          console.log("✅ 标题已填入");
        }
        
        console.log("✅ 全部完成！请检查内容，然后手动点发布按钮。");
      }
    }
    
  } catch (err) {
    console.log("❌ 无法连接 Chrome");
    console.log("请先关闭所有 Chrome 窗口，然后以调试模式重新打开：");
    console.log('');
    console.log('按 Win+R → 输入以下命令回车：');
    console.log('"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222');
    console.log('');
    console.log('然后在 Chrome 里登录知乎，打开编辑器页面。');
    console.log('完成后告诉我，我再运行这个脚本。');
  }
})();
