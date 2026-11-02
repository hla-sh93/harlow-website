/*
 * Video playlist (Elementor Pro's video playlist widget): what its handler does on the page.
 *
 *   a click (or Enter) on a video of the list shows its player and its own tabs, and plays
 *   it; the player left is stopped
 *   the first video loads at once, or when the playlist comes into view (lazy_load), and
 *   plays by itself, muted, with autoplay_on_load
 *   a video that ends is marked watched (show_watched_indicator, kept in the browser for
 *   the next visit) and the next one plays (autoplay_next): a file says so itself, YouTube
 *   and Vimeo through their players' messages (no script of theirs is loaded)
 *   a video's tab is folded to its first lines, with Show More / Show Less, when it is longer
 *   on a phone the list folds away under its top bar's button
 *
 * The page runs it on every playlist; the editor runs it on the one it shows
 * (window.harlowWidgets['video-playlist']), without playing anything by itself.
 */
(() => {
  // The address with autoplay on (and muted, for a browser to allow it without a click).
  const withAutoplay = (src, muted) => {
    try {
      const url = new URL(src, document.baseURI);
      url.searchParams.set('autoplay', '1');
      if (muted) url.searchParams.set(url.hostname.includes('vimeo') ? 'muted' : 'mute', '1');
      return url.toString();
    } catch (e) {
      return src;
    }
  };

  function init(widget, options = {}) {
    let s;
    try { s = JSON.parse(widget.dataset.settings || '{}'); } catch (e) { s = {}; }
    const box = widget.querySelector('.e-tabs');
    if (!box) return undefined;
    const titles = [...box.querySelectorAll('.e-tab-title')];
    if (!titles.length) return undefined;
    const off = [];
    const on = (target, type, fn, opts) => {
      target.addEventListener(type, fn, opts);
      off.push(() => target.removeEventListener(type, fn, opts));
    };
    const store = `harlow-video-playlist-${widget.dataset.id || ''}`;
    let watched = [];
    try { watched = JSON.parse(localStorage.getItem(store) || '[]'); } catch (e) { watched = []; }
    let current = Number((titles.find((t) => t.classList.contains('e-active')) || titles[0]).dataset.tab);

    const content = (tab) => box.querySelector(`.e-tab-content[data-tab="${tab}"]`);
    const player = (tab) => {
      const panel = content(tab);
      return panel && panel.querySelector('.e-tab-video');
    };

    // Watched videos: their mark, kept for the next visit.
    const markWatched = (tab) => {
      if (s.show_watched_indicator !== 'yes') return;
      if (!watched.includes(tab)) watched.push(tab);
      try { localStorage.setItem(store, JSON.stringify(watched)); } catch (e) { /* not kept */ }
      titles.forEach((t) => t.classList.toggle('e-watched', watched.includes(Number(t.dataset.tab))));
    };
    if (s.show_watched_indicator === 'yes') {
      titles.forEach((t) => t.classList.toggle('e-watched', watched.includes(Number(t.dataset.tab))));
    }

    // Load a player, playing or not; stop one.
    const load = (tab, play, muted) => {
      const el = player(tab);
      if (!el) return;
      const src = el.dataset.src || el.getAttribute('src') || '';
      if (!src) return;
      if (!el.dataset.src) el.dataset.src = src;
      if (el.tagName === 'VIDEO') {
        if (!el.getAttribute('src')) el.src = src;
        if (play) {
          el.muted = Boolean(muted);
          el.play().catch(() => {});
        }
        return;
      }
      const next = play ? withAutoplay(src, muted) : src;
      if (el.src !== next) el.src = next;
    };
    const stop = (tab) => {
      const el = player(tab);
      if (!el) return;
      if (el.tagName === 'VIDEO') el.pause();
      else if (el.getAttribute('src')) el.removeAttribute('src');
    };

    // Show a video of the list: its line, its player, its tabs.
    const choose = (tab, play) => {
      if (tab !== current) stop(current);
      current = tab;
      titles.forEach((t) => {
        const active = Number(t.dataset.tab) === tab;
        t.classList.toggle('e-active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      box.querySelectorAll('.e-tab-content').forEach((panel) => {
        const active = Number(panel.dataset.tab) === tab;
        panel.classList.toggle('e-active', active);
        panel.hidden = !active;
      });
      box.querySelectorAll('.e-inner-tabs-wrapper').forEach((tabs) => {
        const active = Number(tabs.dataset.tab) === tab;
        tabs.classList.toggle('e-active', active);
        tabs.hidden = !active;
      });
      load(tab, play && !options.editor, false);
      fold();
    };
    titles.forEach((t) => {
      const pick = () => choose(Number(t.dataset.tab), true);
      on(t, 'click', pick);
      on(t, 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          pick();
        }
      });
    });

    // The end of a video: watched, then the next one.
    const ended = (tab) => {
      if (tab !== current) return;
      markWatched(tab);
      if (s.autoplay_next !== 'yes' || options.editor) return;
      const at = titles.findIndex((t) => Number(t.dataset.tab) === tab);
      if (at >= 0 && at < titles.length - 1) choose(Number(titles[at + 1].dataset.tab), true);
    };
    box.querySelectorAll('.e-tab-content').forEach((panel) => {
      const el = panel.querySelector('.e-tab-video');
      if (!el) return;
      const tab = Number(panel.dataset.tab);
      if (el.tagName === 'VIDEO') {
        on(el, 'ended', () => ended(tab));
        return;
      }
      // Ask the provider's player to tell when the video ends.
      on(el, 'load', () => {
        if (!el.contentWindow || !el.getAttribute('src')) return;
        if (el.src.includes('youtube')) {
          el.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: tab, channel: 'widget' }), '*');
          el.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange'], id: tab, channel: 'widget' }), '*');
        } else if (el.src.includes('vimeo')) {
          el.contentWindow.postMessage(JSON.stringify({ method: 'addEventListener', value: 'ended' }), '*');
        }
      });
    });
    on(window, 'message', (e) => {
      const el = player(current);
      if (!el || el.tagName === 'VIDEO' || e.source !== el.contentWindow) return;
      let data = e.data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (err) { return; }
      }
      if (!data || typeof data !== 'object') return;
      if (data.event === 'ready' && el.src.includes('vimeo')) {
        el.contentWindow.postMessage(JSON.stringify({ method: 'addEventListener', value: 'ended' }), '*');
      }
      const state = data.event === 'onStateChange' ? data.info
        : (data.event === 'infoDelivery' && data.info ? data.info.playerState : undefined);
      if (state === 0 || data.event === 'ended' || data.event === 'finish') ended(current);
    });

    // The first video: at once, or when the playlist is seen.
    let observer = null;
    const start = () => load(current, s.autoplay_on_load === 'yes' && !options.editor, true);
    if (s.lazy_load === 'yes' && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        if (!entries.some((en) => en.isIntersecting)) return;
        observer.disconnect();
        start();
      });
      observer.observe(box);
    } else {
      start();
    }

    // A video's own tabs.
    box.querySelectorAll('.e-inner-tabs-wrapper').forEach((tabs) => {
      tabs.querySelectorAll('.e-inner-tab-title').forEach((head) => {
        const pick = (e) => {
          e.preventDefault();
          tabs.querySelectorAll('.e-inner-tab-title, .e-inner-tab-content').forEach((el) => {
            const active = el.dataset.tab === head.dataset.tab;
            el.classList.toggle('e-inner-tab-active', active);
            if (el.classList.contains('e-inner-tab-title')) el.setAttribute('aria-selected', active ? 'true' : 'false');
          });
          fold();
        };
        on(head, 'click', pick);
        on(head, 'keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') pick(e);
        });
      });
    });

    // Show More / Show Less, only where the words are longer than the fold.
    function fold() {
      box.querySelectorAll('.e-inner-tab-content').forEach((panel) => {
        const text = panel.querySelector('.e-inner-tab-text--collapsible');
        const button = panel.querySelector('.e-inner-tab-text-toggle');
        if (!text || !button) return;
        const open = panel.classList.contains('e-inner-tab-expanded');
        button.hidden = !open && text.scrollHeight <= text.clientHeight + 1;
      });
    }
    box.querySelectorAll('.e-inner-tab-text-toggle').forEach((button) => {
      on(button, 'click', () => {
        const panel = button.closest('.e-inner-tab-content');
        const open = panel.classList.toggle('e-inner-tab-expanded');
        button.textContent = open ? (s.inner_tab_label_show_less || 'Show Less') : (s.inner_tab_label_show_more || 'Show More');
        button.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
    fold();
    on(window, 'resize', fold);

    // The list's fold on a phone.
    const toggle = box.querySelector('.e-tabs-toggle-videos-display-button');
    if (toggle) {
      const flip = () => box.classList.toggle('e-tabs-folded');
      on(toggle, 'click', flip);
      on(toggle, 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          flip();
        }
      });
    }

    return () => {
      if (observer) observer.disconnect();
      off.forEach((f) => f());
    };
  }

  window.harlowWidgets = window.harlowWidgets || {};
  window.harlowWidgets['video-playlist'] = init;
  if (!window.harlowWidgetsManual) {
    document.querySelectorAll('.elementor-widget-video-playlist').forEach((el) => init(el));
  }
})();
