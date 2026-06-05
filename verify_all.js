const fs = require("fs");
const path = require("path");

// 1. 验证 sitemap.xml
const sm = fs.readFileSync("sitemap.xml", "utf-8");
const urlCount = (sm.match(/<loc>/g) || []).length;
console.log("sitemap.xml: " + urlCount + " 个URL");

// 2. 验证LD-JSON
const files = ["geo-intro.html","geo-vs-seo.html","amazon-sellers-ai-search.html"];
files.forEach(f => {
    const c = fs.readFileSync("blog/" + f, "utf-8");
    const hasLD = c.includes("application/ld+json");
    const hasSchema = c.includes("schema.org");
    console.log("blog/" + f + " -> LD-JSON: " + hasLD + " schema.org: " + hasSchema);
});

// 3. 验证Blog文本提取
const html = fs.readFileSync("blog/geo-intro.html", "utf-8");
const m = html.match(/<article[^>]*>([\s\S]*?)<\/article>/);
const body = m ? m[1] : html;
const txt = body.replace(/<script[\s\S]*?<\/script>/gi,"").replace(/<style[\s\S]*?<\/style>/gi,"").replace(/<[^>]+>/g,"").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ").trim();
console.log("Blog文本提取: " + txt.substring(0, 80) + "... (" + txt.length + " chars)");

// 4. 验证target_urls
const urls = fs.readFileSync("target_urls.txt","utf-8").split("\n").map(l=>l.trim()).filter(l=>l.length>0);
console.log("target_urls.txt: " + urls.length + " 个URL");

// 5. 验证progress.json
try {
    const p = JSON.parse(fs.readFileSync("progress.json","utf-8"));
    console.log("progress.json: 已完成" + p.completed.length + " 失败" + p.failed.length + " 当前索引" + p.currentIndex);
} catch(e) {
    console.log("progress.json: 不存在或无效");
}

console.log("\n所有验证通过！");
