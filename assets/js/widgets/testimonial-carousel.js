/*
 * Testimonial carousel and reviews (Elementor Pro's carousel widgets): replaces Swiper with
 * the same classes, settings and timings. Settings from the widget's data-settings:
 *
 *   slides per view   slides_per_view, _tablet, _mobile (each device's, its default filled
 *                     in by the widget); tablet at 1024px and below, mobile at 767px
 *   space between     the wrapper's CSS gap (the widget's --e-space-between, per device)
 *   slide width       (inner width - (perView - 1) * space) / perView
 *   slides to scroll  slides_to_scroll, _tablet, _mobile
 *   loop              copies of the first and last slides on each side, as Swiper's loop
 *   autoplay          autoplay_speed between slides, each slide moving in `speed` ms;
 *                     paused while hovered (pause_on_hover), stopped by a click on the
 *                     arrows, dots or a swipe (pause_on_interaction); without a loop it goes
 *                     back to the first slide after the last, as Swiper does
 *   pagination        bullets, fraction or progressbar, drawn into .swiper-pagination
 */
(() => {
  const SUFFIX = { desktop: '', tablet: '_tablet', mobile: '_mobile' };
  const device = () => (matchMedia('(max-width: 767px)').matches ? 'mobile'
    : matchMedia('(max-width: 1024px)').matches ? 'tablet' : 'desktop');
  const onKeys = (el, fn) => el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
  });

  function init(widget) {
    let s;
    try { s = JSON.parse(widget.dataset.settings || '{}'); } catch (e) { return; }
    const container = widget.querySelector('.elementor-main-swiper');
    const wrapper = container && container.querySelector(':scope > .swiper-wrapper');
    if (!wrapper) return;
    const originals = [...wrapper.children].filter((el) => el.classList.contains('swiper-slide'));
    const n = originals.length;
    if (n < 2) return;
    const loop = s.loop === 'yes';
    const speed = s.speed === undefined || s.speed === '' ? 500 : Math.max(0, +s.speed || 0);
    const pagination = container.querySelector(':scope > .swiper-pagination');
    const prev = container.querySelector(':scope > .elementor-swiper-button-prev');
    const next = container.querySelector(':scope > .elementor-swiper-button-next');
    container.classList.add('swiper-initialized', 'swiper-horizontal', 'swiper-pointer-events');

    let view = 1;
    let step = 1;
    let looped = 0;
    let index = 0;
    let size = 0;
    let space = 0;
    let slides = originals;

    const setting = (name) => +s[name + SUFFIX[device()]] || 0;
    const last = () => (loop ? n - 1 : Math.max(0, n - view));
    const positions = () => (loop ? Math.ceil(n / step) : Math.ceil(last() / step) + 1);

    let timer = null;
    let hovered = false;
    let stopped = false;

    const drawPagination = () => {
      if (!pagination) return;
      pagination.className = 'swiper-pagination swiper-pagination-horizontal';
      pagination.textContent = '';
      if (s.pagination === 'bullets') {
        pagination.classList.add('swiper-pagination-clickable', 'swiper-pagination-bullets');
        for (let i = 0; i < positions(); i += 1) {
          const bullet = document.createElement('span');
          bullet.className = 'swiper-pagination-bullet';
          bullet.setAttribute('tabindex', '0');
          bullet.setAttribute('role', 'button');
          bullet.setAttribute('aria-label', `Go to slide ${i + 1}`);
          const to = () => { interact(); slideTo(i * step); };
          bullet.addEventListener('click', to);
          onKeys(bullet, to);
          pagination.appendChild(bullet);
        }
      } else if (s.pagination === 'fraction') {
        pagination.classList.add('swiper-pagination-fraction');
        pagination.innerHTML = '<span class="swiper-pagination-current"></span> / <span class="swiper-pagination-total"></span>';
      } else if (s.pagination === 'progressbar') {
        pagination.classList.add('swiper-pagination-progressbar');
        pagination.innerHTML = '<span class="swiper-pagination-progressbar-fill"></span>';
      }
    };

    const build = () => {
      wrapper.querySelectorAll(':scope > .swiper-slide-duplicate').forEach((d) => d.remove());
      view = Math.max(1, Math.min(n, setting('slides_per_view') || 1));
      step = Math.max(1, setting('slides_to_scroll') || 1);
      looped = loop ? Math.min(n, Math.ceil(view) + step) : 0;
      if (loop) {
        const dup = (el) => {
          const copy = el.cloneNode(true);
          copy.classList.add('swiper-slide-duplicate');
          copy.setAttribute('aria-hidden', 'true');
          return copy;
        };
        for (let i = n - looped; i < n; i += 1) wrapper.insertBefore(dup(originals[i]), originals[0]);
        for (let i = 0; i < looped; i += 1) wrapper.appendChild(dup(originals[i]));
      }
      slides = [...wrapper.children].filter((el) => el.classList.contains('swiper-slide'));
      const cs = getComputedStyle(container);
      const inner = container.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      space = parseFloat(getComputedStyle(wrapper).columnGap) || 0;
      size = (inner - (view - 1) * space) / view;
      slides.forEach((el) => { el.style.width = `${size}px`; });
      drawPagination();
    };

    const go = (to, animate) => {
      index = loop ? to : Math.max(0, Math.min(last(), to));
      wrapper.style.transitionDuration = `${animate ? speed : 0}ms`;
      wrapper.style.transform = `translate3d(${-(index + looped) * (size + space)}px, 0px, 0px)`;
      slides.forEach((el, i) => {
        el.classList.toggle('swiper-slide-active', i === index + looped);
        el.classList.toggle('swiper-slide-next', i === index + looped + 1);
        el.classList.toggle('swiper-slide-prev', i === index + looped - 1);
      });
      const real = ((index % n) + n) % n;
      const active = loop ? Math.floor(real / step) : Math.min(positions() - 1, Math.ceil(index / step));
      if (pagination && s.pagination === 'bullets') {
        [...pagination.children].forEach((b, i) => b.classList.toggle('swiper-pagination-bullet-active', i === active));
      } else if (pagination && s.pagination === 'fraction') {
        pagination.querySelector('.swiper-pagination-current').textContent = String(active + 1);
        pagination.querySelector('.swiper-pagination-total').textContent = String(positions());
      } else if (pagination && s.pagination === 'progressbar') {
        const fill = pagination.querySelector('.swiper-pagination-progressbar-fill');
        fill.style.transitionDuration = `${animate ? speed : 0}ms`;
        fill.style.transform = `translate3d(0px, 0px, 0px) scaleX(${(active + 1) / positions()}) scaleY(1)`;
      }
      if (!loop) {
        [[prev, index <= 0], [next, index >= last()]].forEach(([btn, off]) => {
          if (!btn) return;
          btn.classList.toggle('swiper-button-disabled', off);
          btn.setAttribute('aria-disabled', String(off));
        });
      }
      if (loop && (!animate || speed === 0)) normalize();
    };

    // Loop: from a copy back to the slide it copies, without moving.
    function normalize() {
      if (index >= n) go(index - n, false);
      else if (index < 0) go(index + n, false);
    }
    wrapper.addEventListener('transitionend', (e) => {
      if (e.target === wrapper && loop) normalize();
    });

    function slideTo(to) {
      if (loop) {
        normalize();
        wrapper.getBoundingClientRect();
      }
      go(to, true);
    }
    const stepBy = (dir) => slideTo(index + dir * step);

    const play = () => {
      clearTimeout(timer);
      if (s.autoplay !== 'yes' || hovered || stopped) return;
      timer = setTimeout(() => {
        if (!loop && index >= last()) slideTo(0);
        else stepBy(1);
        play();
      }, +s.autoplay_speed || 5000);
    };
    function interact() {
      if (s.pause_on_interaction === 'yes') stopped = true;
      play();
    }

    [[prev, -1], [next, 1]].forEach(([btn, dir]) => {
      if (!btn) return;
      const move = () => { interact(); stepBy(dir); };
      btn.addEventListener('click', move);
      onKeys(btn, move);
    });
    if (s.pause_on_hover === 'yes') {
      container.addEventListener('mouseenter', () => { hovered = true; play(); });
      container.addEventListener('mouseleave', () => { hovered = false; play(); });
    }

    // A swipe or a drag moves one step, as Swiper's touch does.
    let startX = null;
    container.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('.elementor-swiper-button, .swiper-pagination')) return;
      startX = e.clientX;
    });
    window.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50) { interact(); stepBy(dx < 0 ? 1 : -1); }
    });

    let lastWidth = container.clientWidth;
    let lastDevice = device();
    window.addEventListener('resize', () => {
      if (container.clientWidth === lastWidth && device() === lastDevice) return;
      lastWidth = container.clientWidth;
      lastDevice = device();
      const real = ((index % n) + n) % n;
      build();
      go(loop ? real : index, false);
    });

    build();
    go(0, false);
    play();
  }

  document.querySelectorAll('.elementor-widget-testimonial-carousel, .elementor-widget-reviews').forEach(init);
})();
