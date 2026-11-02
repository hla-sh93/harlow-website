/*
 * Lazy-loaded background pictures (Site settings → Layout): a section's background
 * pictures wait until it is near the screen; then it is "e-lazyloaded", as Elementor marks
 * it, and its pictures load.
 */
(() => {
  const sections = document.querySelectorAll('.e-con.e-parent:not(.e-lazyloaded)');
  if (!('IntersectionObserver' in window)) {
    sections.forEach((el) => el.classList.add('e-lazyloaded'));
    return;
  }
  const near = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('e-lazyloaded');
      near.unobserve(entry.target);
    });
  }, { rootMargin: '200px 0px' });
  sections.forEach((el) => near.observe(el));
})();
