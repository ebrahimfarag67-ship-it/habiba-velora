(() => {
  const gaId = window.VeloraTrackingConfig?.gaId
    || document.querySelector('meta[name="ga-id"]')?.content?.trim()
    || '';
  const pixelId = window.VeloraTrackingConfig?.pixelId
    || document.querySelector('meta[name="facebook-pixel-id"]')?.content?.trim()
    || '';

  function injectScript(src) {
    const script = document.createElement('script');
    script.async = true;
    script.src = src;
    document.head.appendChild(script);
    return script;
  }

  if (gaId) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() {
      window.dataLayer.push(arguments);
    };

    injectScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`);

    window.gtag('js', new Date());
    window.gtag('config', gaId);
  }

  if (pixelId) {
    if (!window.fbq) {
      const fbq = function fbq() {
        fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments);
      };
      fbq.callMethod = null;
      fbq.queue = [];
      window.fbq = fbq;
      window._fbq = fbq;
    }

    injectScript('https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');
  }
})();
