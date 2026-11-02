/*
 * Progress bar (Elementor's progress bar widget, harlow/progress): when a bar comes into
 * view its width is set to its percentage (data-max); the stylesheet's transition fills it
 * in one second.
 */
(() => {
  const fill = (bar) => {
    bar.style.width = `${Number(bar.dataset.max) || 0}%`;
  };

  const bars = document.querySelectorAll('.elementor-progress-bar[data-max]');
  if (!('IntersectionObserver' in window)) {
    bars.forEach(fill);
    return;
  }
  const seen = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      seen.unobserve(entry.target);
      fill(entry.target);
    });
  });
  bars.forEach((bar) => seen.observe(bar));
})();
