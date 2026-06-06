(function () {
  'use strict';
  if (typeof ANALYTICS_CONFIG === 'undefined') {
    console.error('[Analytics] analytics-config.js 未加载');
    return;
  }
  const config = ANALYTICS_CONFIG;
  const log = config.debug ? (msg) => console.log('[Analytics]', msg) : () => {};
  function loadGA4() {
    const id = config.ga4.measurementId;
    if (!id || id === 'G-XXXXXXXXXX') { log('GA4 跳过'); return; }
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', id);
    window.gtag = gtag;
    log('GA4 OK');
  }
  function loadClarity() {
    const id = config.clarity.projectId;
    if (!id || id === 'xxxxxxxxxx') { log('Clarity 跳过'); return; }
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window,document,'clarity','script',id);
    log('Clarity OK');
  }
  log('加载分析代码...');
  loadGA4();
  loadClarity();
})();
