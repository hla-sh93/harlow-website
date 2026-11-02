/*
 * Image carousel (Elementor's image carousel widget): moves the slides as Swiper moves them
 * for Elementor, with the settings it keeps in data-settings.
 *
 *   slides per view   slides_to_show || 3, tablet: slides_to_show_tablet || (1 ? 1 : 2),
 *                     mobile: slides_to_show_mobile || 1
 *   slides per move   slides_to_scroll (per device) || 1; one slide shown may fade instead
 *   space between     image_spacing_custom (per device, falling back to the larger one)
 *   loop              infinite: a copy of the slides on each side, as Swiper's loop mode
 *   autoplay          autoplay_speed, paused while hovered (pause_on_hover), stopped by a
 *                     click or a swipe (pause_on_interaction)
 *   navigation        arrows, dots (clickable bullets), both or none
 *   lazyload          a picture loads when its slide comes near
 *
 * The page runs it on every image carousel; the editor runs it on the one it shows
 * (window.harlowWidgets['image-carousel']), without autoplay, and stops it when it goes.
 */
(() => {
  const DEVICES = ['desktop', 'tablet', 'mobile'];
  const device = () => (matchMedia('(max-width: 767px)').matches ? 'mobile'
    : matchMedia('(max-width: 1024px)').matches ? 'tablet' : 'desktop');

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
   *   o.rtl, o.lazy, o.onChange(realIndex, slide)
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
    const lastIndex = () => (looped ? n - 1 : Math.max(0, Math.ceil(n - view)));

    container.classList.add('swiper-initialized', 'swiper-horizontal', 'swiper-pointer-events');
    if (fade) container.classList.add('swiper-fade');
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
    const pages = () => (looped ? Math.ceil(n / group) : (() => {
      let count = 0;
      for (let i = 0; i < n; i += group) {
        count += 1;
        if (i * step() >= maxTranslate() - 1) return count;
      }
      return count;
    })());
    const page = () => (looped ? Math.floor(real(index) / group) % pages()
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
        if (!looped) x = Math.min(x, maxTranslate());
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
      paint();
      lazy();
      if (o.onChange) o.onChange(real(index), slides[active]);
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
        container.classList.remove('swiper-initialized', 'swiper-horizontal', 'swiper-pointer-events', 'swiper-fade', 'swiper-rtl');
        if (o.pagination) {
          o.pagination.className = 'swiper-pagination';
          o.pagination.innerHTML = '';
        }
      },
    };
  }

  function init(widget, options = {}) {
    if (widget.harlowCarousel) widget.harlowCarousel.destroy();
    let s;
    try { s = JSON.parse(widget.dataset.settings || '{}'); } catch (e) { return undefined; }
    const container = widget.querySelector('.elementor-image-carousel-wrapper');
    if (!container || !container.querySelector('.swiper-slide')) return undefined;
    const show = Number(s.slides_to_show) || 3;
    const single = (dev) => (dev === 'desktop' ? show : Number(s[`slides_to_show_${dev}`]) || (dev === 'tablet' ? (show === 1 ? 1 : 2) : 1)) === 1;
    const api = carousel(container, {
      perView: (dev) => {
        if (dev === 'desktop') return show;
        if (dev === 'tablet') return Number(s.slides_to_show_tablet) || (show === 1 ? 1 : 2);
        return Number(s.slides_to_show_mobile) || 1;
      },
      group: (dev) => Number(responsive(s, 'slides_to_scroll', dev)) || 1,
      space: (dev) => Number(responsive(s, 'image_spacing_custom', dev)) || 0,
      loop: s.infinite === 'yes',
      speed: Number(s.speed) || 500,
      effect: single(device()) && s.effect === 'fade' ? 'fade' : 'slide',
      autoplay: s.autoplay === 'yes' && !options.editor ? {
        delay: Number(s.autoplay_speed) || 5000,
        pauseOnHover: s.pause_on_hover === 'yes',
        stopOnInteraction: s.pause_on_interaction === 'yes',
      } : null,
      prev: container.querySelector('.elementor-swiper-button-prev'),
      next: container.querySelector('.elementor-swiper-button-next'),
      pagination: container.querySelector('.swiper-pagination'),
      rtl: container.getAttribute('dir') === 'rtl',
      lazy: s.lazyload === 'yes',
    });
    widget.harlowCarousel = api;
    return () => {
      api.destroy();
      delete widget.harlowCarousel;
    };
  }

  window.harlowWidgets = window.harlowWidgets || {};
  window.harlowWidgets['image-carousel'] = init;
  if (!window.harlowWidgetsManual) {
    document.querySelectorAll('.elementor-widget-image-carousel').forEach((el) => init(el));
  }
})();
