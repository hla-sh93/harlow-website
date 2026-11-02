/*
 * Popups made in the Theme Builder (Elementor Pro's): each opens on its triggers (after the
 * page loads, at a point of the scroll, when an element comes into view, after clicks,
 * after inactivity, when the visitor is about to leave) and on a link to #harlow-popup-<id>,
 * as often as its rules allow (times per visit, day, week, month or ever; after so many
 * pages or visits; when arriving from an address; on some devices). It closes on its
 * button, the overlay, Escape, or a link to #harlow-popup-close.
 */
(() => {
  const device = () => (matchMedia('(max-width: 767px)').matches ? 'mobile'
    : matchMedia('(max-width: 1024px)').matches ? 'tablet' : 'desktop');
  const store = (() => {
    try {
      localStorage.setItem('harlow-test', '1');
      localStorage.removeItem('harlow-test');
      return localStorage;
    } catch (e) {
      return null;
    }
  })();
  const read = (key, fallback) => {
    try {
      return JSON.parse(store.getItem(key)) ?? fallback;
    } catch (e) {
      return fallback;
    }
  };
  const write = (key, value) => {
    try {
      store.setItem(key, JSON.stringify(value));
    } catch (e) {
      // A browser that keeps nothing shows every popup by its triggers alone.
    }
  };

  // Pages seen and visits made, for the rules that count them.
  let views = 0;
  let visits = 0;
  if (store) {
    views = read('harlow-views', 0) + 1;
    write('harlow-views', views);
    visits = read('harlow-visits', 0);
    try {
      if (!sessionStorage.getItem('harlow-visit')) {
        sessionStorage.setItem('harlow-visit', '1');
        visits += 1;
        write('harlow-visits', visits);
      }
    } catch (e) {
      // As above.
    }
  }

  const periods = { day: 864e5, week: 6048e5, month: 2592e6 };
  let open = null;

  const allowed = (id, s) => {
    if (Array.isArray(s.devices) && s.devices.length && !s.devices.includes(device())) return false;
    if (s.afterViews && views < s.afterViews) return false;
    if (s.afterSessions && visits < s.afterSessions) return false;
    if (s.from && !document.referrer.includes(s.from)) return false;
    if (!s.times || !store) return true;
    const seen = read(`harlow-popup-${id}`, { count: 0, since: Date.now() });
    if (s.per === 'session') {
      try {
        return Number(sessionStorage.getItem(`harlow-popup-${id}`) || 0) < s.times;
      } catch (e) {
        return true;
      }
    }
    if (periods[s.per] && Date.now() - seen.since > periods[s.per]) return true;
    return seen.count < s.times;
  };

  const count = (id, s) => {
    if (!store) return;
    if (s.per === 'session') {
      try {
        sessionStorage.setItem(`harlow-popup-${id}`, String(Number(sessionStorage.getItem(`harlow-popup-${id}`) || 0) + 1));
      } catch (e) {
        // As above.
      }
      return;
    }
    let seen = read(`harlow-popup-${id}`, { count: 0, since: Date.now() });
    if (periods[s.per] && Date.now() - seen.since > periods[s.per]) seen = { count: 0, since: Date.now() };
    write(`harlow-popup-${id}`, { count: seen.count + 1, since: seen.since });
  };

  const close = (popup) => {
    if (!popup || popup.hidden) return;
    popup.hidden = true;
    popup.classList.remove('harlow-popup--open');
    document.documentElement.classList.remove('harlow-popup-lock');
    if (open === popup) open = null;
    if (popup.harlowReturn) popup.harlowReturn.focus();
  };

  const show = (popup, s, byLink) => {
    if (!popup.hidden) return;
    if (!byLink && (open || !allowed(popup.dataset.id, s))) return;
    if (open) close(open);
    popup.harlowReturn = document.activeElement;
    popup.hidden = false;
    popup.classList.add('harlow-popup--open');
    const box = popup.querySelector('.harlow-popup__box');
    if (s.entrance && s.entrance !== 'none') {
      box.classList.remove('animated', s.entrance);
      void box.offsetWidth;
      box.classList.add('animated', s.entrance);
    }
    if (s.lockScroll) document.documentElement.classList.add('harlow-popup-lock');
    open = popup;
    if (!byLink) count(popup.dataset.id, s);
    const first = box.querySelector('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    (first || box).focus({ preventScroll: true });
  };

  document.querySelectorAll('[data-harlow-popup]').forEach((popup) => {
    let s;
    try {
      s = JSON.parse(popup.dataset.harlowPopup) || {};
    } catch (e) {
      return;
    }
    popup.dataset.id = popup.id.replace('harlow-popup-', '');
    popup.querySelector('.harlow-popup__box').setAttribute('tabindex', '-1');
    popup.querySelector('.harlow-popup__close')?.addEventListener('click', () => close(popup));
    popup.querySelector('.harlow-popup__overlay')?.addEventListener('click', () => {
      if (s.overlayClose !== false) close(popup);
    });
    popup.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && s.escape !== false) close(popup);
    });
    const go = () => show(popup, s, false);

    if (s.load !== null && s.load !== undefined) setTimeout(go, s.load * 1000);
    if (s.scroll) {
      const onScroll = () => {
        const max = document.documentElement.scrollHeight - innerHeight;
        if (max > 0 && (scrollY / max) * 100 >= s.scroll) {
          window.removeEventListener('scroll', onScroll);
          go();
        }
      };
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    if (s.scrollTo) {
      let target = null;
      try {
        target = document.querySelector(s.scrollTo);
      } catch (e) {
        target = null;
      }
      if (target) {
        const seen = new IntersectionObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            seen.disconnect();
            go();
          }
        });
        seen.observe(target);
      }
    }
    if (s.clicks) {
      let clicks = 0;
      document.addEventListener('click', (e) => {
        if (popup.contains(e.target)) return;
        clicks += 1;
        if (clicks === s.clicks) go();
      });
    }
    if (s.inactivity) {
      let timer = setTimeout(go, s.inactivity * 1000);
      ['mousemove', 'keydown', 'scroll', 'touchstart'].forEach((type) => window.addEventListener(type, () => {
        clearTimeout(timer);
        timer = setTimeout(go, s.inactivity * 1000);
      }, { passive: true }));
    }
    if (s.exit) {
      document.addEventListener('mouseout', (e) => {
        if (!e.relatedTarget && e.clientY <= 0) go();
      });
    }
  });

  // Links that open or close a popup.
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href*="#harlow-popup-"]');
    if (!link) return;
    const hash = link.getAttribute('href').split('#')[1];
    if (hash === 'harlow-popup-close') {
      e.preventDefault();
      close(link.closest('.harlow-popup') || open);
      return;
    }
    const popup = document.getElementById(hash);
    if (popup && popup.dataset.harlowPopup) {
      e.preventDefault();
      let s = {};
      try {
        s = JSON.parse(popup.dataset.harlowPopup) || {};
      } catch (err) {
        s = {};
      }
      show(popup, s, true);
    }
  });
})();
