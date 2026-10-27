/*
 * Image gallery, grid layout (Elementor's e-gallery): writes the same CSS variables the
 * library writes, so the stylesheet lays the grid out, and loads each thumbnail when it
 * scrolls into view.
 *
 *   container  --hgap --vgap --animation-duration --columns --rows --aspect-ratio
 *              --container-aspect-ratio = (item height * rows + gap * (rows - 1)) / width
 *   item       --column --row
 */
(() => {
  const DEVICES = ['desktop', 'tablet', 'mobile'];
  const device = () => (matchMedia('(max-width: 767px)').matches ? 'mobile'
    : matchMedia('(max-width: 1024px)').matches ? 'tablet' : 'desktop');
  const responsive = (s, name, dev) => {
    for (let i = DEVICES.indexOf(dev); i >= 0; i -= 1) {
      const v = s[i === 0 ? name : `${name}_${DEVICES[i]}`];
      const size = v && typeof v === 'object' ? v.size : v;
      if (size !== undefined && size !== '' && size !== null) return size;
    }
    return undefined;
  };

  function init(widget) {
    let s;
    try { s = JSON.parse(widget.dataset.settings || '{}'); } catch (e) { return; }
    const box = widget.querySelector('.elementor-gallery__container');
    if (!box) return;
    const items = [...box.querySelectorAll('.e-gallery-item')];
    box.classList.add('e-gallery-container', `e-gallery-${s.gallery_layout || 'grid'}`, 'e-gallery--ltr');
    if (s.lazyload === 'yes') box.classList.add('e-gallery--lazyload');
    const [rw, rh] = String(s.aspect_ratio || '16:9').split(':').map(Number);

    const layout = () => {
      const dev = device();
      const columns = +responsive(s, 'columns', dev) || 3;
      const gap = +responsive(s, 'gap', dev) || 0;
      const rows = Math.ceil(items.length / columns);
      box.style.setProperty('--hgap', `${gap}px`);
      box.style.setProperty('--vgap', `${gap}px`);
      box.style.setProperty('--animation-duration', '350ms');
      items.forEach((item, i) => {
        item.style.setProperty('--column', i % columns);
        item.style.setProperty('--row', Math.floor(i / columns));
      });
      box.style.setProperty('--columns', columns);
      box.style.setProperty('--rows', rows);
      const itemWidth = items.length ? items[0].getBoundingClientRect().width : 0;
      const ratio = rh / rw;
      const total = ratio * itemWidth * rows + gap * (rows - 1);
      box.style.setProperty('--aspect-ratio', `${ratio * 100}%`);
      box.style.setProperty('--container-aspect-ratio', `${(total / box.getBoundingClientRect().width) * 100}%`);
    };

    const load = (img) => {
      if (img.classList.contains('e-gallery-image-loaded') || !img.dataset.thumbnail) return;
      img.style.backgroundImage = `url("${img.dataset.thumbnail}")`;
      img.classList.add('e-gallery-image-loaded');
    };
    const images = box.querySelectorAll('.e-gallery-image');
    if (s.lazyload === 'yes') {
      const io = new IntersectionObserver((entries) => entries.forEach((en) => {
        if (en.isIntersecting) { load(en.target); io.unobserve(en.target); }
      }));
      images.forEach((img) => io.observe(img));
    } else {
      images.forEach(load);
    }

    setTimeout(layout, 50);    // e-gallery lays out 50ms after start
    window.addEventListener('resize', layout);
  }

  document.querySelectorAll('.elementor-widget-gallery').forEach(init);
})();
