/*
 * Progress tracker (Elementor Pro's progress tracker widget, harlow/progress-tracker): as
 * the visitor scrolls, a bar widens or a circle's stroke goes round by the part of the page
 * (or of the element the selector names) that has passed. The settings are the element's
 * data-settings: type, relative_to, selector, percentage.
 */
(() => {
  const clamp = (n) => Math.min(1, Math.max(0, n));

  // How far through the page, or through an element: 0 when its top reaches the top of
  // the screen, 1 when its bottom reaches the bottom of the screen. An element shorter
  // than the screen goes from coming in at the bottom to leaving at the top.
  const progress = (target) => {
    if (!target) {
      const max = document.documentElement.scrollHeight - innerHeight;
      return max > 0 ? clamp(scrollY / max) : 1;
    }
    const r = target.getBoundingClientRect();
    const travel = r.height - innerHeight;
    return travel > 0 ? clamp(-r.top / travel) : clamp((innerHeight - r.top) / (innerHeight + r.height));
  };

  const trackers = [];
  document.querySelectorAll('.elementor-scrolling-tracker').forEach((tracker) => {
    const root = tracker.closest('[data-widget_type]');
    let settings = {};
    try {
      settings = JSON.parse((root && root.dataset.settings) || '{}') || {};
    } catch (e) {
      settings = {};
    }
    let target = null;
    if (settings.relative_to === 'selector' && settings.selector) {
      try {
        target = document.querySelector(settings.selector);
      } catch (e) {
        target = null;
      }
      if (!target) return;
    }
    const circle = tracker.querySelector('circle.current-progress');
    trackers.push({
      target,
      bar: circle ? null : tracker.querySelector('.current-progress'),
      circle,
      length: circle ? Number(circle.getAttribute('stroke-dasharray')) || 0 : 0,
      label: tracker.querySelector('.current-progress-percentage'),
    });
  });
  if (!trackers.length) return;

  let queued = false;
  const update = () => {
    queued = false;
    trackers.forEach((t) => {
      const p = progress(t.target);
      if (t.bar) t.bar.style.width = `${p * 100}%`;
      if (t.circle) t.circle.style.strokeDashoffset = String(t.length * (1 - p));
      if (t.label) t.label.textContent = `${Math.round(p * 100)}%`;
    });
  };
  const queue = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  update();
})();
