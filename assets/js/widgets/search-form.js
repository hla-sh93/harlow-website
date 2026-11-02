/*
 * Search form (Elementor Pro's search form widget): the field marks its form while it has
 * the focus (elementor-search-form--focus, for the focus colours); the minimal skin's icon
 * puts the focus in the field; the full screen skin's toggle opens the field over the whole
 * screen, and the close button, a click beside the field or Escape closes it.
 */
(() => {
  const FULL = ['elementor-search-form--full-screen', 'elementor-lightbox'];

  document.querySelectorAll('.elementor-widget-search-form').forEach((widget) => {
    const form = widget.querySelector('.elementor-search-form');
    const container = widget.querySelector('.elementor-search-form__container');
    const input = widget.querySelector('.elementor-search-form__input');
    if (!form || !container || !input) return;

    if (widget.classList.contains('elementor-search-form--skin-full_screen')) {
      const toggle = widget.querySelector('.elementor-search-form__toggle');
      const close = widget.querySelector('.dialog-close-button');
      const isOpen = () => container.classList.contains(FULL[0]);
      const open = () => {
        container.classList.add(...FULL);
        input.focus();
      };
      const shut = () => {
        container.classList.remove(...FULL);
        if (toggle) toggle.focus();
      };
      const onKey = (action) => (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          action();
        }
      };
      if (toggle) {
        toggle.addEventListener('click', open);
        toggle.addEventListener('keydown', onKey(open));
      }
      if (close) {
        close.addEventListener('click', shut);
        close.addEventListener('keydown', onKey(shut));
      }
      container.addEventListener('click', (e) => {
        if (e.target === container) shut();
      });
      document.addEventListener('keyup', (e) => {
        if (e.key === 'Escape' && isOpen()) shut();
      });
      return;
    }

    input.addEventListener('focus', () => form.classList.add('elementor-search-form--focus'));
    input.addEventListener('blur', () => form.classList.remove('elementor-search-form--focus'));
    const icon = widget.querySelector('.elementor-search-form__icon');
    if (icon) icon.addEventListener('click', () => input.focus());
  });
})();
