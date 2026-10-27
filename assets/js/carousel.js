/*
 * Loop carousels (Elementor Pro loop carousel): replaces Swiper with the same layout
 * maths, classes and timings.
 *
 *   slides per view   desktop: slides_to_show (+0.001 with an offset on the right or both
 *                     sides), <=1024px: slides_to_show_tablet || 2, <=767px: _mobile || 1
 *   space between     image_spacing_custom, each device falling back to the larger one
 *   slide width       (inner width - (perView - 1) * space) / perView
 *   loop              ceil(perView) duplicates on each side, as Swiper's loop mode
 *   autoplay          autoplay_speed, slide speed `speed`, paused while hovered
 */
(() => {
  const DEVICES = ['desktop', 'tablet', 'mobile'];
  const device = () => (matchMedia('(max-width: 767px)').matches ? 'mobile'
    : matchMedia('(max-width: 1024px)').matches ? 'tablet' : 'desktop');

  const responsive = (s, name, dev) => {          // value with fallback to larger devices
    for (let i = DEVICES.indexOf(dev); i >= 0; i -= 1) {
      const key = i === 0 ? name : `${name}_${DEVICES[i]}`;
      const v = s[key];
      const size = v && typeof v === 'object' ? v.size : v;
      if (size !== undefined && size !== '' && size !== null) return size;
    }
    return undefined;
  };

  function perView(s, dev) {
    const show = +s.slides_to_show || 3;
    if (dev === 'mobile') return +s.slides_to_show_mobile || 1;
    if (dev === 'tablet') return +s.slides_to_show_tablet || (show === 1 ? 1 : 2);
    const offset = s.offset_sides === 'right' || s.offset_sides === 'both';
    return show + (offset ? 0.001 : 0);
  }

  function init(widget) {
    let s;
    try { s = JSON.parse(widget.dataset.settings || '{}'); } catch (e) { return; }
    const container = widget.querySelector('.swiper');
    const wrapper = container && container.querySelector('.swiper-wrapper');
    if (!wrapper) return;
    const originals = [...wrapper.children].filter((el) => el.classList.contains('swiper-slide'));
    if (originals.length < 2) return;
    const loop = s.infinite === 'yes';
    const speed = +s.speed || 300;
    if (s.offset_sides && s.offset_sides !== 'none') container.classList.add(`offset-${s.offset_sides}`);
    container.classList.add('swiper-initialized', 'swiper-horizontal', 'swiper-pointer-events');

    let slides = originals;
    let looped = 0;
    let index = 0;
    let size = 0;
    let space = 0;

    const build = () => {
      wrapper.querySelectorAll('.swiper-slide-duplicate').forEach((d) => d.remove());
      const dev = device();
      const view = perView(s, dev);
      looped = loop ? Math.min(Math.ceil(view), originals.length) : 0;
      if (loop) {
        const n = originals.length;
        const dup = (el) => { const c = el.cloneNode(true); c.classList.add('swiper-slide-duplicate'); return c; };
        for (let i = n - looped; i < n; i += 1) wrapper.insertBefore(dup(originals[i]), originals[0]);
        for (let i = 0; i < looped; i += 1) wrapper.appendChild(dup(originals[i]));
      }
      slides = [...wrapper.children].filter((el) => el.classList.contains('swiper-slide'));
      slides.forEach((el, i) => {
        const real = ((i - looped) % originals.length + originals.length) % originals.length;
        el.setAttribute('data-swiper-slide-index', String(real));
      });
      const cs = getComputedStyle(container);
      const inner = container.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      space = Number(responsive(s, 'image_spacing_custom', dev)) || 0;
      size = (inner - (view - 1) * space) / view;
      slides.forEach((el) => { el.style.width = `${size}px`; el.style.marginRight = `${space}px`; });
    };

    const go = (to, animate) => {
      index = to;
      wrapper.style.transitionDuration = `${animate ? speed : 0}ms`;
      wrapper.style.transform = `translate3d(${-(index + looped) * (size + space)}px, 0px, 0px)`;
      slides.forEach((el, i) => {
        el.classList.toggle('swiper-slide-active', i === index + looped);
        el.classList.toggle('swiper-slide-next', i === index + looped + 1);
        el.classList.toggle('swiper-slide-prev', i === index + looped - 1);
      });
    };

    wrapper.addEventListener('transitionend', () => {       // loop: jump back into range
      if (!loop) return;
      const n = originals.length;
      if (index >= n) go(index - n, false);
      if (index < 0) go(index + n, false);
    });

    const step = (dir) => {
      const n = originals.length;
      if (!loop && (index + dir < 0 || index + dir > n - Math.ceil(perView(s, device())))) return;
      go(index + dir, true);
    };

    let timer = null;
    let paused = false;
    let stopped = false;
    const play = () => {
      clearInterval(timer);
      if (s.autoplay === 'yes' && !paused && !stopped) timer = setInterval(() => step(1), +s.autoplay_speed || 5000);
    };

    widget.querySelectorAll('.elementor-swiper-button-prev, .elementor-swiper-button-next').forEach((btn) => {
      btn.addEventListener('click', () => {
        step(btn.classList.contains('elementor-swiper-button-next') ? 1 : -1);
        if (s.pause_on_interaction === 'yes') stopped = true;
        play();
      });
    });
    if (s.pause_on_hover === 'yes') {
      container.addEventListener('mouseenter', () => { paused = true; play(); });
      container.addEventListener('mouseleave', () => { paused = false; play(); });
    }

    let lastDevice = device();
    let lastWidth = container.clientWidth;
    window.addEventListener('resize', () => {
      if (container.clientWidth === lastWidth && device() === lastDevice) return;
      lastWidth = container.clientWidth;
      lastDevice = device();
      build();
      go(index, false);
    });

    build();
    go(0, false);
    play();
  }

  document.querySelectorAll('.elementor-widget-loop-carousel').forEach(init);
})();
