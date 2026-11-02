/*
 * Off-canvas (Elementor Pro's off-canvas widget, harlow/off-canvas), from the element's
 * data-settings as Elementor keeps them. A panel opens from any link to its id
 * (#off-canvas-<element id>; such a link inside the open panel closes it) and from
 * Elementor's action links (#elementor-action:action=off_canvas:open, :close or :toggle,
 * with settings a base64 JSON naming its id). It comes in with its entrance animation
 * (slide from its side, fade, zoom or none) and goes out with its exit animation, in
 * animation_duration ms; it closes from its close button, a click on the overlay or
 * Escape (unless turned off), and keeps the page from scrolling while open if asked. The
 * focus goes into the panel and back to the link that opened it.
 */
(() => {
  const OFF = { left: 'translateX(-100%)', right: 'translateX(100%)', top: 'translateY(-100%)', bottom: 'translateY(100%)' };
  const panels = {};

  const settingsOf = (root) => {
    try {
      return JSON.parse((root && root.dataset.settings) || '{}') || {};
    } catch (e) {
      return {};
    }
  };

  // The keyframes of an animation, coming in (or, reversed, going out).
  const frames = (animation, side, out) => {
    let k = null;
    if (animation === 'slide') k = [{ transform: OFF[side] || OFF.left }, { transform: 'none' }];
    else if (animation === 'fade') k = [{ opacity: 0 }, { opacity: 1 }];
    else if (animation === 'zoom') k = [{ opacity: 0, transform: 'scale(0.8)' }, { opacity: 1, transform: 'none' }];
    return k && out ? k.reverse() : k;
  };

  let scrollLocks = 0;
  const lockScroll = (on) => {
    scrollLocks = Math.max(0, scrollLocks + (on ? 1 : -1));
    document.documentElement.style.overflow = scrollLocks ? 'hidden' : '';
  };

  document.querySelectorAll('.e-off-canvas[id^="off-canvas-"]').forEach((wrapper) => {
    const root = wrapper.closest('[data-widget_type]');
    const s = settingsOf(root);
    const id = wrapper.id.slice('off-canvas-'.length);
    const main = wrapper.querySelector('.e-off-canvas__main');
    const overlay = wrapper.querySelector('.e-off-canvas__overlay');
    const duration = Number(s.animation_duration) >= 0 ? Number(s.animation_duration) : 400;
    const side = s.position || 'left';
    let isOpen = false;
    let opener = null;
    let running = [];

    const play = (out) => {
      running.forEach((a) => a.cancel());
      running = [];
      const k = frames(out ? s.exit_animation : s.entrance_animation, side, out);
      if (k && duration) running.push(main.animate(k, { duration, easing: 'ease', fill: 'both' }));
      const fade = out ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 1 }];
      if (duration) running.push(overlay.animate(fade, { duration, fill: 'both' }));
      return Promise.all(running.map((a) => a.finished.catch(() => {})));
    };

    const open = () => {
      if (isOpen) return;
      isOpen = true;
      opener = document.activeElement;
      wrapper.removeAttribute('inert');
      wrapper.setAttribute('aria-hidden', 'false');
      if (s.prevent_scroll === 'yes') lockScroll(true);
      play(false);
      main.focus({ preventScroll: true });
    };

    const close = () => {
      if (!isOpen) return;
      isOpen = false;
      if (s.prevent_scroll === 'yes') lockScroll(false);
      play(true).then(() => {
        if (isOpen) return;
        wrapper.setAttribute('aria-hidden', 'true');
        wrapper.setAttribute('inert', '');
        running.forEach((a) => a.cancel());
        running = [];
        if (opener && opener.focus) opener.focus({ preventScroll: true });
      });
    };

    panels[id] = { open, close, toggle: () => (isOpen ? close() : open()), wrapper };

    const button = wrapper.querySelector('.e-off-canvas__close');
    if (button) button.addEventListener('click', close);
    overlay.addEventListener('click', () => {
      if (s.is_not_close_on_overlay !== 'yes') close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen && s.is_not_close_on_esc !== 'yes') close();
    });
  });

  // The links that open, close or toggle a panel.
  const ACTION = /#elementor-action(?::|%3A)action(?:=|%3D)off_canvas(?::|%3A)(open|close|toggle)(?:&|%26)settings(?:=|%3D)([^&]*)/i;
  document.addEventListener('click', (e) => {
    const link = e.target.closest && e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    let panel = null;
    let what = 'toggle';
    const action = href.match(ACTION);
    if (action) {
      what = action[1].toLowerCase();
      try {
        const data = JSON.parse(atob(decodeURIComponent(action[2])));
        panel = panels[data.id];
      } catch (err) {
        panel = null;
      }
      if (!panel && what === 'close') {
        const inside = link.closest('.e-off-canvas[id^="off-canvas-"]');
        panel = inside ? panels[inside.id.slice('off-canvas-'.length)] : null;
      }
    } else {
      const hash = href.slice(href.indexOf('#'));
      if (href.includes('#off-canvas-')) panel = panels[hash.slice('#off-canvas-'.length)];
    }
    if (!panel) return;
    e.preventDefault();
    panel[what]();
  });
})();
