/*
 * Background slideshow: a container's pictures one after another (Elementor's background
 * slideshow). The slide showing is "is-active"; the one leaving keeps "was-active" while
 * the next slides in over it; a slow zoom (Ken Burns) runs on the slide showing. Stops at
 * the last picture unless it loops.
 */
(() => {
  document.querySelectorAll('[data-harlow-slideshow]').forEach((show) => {
    let settings = {};
    try {
      settings = JSON.parse(show.dataset.harlowSlideshow) || {};
    } catch (e) {
      settings = {};
    }
    const slides = [...show.querySelectorAll('.elementor-background-slideshow__slide')];
    if (slides.length < 2) return;
    let at = 0;
    const next = () => {
      if (at === slides.length - 1 && settings.loop === false) return;
      const from = slides[at];
      at = (at + 1) % slides.length;
      const to = slides[at];
      slides.forEach((s) => s.classList.remove('was-active'));
      from.classList.remove('is-active');
      from.classList.add('was-active');
      to.classList.add('is-active');
      const zoom = to.querySelector('.elementor-ken-burns');
      if (zoom) {
        slides.forEach((s) => s.querySelector('.elementor-ken-burns')?.classList.remove('elementor-ken-burns--active'));
        // Restart the zoom from its first state on the slide coming in.
        void zoom.offsetWidth;
        zoom.classList.add('elementor-ken-burns--active');
      }
      setTimeout(next, settings.duration || 5000);
    };
    setTimeout(next, settings.duration || 5000);
  });
})();
