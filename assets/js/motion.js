/*
 * Motion effects (Elementor Pro's): what an element does as the page scrolls past it
 * (moves up or down, left or right, fades, blurs, turns, grows), as the mouse moves (follows
 * it, tilts in 3D), and sticking to the top or bottom of the screen. Each element carries
 * its settings in data-harlow-motion (functions/styles.php), with the devices they apply on.
 */
(() => {
  const device = () => (matchMedia('(max-width: 767px)').matches ? 'mobile'
    : matchMedia('(max-width: 1024px)').matches ? 'tablet' : 'desktop');
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const num = (v, fallback) => (v === '' || v === undefined || v === null || Number.isNaN(Number(v)) ? fallback : Number(v));

  // How far an element has come through the screen, 0 (below it) to 100 (above it), and how
  // far through one effect's range of that.
  const progress = (el) => {
    const r = el.getBoundingClientRect();
    return clamp(((innerHeight - r.top) / (innerHeight + r.height)) * 100, 0, 100);
  };
  const local = (p, fx) => {
    const start = num(fx.start, 0);
    const end = num(fx.end, 100);
    return end > start ? clamp((p - start) / (end - start), 0, 1) : 0;
  };
  // How much of a fade or blur there is (0 none, 1 full) as it goes in, out, in then out,
  // or out then in.
  const curve = (t, direction) => {
    switch (direction) {
      case 'out': return t;
      case 'in-out': return Math.abs(t - 0.5) * 2;
      case 'out-in': return 1 - Math.abs(t - 0.5) * 2;
      default: return 1 - t;
    }
  };

  const items = [];
  document.querySelectorAll('[data-harlow-motion]').forEach((el) => {
    let m;
    try {
      m = JSON.parse(el.dataset.harlowMotion);
    } catch (e) {
      return;
    }
    if (m) items.push({ el, m, mouse: { x: 0, y: 0 }, tilt: { x: 0, y: 0 } });
  });
  if (!items.length) return;

  const on = (list) => !Array.isArray(list) || !list.length || list.includes(device());

  const draw = (item) => {
    const { el, m } = item;
    const parts = [];
    let filter = '';
    let opacity = '';
    const scroll = m.scroll || {};
    if (on(m.devices) && Object.keys(scroll).length) {
      const p = progress(el);
      if (scroll.y) {
        const t = local(p, scroll.y);
        parts.push(`translateY(${(t - 0.5) * 2 * num(scroll.y.speed, 4) * 25 * (scroll.y.direction === 'down' ? 1 : -1)}px)`);
      }
      if (scroll.x) {
        const t = local(p, scroll.x);
        parts.push(`translateX(${(t - 0.5) * 2 * num(scroll.x.speed, 4) * 25 * (scroll.x.direction === 'left' ? -1 : 1)}px)`);
      }
      if (scroll.rotate) {
        const t = local(p, scroll.rotate);
        parts.push(`rotate(${(t - 0.5) * 2 * num(scroll.rotate.speed, 1) * 36 * (scroll.rotate.direction === 'left' ? -1 : 1)}deg)`);
      }
      if (scroll.scale) {
        const t = local(p, scroll.scale);
        const s = num(scroll.scale.speed, 4) / 10;
        const amount = { down: 1 - t, 'up-down': 1 - Math.abs(t - 0.5) * 2, 'down-up': Math.abs(t - 0.5) * 2 }[scroll.scale.direction] ?? t;
        parts.push(`scale(${Math.max(0, 1 - s + amount * s * 2)})`);
      }
      if (scroll.opacity) {
        const level = num(scroll.opacity.level, 10) / 10;
        opacity = String(1 - curve(local(p, scroll.opacity), scroll.opacity.direction) * level);
      }
      if (scroll.blur) {
        filter = `blur(${curve(local(p, scroll.blur), scroll.blur.direction) * num(scroll.blur.level, 7)}px)`;
      }
    }
    if (m.mouse?.track && on(m.devices)) {
      parts.push(`translate(${item.mouse.x}px, ${item.mouse.y}px)`);
    }
    if (m.mouse?.tilt && on(m.devices)) {
      parts.push(`perspective(1000px) rotateX(${item.tilt.x}deg) rotateY(${item.tilt.y}deg)`);
    }
    // The owner's motion wins over the element's own transform, as in Elementor.
    if (parts.length) el.style.setProperty('transform', parts.join(' '), 'important');
    else el.style.removeProperty('transform');
    if (filter) el.style.setProperty('filter', filter, 'important');
    if (opacity) el.style.setProperty('opacity', opacity, 'important');
  };

  const drawAll = () => items.forEach(draw);

  // Following the mouse over the page, or tilting while it is over the element.
  window.addEventListener('mousemove', (e) => {
    items.forEach((item) => {
      const track = item.m.mouse?.track;
      if (track) {
        const k = num(track.speed, 1) * 20 * (track.direction === 'direct' ? 1 : -1);
        item.mouse.x = (e.clientX / innerWidth - 0.5) * k;
        item.mouse.y = (e.clientY / innerHeight - 0.5) * k;
      }
      const tilt = item.m.mouse?.tilt;
      if (tilt) {
        const r = item.el.getBoundingClientRect();
        const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        const k = num(tilt.speed, 4) * 4 * (tilt.direction === 'opposite' ? -1 : 1);
        item.tilt.x = inside ? -((e.clientY - r.top) / r.height - 0.5) * k : 0;
        item.tilt.y = inside ? ((e.clientX - r.left) / r.width - 0.5) * k : 0;
      }
      if (track || tilt) draw(item);
    });
  }, { passive: true });

  // Sticky: held at the top (or bottom) of the screen once the page scrolls to it, with a
  // spacer keeping its room; inside its column only when asked.
  const sticky = items.filter((item) => item.m.sticky && item.m.sticky.on);
  const bar = () => document.getElementById('wpadminbar')?.offsetHeight || 0;
  const unstick = (item) => {
    const { el } = item;
    if (!item.spacer) return;
    item.spacer.remove();
    item.spacer = null;
    ['position', 'top', 'bottom', 'left', 'width', 'margin-top', 'margin-bottom'].forEach((p) => el.style.removeProperty(p));
    el.classList.remove('elementor-sticky--active', 'elementor-sticky--effects');
  };
  const measure = (item) => {
    unstick(item);
    const r = item.el.getBoundingClientRect();
    item.top = r.top + scrollY;
    item.height = r.height;
  };
  const stick = (item) => {
    const s = item.m.sticky;
    const { el } = item;
    if (!on(s.devices)) {
      unstick(item);
      return;
    }
    const offset = num(s.offset, 0) + (s.on === 'top' ? bar() : 0);
    const held = s.on === 'top'
      ? scrollY + offset > item.top
      : scrollY + innerHeight - offset < item.top + item.height;
    if (held && !item.spacer) {
      const r = el.getBoundingClientRect();
      item.spacer = document.createElement('div');
      item.spacer.className = 'harlow-sticky-spacer';
      item.spacer.style.height = `${r.height}px`;
      el.after(item.spacer);
      el.style.setProperty('position', 'fixed', 'important');
      el.style.setProperty('left', `${r.left}px`, 'important');
      el.style.setProperty('width', `${r.width}px`, 'important');
      el.style.setProperty('margin-top', '0', 'important');
      el.style.setProperty('margin-bottom', '0', 'important');
      el.classList.add('elementor-sticky', 'elementor-sticky--active');
    } else if (!held && item.spacer) {
      unstick(item);
    }
    if (item.spacer) {
      let at = offset;
      // Stay in its column: pushed up when the column's bottom comes.
      if (s.column && s.on === 'top' && el.parentElement) {
        const bottom = el.parentElement.getBoundingClientRect().bottom;
        at = Math.min(offset, bottom - item.height);
      }
      el.style.setProperty(s.on === 'top' ? 'top' : 'bottom', `${at}px`, 'important');
      el.classList.toggle('elementor-sticky--effects', scrollY > item.top + num(s.effectsOffset, 0));
    }
  };
  sticky.forEach(measure);

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      sticky.forEach(stick);
      drawAll();
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    sticky.forEach(measure);
    onScroll();
  });
  onScroll();
})();
