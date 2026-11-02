/*
 * Counter (Elementor's counter widget, harlow/counter): when the number comes into view it
 * counts from data-from-value to data-to-value in data-duration milliseconds, easing in and
 * out as Elementor's count does, with as many decimals as the ending number has and its
 * thousands apart by data-delimiter.
 */
(() => {
  const format = (value, decimals, delimiter) => {
    const [whole, part] = value.toFixed(decimals).split('.');
    const grouped = delimiter ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, delimiter) : whole;
    return part ? `${grouped}.${part}` : grouped;
  };

  const count = (el) => {
    const from = Number(el.dataset.fromValue) || 0;
    const to = Number(el.dataset.toValue) || 0;
    const duration = Math.max(0, Number(el.dataset.duration) || 0);
    const decimals = (String(el.dataset.toValue || '').split('.')[1] || '').length;
    const delimiter = el.dataset.delimiter || '';
    const start = performance.now();
    const step = (now) => {
      const t = duration ? Math.min(1, (now - start) / duration) : 1;
      const eased = 0.5 - Math.cos(t * Math.PI) / 2;
      el.textContent = format(from + (to - from) * eased, decimals, delimiter);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const numbers = document.querySelectorAll('.elementor-counter-number');
  if (!('IntersectionObserver' in window)) {
    numbers.forEach(count);
    return;
  }
  const seen = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      seen.unobserve(entry.target);
      count(entry.target);
    });
  });
  numbers.forEach((el) => seen.observe(el));
})();
