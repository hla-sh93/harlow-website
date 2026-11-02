/*
 * The posts of a list (Elementor Pro's archive posts widget): the posts widget's filter
 * bar and load more (assets/js/widgets/posts.js), loaded from here when the page has no
 * posts widget to load it.
 */
(() => {
  if (document.querySelector('script[src*="/widgets/posts.js"]')) return;
  const self = document.currentScript;
  if (!self) return;
  const script = document.createElement('script');
  script.src = self.src.replace('/widgets/archive-posts.js', '/widgets/posts.js');
  script.defer = true;
  document.head.appendChild(script);
})();
