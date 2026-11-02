/*
 * Hotspot (Elementor Pro's hotspot widget, harlow/hotspot), from the element's
 * data-settings as Elementor keeps them. A spot's tooltip opens on a click (a second click,
 * a click elsewhere or Escape closes it; one tooltip open at a time) or while the pointer
 * is on the spot (tooltip_trigger mouseenter). The tooltip's animation lasts
 * tooltip_animation_duration ms; with the sequenced animation the spots appear one after
 * another over hotspot_sequenced_animation_duration ms. A spot with a tooltip takes the
 * keyboard as a button does.
 */
(() => {
  const settingsOf = (root) => {
    try {
      return JSON.parse((root && root.dataset.settings) || '{}') || {};
    } catch (e) {
      return {};
    }
  };

  document.querySelectorAll('.elementor-widget-container > .e-hotspot').forEach((first) => {
    const container = first.parentElement;
    if (container.dataset.harlowHotspot) return;
    container.dataset.harlowHotspot = '1';
    const root = container.closest('[data-widget_type]') || container;
    const s = settingsOf(root);
    const spots = [...container.children].filter((el) => el.classList.contains('e-hotspot'));

    root.style.setProperty('--tooltip-transition-duration', `${Number(s.tooltip_animation_duration) || 500}ms`);
    if (s.hotspot_sequenced_animation === 'yes') {
      const total = Number(s.hotspot_sequenced_animation_duration) || 1000;
      const step = total / Math.max(1, spots.length);
      root.style.setProperty('--hotspot-sequence-step', `${step}ms`);
      spots.forEach((spot, i) => { spot.style.animationDelay = `${i * step}ms`; });
    }

    const close = (except) => spots.forEach((spot) => {
      if (spot === except) return;
      spot.classList.remove('e-hotspot--active');
      const button = spot.querySelector('.e-hotspot__button');
      if (button && button.hasAttribute('aria-expanded')) button.setAttribute('aria-expanded', 'false');
    });
    const toggle = (spot, open) => {
      close(spot);
      spot.classList.toggle('e-hotspot--active', open);
      const button = spot.querySelector('.e-hotspot__button');
      if (button && button.hasAttribute('aria-expanded')) button.setAttribute('aria-expanded', String(open));
    };

    spots.forEach((spot) => {
      if (!spot.querySelector('.e-hotspot__tooltip')) return;
      const button = spot.querySelector('.e-hotspot__button');
      if (s.tooltip_trigger === 'mouseenter') {
        spot.addEventListener('mouseenter', () => toggle(spot, true));
        spot.addEventListener('mouseleave', () => toggle(spot, false));
        spot.addEventListener('focusin', () => toggle(spot, true));
        spot.addEventListener('focusout', () => toggle(spot, false));
      } else {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          toggle(spot, !spot.classList.contains('e-hotspot--active'));
        });
      }
      // A spot that is not a link is reached and opened from the keyboard too.
      if (spot.tagName !== 'A') {
        button.setAttribute('role', 'button');
        button.setAttribute('tabindex', '0');
        button.setAttribute('aria-expanded', 'false');
        button.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle(spot, !spot.classList.contains('e-hotspot--active'));
          }
        });
      }
    });

    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) close(null);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close(null);
    });
  });
})();
