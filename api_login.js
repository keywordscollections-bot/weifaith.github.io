const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  // 去登录页
  await page.goto("https://www.zhihu.com/signin?next=%2F", { timeout: 15000, waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 2000));
  
  // 先切换到密码登录
  const switched = await page.evaluate(() => {
    const tabs = document.querySelectorAll(".SignContainer-switch");
    for (const tab of tabs) {
      if (tab.textContent.trim() === "密码登录") {
        tab.click();
        return true;
      }
    }
    // 或者找其他元素
    const allEls = document.querySelectorAll("*");
    for (const el of allEls) {
      if (el.textContent.trim() === "密码登录" && el.offsetParent !== null && el.tagName !== "INPUT") {
        el.click();
        return true;
      }
    }
    return false;
  });
  console.log("切换到密码登录:", switched);
  await new Promise(r => setTimeout(r, 1500));
  
  // 获取当前cookies（用于API请求）
  const xsrfCookie = (await context.cookies()).find(c => c.name === "_xsrf");
  const d_c0Cookie = (await context.cookies()).find(c => c.name === "d_c0");
  const xsrf = xsrfCookie ? xsrfCookie.value : "";
  const d_c0 = d_c0Cookie ? d_c0Cookie.value : "";
  
  // 填写
  await page.locator("input[name=username]").fill("15001376727");
  await page.locator("input[name=password]").fill("Nc19940815");
  console.log("已填写");
  
  // 准备获取token
  // 获取页面上的xsrf token
  const pageXsrf = await page.evaluate(() => {
    // 找meta标签
    const meta = document.querySelector('meta[name="xsrf"]');
    return meta ? meta.getAttribute("content") : "";
  });
  console.log("页面xsrf:", pageXsrf);
  console.log("cookie xsrf:", xsrf);
  
  // 设置API请求头
  const headers = {
    "x-requested-with": "XMLHttpRequest",
    "x-xsrftoken": xsrf,
    "cookie": (await context.cookies()).map(c => `${c.name}=${c.value}`).join("; "),
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "origin": "https://www.zhihu.com",
    "referer": "https://www.zhihu.com/signin"
  };
  
  console.log("\n正在通过API密码登录...");
  
  // 使用fetch从页面中发送登录请求
  const loginResult = await page.evaluate(async (xsrf) => {
    try {
      // 获取captcha
      const captchaResp = await fetch("https://www.zhihu.com/api/v3/oauth/captcha?lang=zh", {
        method: "GET",
        headers: { 
          "x-requested-with": "XMLHttpRequest",
          "x-xsrftoken": xsrf
        }
      });
      const captchaData = await captchaResp.json();
      
      // 如果不需要验证码，直接登录
      if (!captchaData.show_captcha) {
        const formData = new URLSearchParams();
        formData.append("username", "15001376727");
        formData.append("password", "Nc19940815");
        formData.append("remember_me", "true");
        
        const loginResp = await fetch("https://www.zhihu.com/api/v3/oauth/sign_in", {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            "x-requested-with": "XMLHttpRequest",
            "x-xsrftoken": xsrf
          },
          body: formData
        });
        const data = await loginResp.json();
        return { success: loginResp.ok, status: loginResp.status, data: JSON.stringify(data).substring(0, 200) };
      } else {
        return { success: false, needCaptcha: true, captchaData: JSON.stringify(captchaData).substring(0, 200) };
      }
    } catch (e) {
      return { error: e.message };
    }
  }, xsrf);
  
  console.log("登录结果:", JSON.stringify(loginResult));
  
  await browser.close();
})();
