/*
 * Toggle (Elementor's toggle widget, harlow/toggle): every item starts closed; a click on a
 * title opens its content or closes it, without touching the others, so several can be
 * open at once. Contents slide in 400ms, the speed Elementor's slideDown uses. Enter and
 * Space on a title do what a click does.
 */
(() => {
  const DURATION = 400;

  const slide = (el, open) => {
    clearTimeout(el.harlowSlide);
    el.style.display = 'block';
    el.style.overflow = 'hidden';
    const full = el.scrollHeight;
    el.style.height = `${open ? 0 : full}px`;
    el.getBoundingClientRect();
    el.style.transition = `height ${DURATION}ms`;
    el.style.height = `${open ? full : 0}px`;
    el.harlowSlide = setTimeout(() => {
      el.style.transition = '';
      el.style.height = '';
      el.style.overflow = '';
      if (!open) el.style.display = 'none';
    }, DURATION);
  };

  document.querySelectorAll('.elementor-toggle').forEach((toggle) => {
    toggle.querySelectorAll('.elementor-toggle-item').forEach((item) => {
      if (item.closest('.elementor-toggle') !== toggle) return;
      const title = item.querySelector('.elementor-tab-title');
      const content = item.querySelector('.elementor-tab-content');
      if (!title || !content) return;

      title.addEventListener('click', () => {
        const open = !title.classList.contains('elementor-active');
        title.classList.toggle('elementor-active', open);
        content.classList.toggle('elementor-active', open);
        title.setAttribute('aria-expanded', String(open));
        slide(content, open);
      });

      title.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          title.click();
        }
      });
    });
  });
})();
