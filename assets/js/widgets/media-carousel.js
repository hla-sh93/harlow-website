/*
 * Media carousel (Elementor Pro's media carousel widget): moves the slides as Swiper moves
 * them for Elementor, with the settings it keeps in data-settings, in its three skins.
 *
 *   carousel          slides_per_view || 3 (tablet 2, mobile 1), slides_to_scroll per move,
 *                     space_between (per device) || 10
 *   slideshow         one slide at a time (slide or fade), the thumbnails under it: a click
 *                     on a thumbnail shows its slide, the thumbnail of the slide shown is
 *                     brought to the middle (slides_per_view thumbnails || 5)
 *   coverflow         the active slide in the middle, the others turned towards it; a click
 *                     on a slide brings it to the middle; the middle slide first
 *   loop, autoplay    as Swiper's (autoplay_speed, paused while hovered, stopped by a click)
 *   pagination        bullets, a fraction or a progress bar
 *   a video slide     its link (data-elementor-lightbox-video) plays the video in a lightbox,
 *                     built inside a copy of the element's id so the Style tab's lightbox
 *                     part reaches it; a picture's link opens the site's lightbox
 *
 * The page runs it on every media carousel; the editor runs it on the one it shows
 * (window.harlowWidgets['media-carousel']), without autoplay or lightbox.
 */
