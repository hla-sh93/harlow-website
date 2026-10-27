/*
 * Home page history slider: every 9 seconds (or on a thumbnail click) the next milestone
 * fades in. Same timings as the site's own custom script: slides cross-fade after 1s,
 * the old texts lose .active-content at 0.7s and the new ones gain it 0.3s later.
 */
(() => {
  const thumbs = [...document.querySelectorAll('.thumb-wrapper')];
  const slides = [...document.querySelectorAll('.history_slide')];
  if (!thumbs.length || !slides.length) return;

  const texts = (slide) => [
    slide.querySelector('.milestone_wrapper'),
    slide.querySelector('.slide_title_wrapper p'),
    slide.querySelector('.slide_title_wrapper .slide_text'),
  ].filter(Boolean);

  const show = (to) => {
    thumbs.forEach((t, i) => t.classList.toggle('active-thumb', i === to));
    slides.forEach((slide, i) => setTimeout(() => { slide.style.opacity = i === to ? 1 : 0; }, 1000));
    setTimeout(() => {
      slides.forEach((slide, i) => { if (i !== to) texts(slide).forEach((el) => el.classList.remove('active-content')); });
      setTimeout(() => texts(slides[to]).forEach((el) => el.classList.add('active-content')), 300);
    }, 700);
  };

  let current = 0;
  const next = () => { current = current + 1 < slides.length ? current + 1 : 0; show(current); };
  let timer = setInterval(next, 9000);
  thumbs.forEach((thumb, i) => thumb.addEventListener('click', () => {
    current = i;
    clearInterval(timer);
    timer = setInterval(next, 9000);
    show(i);
  }));
})();
