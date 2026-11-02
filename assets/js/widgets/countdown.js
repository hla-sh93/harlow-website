/*
 * Countdown (Elementor Pro's countdown widget, harlow/countdown): every second the boxes
 * show the time left until data-date (seconds since 1970) or, for an evergreen timer, until
 * the end of data-evergreen-interval seconds counted from this visitor's first visit (kept
 * in localStorage under Elementor's own keys, evergreen_due_date_<id> and
 * evergreen_interval_<id>). A box that is not shown passes its time to the next one down.
 * At the end the actions of data-expire-actions run: hide the boxes, show the message, go
 * to an address.
 */
(() => {
  const SIZES = { days: 86400, hours: 3600, minutes: 60, seconds: 1 };

  const store = {
    get: (key) => {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },
    set: (key, value) => {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        // Without storage the timer starts again on every visit.
      }
    },
  };

  // The end of an evergreen timer for this visitor, in milliseconds.
  const evergreenEnd = (id, interval) => {
    const dueKey = `evergreen_due_date_${id}`;
    const intervalKey = `evergreen_interval_${id}`;
    const due = Number(store.get(dueKey));
    if (due > 0 && Number(store.get(intervalKey)) === interval) return due;
    const end = Date.now() + interval * 1000;
    store.set(dueKey, String(end));
    store.set(intervalKey, String(interval));
    return end;
  };

  document.querySelectorAll('.elementor-countdown-wrapper').forEach((wrapper) => {
    const root = wrapper.closest('[data-widget_type]');
    const container = wrapper.parentElement;
    const interval = wrapper.dataset.evergreenInterval;
    const end = interval !== undefined
      ? evergreenEnd((root && root.dataset.id) || '', Number(interval) || 0)
      : (Number(wrapper.dataset.date) || 0) * 1000;
    let actions = [];
    try {
      actions = JSON.parse(wrapper.dataset.expireActions || '[]') || [];
    } catch (e) {
      actions = [];
    }
    const boxes = Object.keys(SIZES)
      .map((part) => [part, wrapper.querySelector(`.elementor-countdown-${part}`)])
      .filter(([, el]) => el);

    let timer = null;
    const expire = () => {
      clearInterval(timer);
      actions.forEach((action) => {
        if (action.type === 'hide') {
          wrapper.style.display = 'none';
        } else if (action.type === 'message') {
          const message = container.querySelector('.elementor-countdown-expire--message');
          if (message) message.style.display = 'block';
        } else if (action.type === 'redirect' && action.redirect_url && action.redirect_url !== location.href) {
          location.href = action.redirect_url;
        }
      });
    };

    const tick = () => {
      const left = Math.max(0, Math.floor((end - Date.now()) / 1000));
      let rest = left;
      boxes.forEach(([part, el]) => {
        const value = Math.floor(rest / SIZES[part]);
        rest -= value * SIZES[part];
        el.textContent = String(value).padStart(2, '0');
      });
      if (left <= 0) expire();
    };

    tick();
    if (end > Date.now()) timer = setInterval(tick, 1000);
  });
})();
