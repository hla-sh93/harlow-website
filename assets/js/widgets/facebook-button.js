/*
 * Facebook button (Elementor Pro's Facebook button widget): Facebook's like or
 * recommend button, drawn by Facebook's SDK from its plugin markup.
 * As Elementor does, the SDK is loaded only on a page with a Facebook widget, from
 * Facebook's own address in the site's language (facebook_sdk_lang in data-settings), with
 * the site's Facebook app when it has one, once for all the Facebook widgets of the page
 * (window.harlowFacebookSdk); then each widget is drawn.
 */
(() => {
  const widgets = document.querySelectorAll('.elementor-widget-facebook-button');
  if (!widgets.length) return;

  const sdk = () => {
    if (window.harlowFacebookSdk) return window.harlowFacebookSdk;
    let s = {};
    try { s = JSON.parse(widgets[0].dataset.settings || '{}'); } catch (e) { s = {}; }
    const lang = /^[a-z]{2,3}_[A-Z]{2}$/.test(s.facebook_sdk_lang || '') ? s.facebook_sdk_lang : 'en_US';
    window.harlowFacebookSdk = new Promise((resolve) => {
      if (window.FB) { resolve(window.FB); return; }
      if (!document.getElementById('fb-root')) {
        const holder = document.createElement('div');
        holder.id = 'fb-root';
        document.body.prepend(holder);
      }
      const before = window.fbAsyncInit;
      window.fbAsyncInit = () => {
        const options = { version: 'v2.10', xfbml: false };
        if (/^\d+$/.test(s.facebook_app_id || '')) options.appId = s.facebook_app_id;
        window.FB.init(options);
        if (typeof before === 'function') before();
        resolve(window.FB);
      };
      const script = document.createElement('script');
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      script.src = `https://connect.facebook.net/${lang}/sdk.js`;
      document.head.appendChild(script);
    });
    return window.harlowFacebookSdk;
  };

  sdk().then((FB) => widgets.forEach((widget) => FB.XFBML.parse(widget)));
})();
