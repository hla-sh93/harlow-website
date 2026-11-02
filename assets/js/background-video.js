/*
 * Background video: the hosted <video> covers its container at 16:9, sized in pixels the
 * way Elementor's background-video handler does (not object-fit), and resized with it.
 */
(() => {
  const RATIO = 16 / 9;

  document.querySelectorAll('.elementor-background-video-container').forEach((box) => {
    // A file, or a YouTube or Vimeo frame (sized the same way, playing by itself).
    const video = box.querySelector('video.elementor-background-video-hosted, iframe.elementor-background-video-embed');
    if (!video) return;
    const size = () => {
      const w = box.offsetWidth;
      const h = box.offsetHeight;
      const widthFixed = w / h > RATIO;
      video.style.width = `${widthFixed ? w : h * RATIO}px`;
      video.style.height = `${widthFixed ? w / RATIO : h}px`;
    };
    size();
    window.addEventListener('resize', size);
    if (video.tagName !== 'VIDEO') return;
    video.muted = true;
    const play = video.play();
    if (play && play.catch) play.catch(() => {});
  });
})();
