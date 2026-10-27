/*
 * Entrance animations: an element with an animation in its data-settings stays
 * .elementor-invisible until it enters the viewport, then gets "animated <name>" after its
 * delay. Same trigger as Elementor (IntersectionObserver, no margin, threshold 0) and the
 * same per-device fallback (mobile -> tablet -> desktop).
 */
(() => {
  const device = () => (matchMedia('(max-width: 767px)').matches ? 'mobile'
    : matchMedia('(max-width: 1024px)').matches ? 'tablet' : 'desktop');

  const deviceSetting = (s, name) => {
    const d = device();
    if (d === 'mobile') return s[`${name}_mobile`] ?? s[`${name}_tablet`] ?? s[name];
    if (d === 'tablet') return s[`${name}_tablet`] ?? s[name];
    return s[name];
  };

  const animate = (el, s) => {
    const name = deviceSetting(s, 'animation') || deviceSetting(s, '_animation');
    if (!name || name === 'none') {
      el.classList.remove('elementor-invisible');
      return;
    }
    const delay = s._animation_delay || s.animation_delay || 0;
    setTimeout(() => {
      el.classList.remove('elementor-invisible');
      el.classList.add('animated', name);
    }, delay);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      animate(entry.target, entry.target._revealSettings);
    });
  }, { rootMargin: '0px', threshold: [0] });

  document.querySelectorAll('[data-settings]').forEach((el) => {
    let s;
    try { s = JSON.parse(el.dataset.settings); } catch (e) { return; }
    if (!Object.keys(s).some((k) => /^_?animation(_tablet|_mobile)?$/.test(k))) return;
    el._revealSettings = s;
    observer.observe(el);
  });
})();
