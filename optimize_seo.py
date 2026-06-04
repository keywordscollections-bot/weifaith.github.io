import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. html 标签加 prefix
html = html.replace('<html lang="zh-CN">', '<html lang="zh-CN" prefix="og: https://ogp.me/ns#">')

# 2. SEO meta + 结构化数据块
seo_block = """  <meta name="description" content="跨境电商GEO优化服务商。帮品牌在ChatGPT、Perplexity、Gemini等AI搜索引擎中获得免费自然流量。跨境背景×GEO专业×AI驱动——三重稀缺能力，一个服务商。免费获取GEO现状简报。">
  <meta name="keywords" content="GEO优化,跨境电商,AI搜索优化,生成式引擎优化,ChatGPT品牌曝光,Perplexity推荐,跨境SEO,GEO服务,GEO内容优化,跨境流量">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  <meta name="author" content="关键词·跨境GEO">
  <link rel="canonical" href="https://keywordscollections-bot.github.io/weifaith.github.io/">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="关键词·跨境GEO — 跨境电商AI搜索优化(GEO)专家">
  <meta property="og:description" content="帮跨境电商卖家在AI搜索时代获得免费自然流量。跨境背景×GEO专业×AI驱动——三重稀缺能力，一个服务商。">
  <meta property="og:url" content="https://keywordscollections-bot.github.io/weifaith.github.io/">
  <meta property="og:site_name" content="关键词·跨境GEO">
  <meta property="og:locale" content="zh_CN">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="关键词·跨境GEO — 跨境电商AI搜索优化(GEO)专家">
  <meta name="twitter:description" content="帮跨境电商卖家在AI搜索时代获得免费自然流量。跨境背景×GEO专业×AI驱动——三重稀缺能力，一个服务商。">

  <!-- 结构化数据: Organization -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "关键词·跨境GEO",
    "alternateName": "跨���GEO",
    "url": "https://keywordscollections-bot.github.io/weifaith.github.io/",
    "description": "帮跨境电商卖家在AI搜索时代获得免费自然流量。提供GEO诊断、内容优化、全托管服务。",
    "foundingDate": "2026",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "keywordscollections@gmail.com",
      "availableLanguage": ["Chinese", "English"]
    }
  }
  </script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "关键词·跨境GEO",
    "url": "https://keywordscollections-bot.github.io/weifaith.github.io/",
    "description": "跨境电商AI搜索优化(GEO)服务商",
    "inLanguage": "zh-CN"
  }
  </script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "跨境GEO优化服务",
    "provider": {
      "@type": "Organization",
      "name": "关键词·跨境GEO"
    },
    "description": "提供GEO诊断报告、GEO月度内容包、GEO全托管、GEO培训咨询等服务，帮助跨境电商品牌在AI搜索引擎中获得更多曝光和自然流量。",
    "offers": [
      { "@type": "Offer", "name": "GEO诊断报告", "price": "199", "priceCurrency": "CNY" },
      { "@type": "Offer", "name": "GEO月度内容包", "price": "6800", "priceCurrency": "CNY" },
      { "@type": "Offer", "name": "GEO全托管", "price": "30000", "priceCurrency": "CNY" }
    ],
    "areaServed": { "@type": "Country", "name": "China" }
  }
  </script>

  <link rel="dns-prefetch" href="//keywordscollections-bot.github.io">
"""

# 插入到 </head> 之前
html = html.replace('</head>', seo_block + '</head>')

# 3. FAQ 结构化数据在 </body> 前
faq_schema = """<!-- 结构化数据: FAQPage -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "GEO是什么？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "GEO(Generative Engine Optimization，生成式引擎优化)是针对AI搜索引擎(ChatGPT、Perplexity、Gemini等)的优化策略。当用户在AI搜索中提问时，GEO优化的内容更有可能被AI引用和推荐，从而获得免费的自然流量。"
      }
    },
    {
      "@type": "Question",
      "name": "GEO和传统SEO有什么区别？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "传统SEO针对Google、百度等搜索结果的排名优化，而GEO针对AI生成引擎的内容引用优化。GEO的核心是内容结构化、权威性建设和多引擎适配，单篇内容的投产比通常是传统SEO的3-10倍。"
      }
    },
    {
      "@type": "Question",
      "name": "做GEO多久能看到效果？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "一般来说，低竞争行业1-2个月可见AI引用率提升，中等竞争行业2-4个月，高竞争行业3-6个月。持续优化的品牌6-12个月可将AI搜索发展为稳定的流量渠道。"
      }
    },
    {
      "@type": "Question",
      "name": "哪些行业适合做GEO？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "几乎所有跨境电商行业都适合做GEO，包括消费电子、家居户外、宠物用品、时尚服饰、健身器材、B2B设备、储能新能源、健康食品等。竞争度越低见效越快。"
      }
    },
    {
      "@type": "Question",
      "name": "免费GEO诊断包含什么内容？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "免费GEO诊断包含：品牌AI引用现状扫描、竞品GEO对比分析、改进建议和执行路线图。你只需要提供品牌或站点名称，我们出具简短分析报告，0费用0捆绑。"
      }
    }
  ]
}
</script>
"""

html = html.replace('</body>', faq_schema + '</body>')

# 4. 更新 title
old_title = '<title>关键词•跨境GEO</title>'
new_title = '<title>关键词·跨境GEO — 跨境电商AI搜索优化(GEO)专家 | ChatGPT/Perplexity品牌曝光</title>'
html = html.replace(old_title, new_title)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('��� SEO 优化完成')

# 验证
with open('index.html', 'r', encoding='utf-8') as f:
    new_html = f.read()

checks = {
    'schema.org/Organization': 'Organization LD+JSON',
    'schema.org/WebSite': 'WebSite LD+JSON',
    'schema.org/Service': 'Service LD+JSON',
    'schema.org/FAQPage': 'FAQPage LD+JSON',
    'og:type': 'Open Graph',
    'twitter:card': 'Twitter Card',
    'name="description"': 'Meta Description',
    'name="robots"': 'Robots Meta',
    'rel="canonical"': 'Canonical URL',
    'rel="dns-prefetch"': 'DNS Prefetch',
}
for keyword, label in checks.items():
    if keyword in new_html:
        print(f'  ✅ {label}')
    else:
        print(f'  ❌ {label} - 缺失!')

print(f'\n新文件大小: {len(new_html)} 字符')
