/*
 * Share buttons (Elementor Pro's share buttons widget): a click (or Enter, or Space) on a
 * button shares on its network (its class elementor-share-btn_<network>). What is shared
 * comes from the widget's data-settings: the owner's address (share_url_type custom_url),
 * or the page's address with its title, excerpt and featured picture. The networks open a
 * window of 640 x 480 in the middle of the screen, as Elementor's share links do; e-mail
 * opens the visitor's mail program, print prints the page.
 */
(() => {
  const NETWORKS = {
    facebook: 'https://www.facebook.com/sharer.php?u={url}',
    twitter: 'https://twitter.com/intent/tweet?text={text}%20{url}',
    'x-twitter': 'https://x.com/intent/tweet?text={text}%20{url}',
    linkedin: 'https://www.linkedin.com/shareArticle?mini=true&url={url}&title={title}&summary={text}&source={url}',
    pinterest: 'https://www.pinterest.com/pin/create/button/?url={url}&media={image}',
    reddit: 'https://reddit.com/submit?url={url}&title={title}',
    vk: 'https://vkontakte.ru/share.php?url={url}&title={title}&description={text}&image={image}',
    odnoklassniki: 'https://connect.ok.ru/offer?url={url}&title={title}&imageUrl={image}',
    tumblr: 'https://tumblr.com/share/link?url={url}',
    digg: 'https://digg.com/submit?url={url}',
    skype: 'https://web.skype.com/share?url={url}',
    stumbleupon: 'https://www.stumbleupon.com/submit?url={url}',
    telegram: 'https://telegram.me/share/url?url={url}&text={text}',
    pocket: 'https://getpocket.com/edit?url={url}',
    xing: 'https://www.xing.com/spi/shares/new?url={url}',
    whatsapp: 'https://api.whatsapp.com/send?text=*{title}*%0A{text}%0A{url}',
    email: 'mailto:?subject={title}&body={text}%0A{url}',
  };
  const WIDTH = 640;
  const HEIGHT = 480;

  const share = (network, data) => {
    if (network === 'print') {
      window.print();
      return;
    }
    const template = NETWORKS[network];
    if (!template) return;
    let link = template.replace(/{([^}]+)}/g, (all, key) => encodeURIComponent(data[key] || ''));
    if (network === 'email') {
      link = link.replace('subject=&', '');
      window.location.href = link;
      return;
    }
    const left = window.screen.width / 2 - WIDTH / 2;
    const top = window.screen.height / 2 - HEIGHT / 2;
    window.open(link, '', `toolbar=0,status=0,width=${WIDTH},height=${HEIGHT},top=${top},left=${left}`);
  };

  document.querySelectorAll('.elementor-widget-share-buttons').forEach((widget) => {
    let s = {};
    try { s = JSON.parse(widget.dataset.settings || '{}'); } catch (e) { s = {}; }
    const data = s.share_url_type === 'custom_url' && s.share_url
      ? { url: s.share_url, title: '', text: '', image: '' }
      : {
        url: window.location.href,
        title: s.share_title || document.title,
        text: s.share_text || '',
        image: s.share_image || '',
      };
    widget.querySelectorAll('.elementor-share-btn').forEach((button) => {
      const match = /(?:^|\s)elementor-share-btn_([\w-]+)/.exec(button.className);
      if (!match) return;
      button.addEventListener('click', () => share(match[1], data));
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          share(match[1], data);
        }
      });
    });
  });
})();
