/*
 * Alert (Elementor's alert widget): its dismiss button fades the alert out and takes it off
 * the page. The fade takes 400ms, the jQuery default the source used.
 */
(() => {
  const DURATION = 400;

  document.querySelectorAll('.elementor-widget-alert .elementor-alert-dismiss').forEach((button) => {
    button.addEventListener('click', () => {
      const alert = button.closest('.elementor-alert');
      if (!alert) return;
      alert.style.transition = `opacity ${DURATION}ms`;
      alert.style.opacity = '0';
      setTimeout(() => {
        alert.style.display = 'none';
      }, DURATION);
    });
  });
})();
