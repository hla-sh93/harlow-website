/*
 * Page transition (Elementor Pro): a white screen with the preloader image covers the
 * page until it is shown, and again for a moment when an internal link is followed.
 * Durations come from the stylesheet's custom properties, as in the source component.
 */
(() => {
  const el = document.querySelector('e-page-transition');
  if (!el) return;
  const C = {
    entering: 'e-page-transition--entering',
    exiting: 'e-page-transition--exiting',
    entered: 'e-page-transition--entered',
  };

  const url = el.getAttribute('preloader-image-url');
  if (el.getAttribute('preloader-type') === 'image' && url) {
    const img = document.createElement('img');
    img.className = 'e-page-transition--preloader';
    img.src = url;
    el.appendChild(img);
  }

  const cssMs = (name) => {
    const v = getComputedStyle(el).getPropertyValue(name).trim();
    if (!v) return 0;
    return v.endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000 || 0;
  };
  const duration = () => cssMs('--e-page-transition-animation-duration');
  const preloaderDelay = () => cssMs('--e-preloader-delay');

  const animateState = (state, delay = 0) => {
    const cls = C[state];
    el.classList.remove(cls);
    el.classList.add(cls);
    return new Promise((resolve) => setTimeout(() => { el.classList.remove(cls); resolve(); }, duration() + delay));
  };

  window.addEventListener('pageshow', () => {
    if (el.classList.contains(C.exiting)) {     // back / forward: no animation
      el.classList.add(C.entered);
      el.classList.remove(C.exiting);
    }
    animateState('entering').then(() => el.classList.add(C.entered));
  });

  let exclude = null;
  try { exclude = new RegExp(el.getAttribute('exclude') || '^$'); } catch (e) { exclude = null; }

  const follows = (a, e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
    if (!a.href || a.target === '_blank' || a.hasAttribute('download')) return false;
    if (a.dataset.elementorOpenLightbox === 'yes' || a.closest('.e-gallery-item')) return false;
    if (!/^(https?|file):$/.test(a.protocol) || a.origin !== location.origin) return false;
    if (a.pathname === location.pathname && a.hash) return false;
    if (a.getAttribute('href').startsWith('#') || a.hash.includes('elementor-action')) return false;
    if (exclude && exclude.test(a.href)) return false;
    return true;
  };

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a || !follows(a, e)) return;
    e.preventDefault();
    const href = a.href;
    el.classList.remove(C.entered);
    animateState('exiting', preloaderDelay()).then(() => {
      el.classList.add(C.exiting);
      location.href = href;
    });
  });
})();
