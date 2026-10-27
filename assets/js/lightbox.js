/*
 * Image lightbox: links to images open full screen over a dark backdrop, with previous /
 * next arrows, a counter and the title, grouped by data-elementor-lightbox-slideshow.
 * The kit has the global image lightbox on, so any link to an image file qualifies unless
 * it says data-elementor-open-lightbox="no".
 */
(() => {
  const IMAGE = /\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i;
  let box = null;
  let group = [];
  let at = 0;

  const qualifies = (a) => a.dataset.elementorOpenLightbox === 'yes'
    || (a.dataset.elementorOpenLightbox !== 'no' && IMAGE.test(a.getAttribute('href') || ''));

  const build = () => {
    box = document.createElement('div');
    box.className = 'site-lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.innerHTML = `
      <div class="site-lightbox__counter"></div>
      <button class="site-lightbox__close" type="button" aria-label="Close">&times;</button>
      <button class="site-lightbox__prev" type="button" aria-label="Previous">&#8249;</button>
      <figure class="site-lightbox__figure"><img alt=""><figcaption></figcaption></figure>
      <button class="site-lightbox__next" type="button" aria-label="Next">&#8250;</button>`;
    document.body.appendChild(box);
    box.querySelector('.site-lightbox__close').addEventListener('click', close);
    box.querySelector('.site-lightbox__prev').addEventListener('click', () => show(at - 1));
    box.querySelector('.site-lightbox__next').addEventListener('click', () => show(at + 1));
    box.addEventListener('click', (e) => { if (e.target === box) close(); });
  };

  const show = (i) => {
    at = (i + group.length) % group.length;
    const a = group[at];
    box.querySelector('img').src = a.getAttribute('href');
    box.querySelector('figcaption').textContent = a.dataset.elementorLightboxTitle || '';
    box.querySelector('.site-lightbox__counter').textContent = `${at + 1} / ${group.length}`;
    box.classList.toggle('site-lightbox--single', group.length < 2);
  };
  function close() {
    box.classList.remove('site-lightbox--open');
    document.documentElement.classList.remove('site-lightbox-lock');
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || !qualifies(a)) return;
    e.preventDefault();
    if (!box) build();
    const id = a.dataset.elementorLightboxSlideshow;
    group = id
      ? [...document.querySelectorAll(`a[data-elementor-lightbox-slideshow="${CSS.escape(id)}"]`)].filter(qualifies)
      : [a];
    box.classList.add('site-lightbox--open');
    document.documentElement.classList.add('site-lightbox-lock');
    show(group.indexOf(a));
  });
  document.addEventListener('keydown', (e) => {
    if (!box || !box.classList.contains('site-lightbox--open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(at - 1);
    if (e.key === 'ArrowRight') show(at + 1);
  });
})();
