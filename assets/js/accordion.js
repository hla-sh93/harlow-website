/*
 * Accordion (Elementor accordion widget): the first item starts open; a click opens an
 * item and closes the others, a click on the open item closes it. Slides take 400ms, the
 * jQuery default the source used.
 */
(() => {
  const DURATION = 400;

  const slide = (el, open) => {
    if (open) {
      el.style.display = 'block';
      const h = el.scrollHeight;
      el.style.overflow = 'hidden';
      el.style.height = '0px';
      el.getBoundingClientRect();
      el.style.transition = `height ${DURATION}ms`;
      el.style.height = `${h}px`;
    } else {
      el.style.overflow = 'hidden';
      el.style.height = `${el.scrollHeight}px`;
      el.getBoundingClientRect();
      el.style.transition = `height ${DURATION}ms`;
      el.style.height = '0px';
    }
    setTimeout(() => {
      el.style.transition = '';
      el.style.height = '';
      el.style.overflow = '';
      if (!open) el.style.display = 'none';
    }, DURATION);
  };

  const setActive = (title, content, active, animate) => {
    title.classList.toggle('elementor-active', active);
    content.classList.toggle('elementor-active', active);
    title.setAttribute('aria-expanded', String(active));
    title.setAttribute('aria-selected', String(active));
    title.setAttribute('tabindex', active ? '0' : '-1');
    if (animate) slide(content, active);
    else content.style.display = active ? 'block' : 'none';
  };

  document.querySelectorAll('.elementor-accordion').forEach((acc) => {
    const pairs = [...acc.querySelectorAll('.elementor-accordion-item')].map((item) => [
      item.querySelector('.elementor-tab-title'), item.querySelector('.elementor-tab-content'),
    ]).filter(([t, c]) => t && c);
    pairs.forEach(([t, c], i) => setActive(t, c, i === 0, false));
    pairs.forEach(([title, content]) => {
      title.addEventListener('click', () => {
        const wasOpen = title.classList.contains('elementor-active');
        pairs.forEach(([t, c]) => { if (t !== title && t.classList.contains('elementor-active')) setActive(t, c, false, true); });
        setActive(title, content, !wasOpen, true);
      });
      title.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); title.click(); }
      });
    });
  });
})();