(() => {
  const DEVICES = ['desktop', 'tablet', 'mobile'];
  const device = () => (matchMedia('(max-width: 767px)').matches ? 'mobile'
    : matchMedia('(max-width: 1024px)').matches ? 'tablet' : 'desktop');
  const CLOSE = '<svg aria-hidden="true" class="e-font-icon-svg e-eicon-close" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg"><path d="M742 167L500 408 258 167C246 154 233 150 217 150 196 150 179 158 167 167 154 179 150 196 150 212 150 229 154 242 171 254L408 500 167 742C138 771 138 800 167 829 196 858 225 858 254 829L496 587 738 829C750 842 767 846 783 846 800 846 817 842 829 829 842 817 846 804 846 783 846 767 842 750 829 737L588 500 833 258C863 229 863 200 833 171 804 137 775 137 742 167Z"></path></svg>';

  // A responsive setting: the device's value, or the next larger device's.
  const responsive = (s, name, dev) => {
    for (let i = DEVICES.indexOf(dev); i >= 0; i -= 1) {
      const v = s[i === 0 ? name : `${name}_${DEVICES[i]}`];
      const size = v && typeof v === 'object' ? v.size : v;
      if (size !== undefined && size !== '' && size !== null) return size;
    }
    return undefined;
  };

  /*
   * A carousel over a .swiper element and its .swiper-wrapper of .swiper-slide children.
   *
   *   o.perView(dev), o.group(dev), o.space(dev)   numbers per device
   *   o.loop, o.speed, o.effect ('slide', 'fade')
   *   o.autoplay { delay, pauseOnHover, stopOnInteraction } or null
   *   o.prev, o.next (elements), o.pagination (element)
   *   o.rtl, o.lazy, o.onChange(realIndex, slide, animated)
   *   o.centered (the active slide in the middle), o.coverflow (Swiper's coverflow:
   *   rotate 50, depth 100), o.slideToClicked, o.paginationType, o.initial
   */
  function carousel(container, o) {
    const wrapper = container.querySelector(':scope > .swiper-wrapper');
    const originals = [...wrapper.children].filter((el) => el.classList.contains('swiper-slide'));
    const n = originals.length;
    const fade = o.effect === 'fade';
    const sign = o.rtl ? 1 : -1;
    const wraps = Boolean(o.loop) && n > 1;
    const off = [];
    const on = (target, type, fn, opts) => {
      target.addEventListener(type, fn, opts);
      off.push(() => target.removeEventListener(type, fn, opts));
    };
    let slides = originals;
    let looped = 0;
    let index = 0;
    let size = 0;
    let space = 0;
    let view = 1;
    let group = 1;
    let outer = 0;

    const real = (i) => ((i % n) + n) % n;
    const step = () => size + space;
    const maxTranslate = () => Math.max(0, n * step() - space - outer);
    const lastIndex = () => (looped || o.centered ? n - 1 : Math.max(0, Math.ceil(n - view)));

    container.classList.add('swiper-initialized', 'swiper-horizontal', 'swiper-pointer-events');
    if (fade) container.classList.add('swiper-fade');
    if (o.coverflow) container.classList.add('swiper-3d', 'swiper-coverflow');
    if (o.rtl) container.classList.add('swiper-rtl');

    const build = () => {
      wrapper.querySelectorAll(':scope > .swiper-slide-duplicate').forEach((d) => d.remove());
      const dev = device();
      view = fade ? 1 : Math.max(1, Number(o.perView(dev)) || 1);
      group = fade ? 1 : Math.max(1, Math.floor(Number(o.group(dev)) || 1));
      space = fade ? 0 : Math.max(0, Number(o.space(dev)) || 0);
      looped = o.loop && !fade && n > 1 ? n : 0;
      if (looped) {
        const copy = (el) => {
          const c = el.cloneNode(true);
          c.classList.add('swiper-slide-duplicate');
          c.removeAttribute('id');
          // A copy's link opens the lightbox of its original, never a second one.
          c.querySelectorAll('[data-elementor-lightbox-slideshow]').forEach((a) => {
            a.setAttribute('data-elementor-lightbox-slideshow', `${a.getAttribute('data-elementor-lightbox-slideshow')}-copy`);
          });
          return c;
        };
        originals.forEach((el) => wrapper.insertBefore(copy(el), originals[0]));
        originals.forEach((el) => wrapper.appendChild(copy(el)));
      }
      slides = [...wrapper.children].filter((el) => el.classList.contains('swiper-slide'));
      slides.forEach((el, i) => el.setAttribute('data-swiper-slide-index', String(real(i - looped))));
      const cs = getComputedStyle(container);
      outer = container.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      size = fade ? outer : (outer - (view - 1) * space) / view;
      slides.forEach((el, i) => {
        el.style.width = `${size}px`;
        el.style[o.rtl ? 'marginLeft' : 'marginRight'] = fade ? '' : `${space}px`;
        if (fade) el.style.transform = `translate3d(${sign * i * outer}px, 0px, 0px)`;
      });
      if (o.pagination) buildPagination();
    };

    // Dots, a fraction or a progress bar, as Swiper writes them.
    const pages = () => (looped || o.centered ? Math.ceil(n / group) : (() => {
      let count = 0;
      for (let i = 0; i < n; i += group) {
        count += 1;
        if (i * step() >= maxTranslate() - 1) return count;
      }
      return count;
    })());
    const page = () => (looped || o.centered ? Math.floor(real(index) / group) % pages()
      : Math.min(pages() - 1, Math.ceil(index / group)));
    const buildPagination = () => {
      const type = o.paginationType || 'bullets';
      const el = o.pagination;
      el.className = `swiper-pagination swiper-pagination-${type} swiper-pagination-horizontal`;
      if (type === 'bullets') {
        el.classList.add('swiper-pagination-clickable');
        el.innerHTML = Array.from({ length: pages() }, (x, i) => `<span class="swiper-pagination-bullet" role="button" tabindex="0" data-bullet-index="${i}" aria-label="Go to slide ${i + 1}"></span>`).join('');
      } else if (type === 'fraction') {
        el.innerHTML = '<span class="swiper-pagination-current"></span> / <span class="swiper-pagination-total"></span>';
      } else {
        el.innerHTML = '<span class="swiper-pagination-progressbar-fill"></span>';
      }
    };
    const paint = () => {
      const el = o.pagination;
      if (!el) return;
      const at = page();
      const total = pages();
      el.querySelectorAll('.swiper-pagination-bullet').forEach((b, i) => {
        b.classList.toggle('swiper-pagination-bullet-active', i === at);
        if (i === at) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      });
      const current = el.querySelector('.swiper-pagination-current');
      if (current) {
        current.textContent = String(at + 1);
        el.querySelector('.swiper-pagination-total').textContent = String(total);
      }
      const fill = el.querySelector('.swiper-pagination-progressbar-fill');
      if (fill) {
        fill.style.transform = `translate3d(0px, 0px, 0px) scaleX(${(at + 1) / total}) scaleY(1)`;
        fill.style.transitionDuration = `${o.speed}ms`;
      }
    };

    const lazy = () => {
      if (!o.lazy) return;
      const from = (index + looped) - 1;
      const to = (index + looped) + Math.ceil(view);
      slides.forEach((el, i) => {
        if (i < from || i > to) return;
        el.querySelectorAll('.swiper-lazy:not(.swiper-lazy-loaded)').forEach((img) => {
          if (img.dataset.src) img.src = img.dataset.src;
          if (img.dataset.background) img.style.backgroundImage = `url("${img.dataset.background}")`;
          img.classList.add('swiper-lazy-loaded');
        });
      });
    };

    const go = (to, animate) => {
      index = looped ? to : Math.max(0, Math.min(to, lastIndex()));
      const active = fade ? real(index) : index + looped;
      if (fade) {
        slides.forEach((el, i) => {
          el.style.transitionDuration = `${animate ? o.speed : 0}ms`;
          el.style.opacity = i === active ? '1' : '0';
        });
      } else {
        let x = (index + looped) * step();
        if (o.centered) x -= (outer - size) / 2;
        else if (!looped) x = Math.min(x, maxTranslate());
        wrapper.style.transitionDuration = `${animate ? o.speed : 0}ms`;
        wrapper.style.transform = `translate3d(${sign * x}px, 0px, 0px)`;
      }
      slides.forEach((el, i) => {
        el.classList.toggle('swiper-slide-active', i === active);
        el.classList.toggle('swiper-slide-next', i === active + 1);
        el.classList.toggle('swiper-slide-prev', i === active - 1);
        el.classList.toggle('swiper-slide-duplicate-active', el.classList.contains('swiper-slide-duplicate') && real(i - looped) === real(index));
      });
      if (!wraps) {
        [[o.prev, index <= 0], [o.next, index >= lastIndex()]].forEach(([btn, end]) => {
          if (!btn) return;
          btn.classList.toggle('swiper-button-disabled', end);
          btn.setAttribute('aria-disabled', end ? 'true' : 'false');
        });
      }
      if (o.coverflow) {
        // Swiper's coverflow: each slide turned towards the middle and pushed back by its
        // distance from the active one.
        slides.forEach((el, i) => {
          const d = i - active;
          el.style.transitionDuration = `${animate ? o.speed : 0}ms`;
          el.style.transform = `translate3d(0px, 0px, ${-100 * Math.abs(d)}px) rotateX(0deg) rotateY(${-50 * d * (o.rtl ? -1 : 1)}deg) scale(1)`;
          el.style.zIndex = String(1 - Math.abs(d));
        });
      }
      paint();
      lazy();
      if (o.onChange) o.onChange(real(index), slides[active], animate);
    };

    // Back into the slides themselves from a copy, without moving on the screen.
    const settle = () => {
      if (!looped || (index >= 0 && index < n)) return;
      go(real(index), false);
      wrapper.getBoundingClientRect();
    };
    on(wrapper, 'transitionend', (e) => {
      if (e.target === wrapper) settle();
    });

    // One move: by the slides per move, to the first again at the end when looping (or
    // when autoplay runs out of slides, as Swiper's autoplay does).
    const move = (dir, auto) => {
      settle();
      if (!looped && dir > 0 && index >= lastIndex()) {
        if (wraps || auto) go(0, true);
        return;
      }
      if (!looped && dir < 0 && index <= 0) {
        if (wraps) go(lastIndex(), true);
        return;
      }
      go(index + dir * group, true);
    };

    // Autoplay.
    let timer = null;
    let paused = false;
    let stopped = !o.autoplay;
    const play = () => {
      clearTimeout(timer);
      if (!stopped && !paused) timer = setTimeout(() => { move(1, true); play(); }, o.autoplay.delay);
    };
    const touched = () => {
      if (o.autoplay && o.autoplay.stopOnInteraction) stopped = true;
      play();
    };
    if (o.autoplay && o.autoplay.pauseOnHover) {
      on(container, 'mouseenter', () => { paused = true; play(); });
      on(container, 'mouseleave', () => { paused = false; play(); });
    }

    // Arrows and dots, by click and by key.
    const press = (el, fn) => {
      if (!el) return;
      on(el, 'click', fn);
      on(el, 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(e); }
      });
    };
    press(o.prev, () => { move(-1); touched(); });
    press(o.next, () => { move(1); touched(); });
    press(o.pagination, (e) => {
      const bullet = e.target.closest('.swiper-pagination-bullet');
      if (!bullet) return;
      settle();
      go(Number(bullet.dataset.bulletIndex) * group, true);
      touched();
    });

    // Swipe with a finger or the mouse.
    let start = null;
    let moved = 0;
    let from = 0;
    on(container, 'pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('.elementor-swiper-button, .swiper-pagination')) return;
      settle();
      start = e.clientX;
      moved = 0;
      const m = /translate3d\((-?[\d.]+)px/.exec(wrapper.style.transform || '');
      from = m ? Number(m[1]) : 0;
    });
    on(window, 'pointermove', (e) => {
      if (start === null) return;
      moved = e.clientX - start;
      if (!fade && Math.abs(moved) > 5) {
        wrapper.style.transitionDuration = '0ms';
        wrapper.style.transform = `translate3d(${from + moved}px, 0px, 0px)`;
      }
    });
    on(window, 'pointerup', () => {
      if (start === null) return;
      start = null;
      if (Math.abs(moved) < 40) {
        go(index, true);
        return;
      }
      const before = index;
      move((moved < 0 ? 1 : -1) * (o.rtl ? -1 : 1));
      if (index === before) go(index, true);
      touched();
    });
    // A swipe is not a click on the slide's link.
    on(container, 'click', (e) => {
      if (Math.abs(moved) >= 5) {
        e.preventDefault();
        e.stopPropagation();
        moved = 0;
        return;
      }
      if (o.slideToClicked) {
        const slide = e.target.closest('.swiper-slide');
        const at = slides.indexOf(slide);
        if (at >= 0 && at !== (fade ? real(index) : index + looped)) {
          e.preventDefault();
          e.stopPropagation();
          settle();
          go(looped ? at - looped : at, true);
          touched();
          return;
        }
      }
      // A copy's link: its original's.
      const a = e.target.closest('.swiper-slide-duplicate a');
      if (!a) return;
      const slide = a.closest('.swiper-slide');
      const original = originals[Number(slide.getAttribute('data-swiper-slide-index'))];
      const link = original && original.querySelector('a');
      if (link) {
        e.preventDefault();
        e.stopPropagation();
        link.click();
      }
    }, true);
    on(container, 'dragstart', (e) => e.preventDefault());

    let lastWidth = container.clientWidth;
    let lastDevice = device();
    on(window, 'resize', () => {
      if (container.clientWidth === lastWidth && device() === lastDevice) return;
      lastWidth = container.clientWidth;
      lastDevice = device();
      const at = real(index);
      build();
      go(at, false);
    });

    build();
    go(Math.min(o.initial || 0, n - 1), false);
    play();

    return {
      go: (i) => { settle(); go(i, true); },
      get index() { return real(index); },
      destroy() {
        clearTimeout(timer);
        off.forEach((f) => f());
        wrapper.querySelectorAll(':scope > .swiper-slide-duplicate').forEach((d) => d.remove());
        wrapper.removeAttribute('style');
        originals.forEach((el) => {
          el.removeAttribute('style');
          el.removeAttribute('data-swiper-slide-index');
          el.classList.remove('swiper-slide-active', 'swiper-slide-next', 'swiper-slide-prev');
        });
        container.classList.remove('swiper-initialized', 'swiper-horizontal', 'swiper-pointer-events', 'swiper-fade', 'swiper-rtl', 'swiper-3d', 'swiper-coverflow');
        if (o.pagination) {
          o.pagination.className = 'swiper-pagination';
          o.pagination.innerHTML = '';
        }
      },
    };
  }

  // A video in a lightbox, as Elementor's lightbox shows one.
  function openVideo(widget, url) {
    const file = /\.(mp4|m4v|webm|ogv|mov)(\?.*)?$/i.test(url);
    const player = document.createElement(file ? 'video' : 'iframe');
    player.src = url;
    if (file) {
      player.setAttribute('autoplay', '');
      player.setAttribute('controls', '');
    } else {
      player.setAttribute('allowfullscreen', '1');
      player.setAttribute('allow', 'autoplay');
    }
    const host = document.createElement('div');
    host.className = 'elementor harlow-lightbox-host';
    host.innerHTML = `<div class="elementor-element" data-id="${widget.dataset.id || ''}" style="display: contents">
      <div id="elementor-lightbox-slideshow-${widget.dataset.id || ''}" class="dialog-widget dialog-lightbox-widget dialog-type-buttons dialog-type-lightbox elementor-lightbox" role="dialog" aria-modal="true">
        <div class="dialog-widget-content dialog-lightbox-widget-content">
          <div class="dialog-message dialog-lightbox-message">
            <div class="elementor-video-container">
              <div class="elementor-video-wrapper elementor-video-landscape" style="--video-aspect-ratio: 1.77777"></div>
            </div>
          </div>
          <div class="dialog-close-button dialog-lightbox-close-button" role="button" tabindex="0" aria-label="Close">${CLOSE}</div>
        </div>
      </div>
    </div>`;
    host.querySelector('.elementor-video-wrapper').appendChild(player);
    document.body.appendChild(host);
    document.body.classList.add('dialog-prevent-scroll');
    const button = host.querySelector('.dialog-lightbox-close-button');
    const close = () => {
      host.remove();
      document.body.classList.remove('dialog-prevent-scroll');
      document.removeEventListener('keydown', onKey);
    };
    function onKey(e) {
      if (e.key === 'Escape') close();
    }
    button.addEventListener('click', close);
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') close();
    });
    host.querySelector('.dialog-widget-content').addEventListener('click', (e) => {
      if (!e.target.closest('.elementor-video-container, .dialog-lightbox-close-button')) close();
    });
    document.addEventListener('keydown', onKey);
    button.focus();
  }

  function init(widget, options = {}) {
    if (widget.harlowCarousel) widget.harlowCarousel.destroy();
    let s;
    try { s = JSON.parse(widget.dataset.settings || '{}'); } catch (e) { return undefined; }
    const main = widget.querySelector('.elementor-main-swiper');
    if (!main || !main.querySelector('.swiper-slide')) return undefined;
    const thumbsBox = widget.querySelector('.elementor-thumbnails-swiper');
    const skin = s.skin || 'carousel';
    const count = main.querySelectorAll(':scope > .swiper-wrapper > .swiper-slide').length;
    const show = Number(s.slides_per_view) || (skin === 'slideshow' ? 5 : 3);
    const perView = (dev) => {
      if (dev === 'desktop') return show;
      if (dev === 'tablet') return Number(s.slides_per_view_tablet) || (skin === 'slideshow' ? show : (show === 1 ? 1 : 2));
      return Number(s.slides_per_view_mobile) || (skin === 'slideshow' ? (Number(s.slides_per_view_tablet) || show) : 1);
    };
    const space = (dev) => {
      const v = responsive(s, 'space_between', dev);
      return v === undefined ? 10 : Number(v) || 0;
    };
    const autoplay = s.autoplay === 'yes' && !options.editor ? {
      delay: Number(s.autoplay_speed) || 5000,
      pauseOnHover: s.pause_on_hover === 'yes',
      stopOnInteraction: s.pause_on_interaction === 'yes',
    } : null;
    const speed = Number(s.speed) || 500;
    let thumbs = null;
    let api = null;

    // A video's link is kept out of the site's picture lightbox.
    main.querySelectorAll('a[data-elementor-lightbox-video]').forEach((a) => {
      a.setAttribute('data-elementor-lightbox-slideshow', `${a.getAttribute('data-elementor-lightbox-slideshow')}-video`);
    });

    api = carousel(main, {
      perView: skin === 'slideshow' ? () => 1 : perView,
      group: skin === 'slideshow' ? () => 1 : (dev) => Number(responsive(s, 'slides_to_scroll', dev)) || 1,
      space: skin === 'slideshow' ? () => 0 : space,
      loop: s.loop === 'yes',
      speed,
      effect: skin === 'slideshow' && s.effect === 'fade' ? 'fade' : 'slide',
      coverflow: skin === 'coverflow',
      centered: skin === 'coverflow',
      slideToClicked: skin === 'coverflow',
      initial: skin === 'coverflow' && s.loop !== 'yes' ? Math.floor((count - 1) / 2) : 0,
      autoplay,
      prev: main.querySelector('.elementor-swiper-button-prev'),
      next: main.querySelector('.elementor-swiper-button-next'),
      pagination: main.querySelector('.swiper-pagination'),
      paginationType: s.pagination || 'bullets',
      lazy: s.lazyload === 'yes',
      onChange: (real) => {
        if (thumbs && thumbs.index !== real) thumbs.go(real);
      },
    });
    if (thumbsBox) {
      thumbs = carousel(thumbsBox, {
        perView,
        group: () => 1,
        space,
        loop: s.loop === 'yes',
        speed,
        centered: true,
        slideToClicked: true,
        autoplay: null,
        lazy: s.lazyload === 'yes',
        onChange: (real) => {
          if (api && api.index !== real) api.go(real);
        },
      });
    }

    // A video slide: the lightbox, once the carousel has seen the click (a swipe is not one).
    const onClick = (e) => {
      const a = e.target.closest('a[data-elementor-lightbox-video]');
      if (!a || !main.contains(a)) return;
      e.preventDefault();
      e.stopPropagation();
      if (!options.editor) openVideo(widget, a.getAttribute('data-elementor-lightbox-video'));
    };
    widget.addEventListener('click', onClick);

    const both = {
      go: (i) => api.go(i),
      get index() { return api.index; },
      destroy() {
        widget.removeEventListener('click', onClick);
        api.destroy();
        if (thumbs) thumbs.destroy();
        main.querySelectorAll('a[data-elementor-lightbox-video]').forEach((a) => {
          a.setAttribute('data-elementor-lightbox-slideshow', a.getAttribute('data-elementor-lightbox-slideshow').replace(/-video$/, ''));
        });
      },
    };
    widget.harlowCarousel = both;
    return () => {
      both.destroy();
      delete widget.harlowCarousel;
    };
  }

  window.harlowWidgets = window.harlowWidgets || {};
  window.harlowWidgets['media-carousel'] = init;
  if (!window.harlowWidgetsManual) {
    document.querySelectorAll('.elementor-widget-media-carousel').forEach((el) => init(el));
  }
})();
