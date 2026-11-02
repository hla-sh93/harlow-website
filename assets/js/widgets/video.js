/*
 * Video (Elementor's video widget): what its handler does on the page.
 *
 *   lazy load      the embed's address is set when the player comes into view
 *   a file         played from its start to its end, again and again when it loops
 *   the picture    a click (or Enter) on the picture over the player removes it and plays
 *                  the video in place, autoplay added to the embed's address
 *   lightbox       or opens the video in a lightbox over the page (data-elementor-lightbox),
 *                  styled by the element's own rules: it is built inside a copy of the
 *                  element's id, so the Style tab's lightbox parts reach it
 *
 * The page runs it on every video; the editor runs it on the one it shows
 * (window.harlowWidgets.video), without the lightbox, and stops it when it goes.
 */
(() => {
  const RATIOS = { 219: 2.33333, 169: 1.77777, 43: 1.33333, 32: 1.5, 11: 1, 916: 0.5625 };
  const CLOSE = '<svg aria-hidden="true" class="e-font-icon-svg e-eicon-close" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg"><path d="M742 167L500 408 258 167C246 154 233 150 217 150 196 150 179 158 167 167 154 179 150 196 150 212 150 229 154 242 171 254L408 500 167 742C138 771 138 800 167 829 196 858 225 858 254 829L496 587 738 829C750 842 767 846 783 846 800 846 817 842 829 829 842 817 846 804 846 783 846 767 842 750 829 737L588 500 833 258C863 229 863 200 833 171 804 137 775 137 742 167Z"></path></svg>';

  // The address with autoplay on (Vimeo's start time, #t=, kept last).
  const autoplayUrl = (src) => {
    try {
      const url = new URL(src, document.baseURI);
      url.searchParams.set('autoplay', '1');
      return url.toString();
    } catch (e) {
      return src;
    }
  };

  /*
   * A video in a lightbox, as Elementor's lightbox shows one: an iframe for an embed, a
   * video element for a file, in the aspect ratio of the widget.
   */
  function openLightbox(widget, options) {
    const modal = options.modalOptions || {};
    const ratio = RATIOS[modal.videoAspectRatio] || RATIOS[169];
    const shape = ratio === 1 ? 'square' : (ratio < 1 ? 'portrait' : 'landscape');
    let player;
    if (options.videoType === 'hosted') {
      player = document.createElement('video');
      player.src = options.url;
      player.setAttribute('autoplay', '');
      Object.entries(options.videoParams || {}).forEach(([name, value]) => {
        if (!name.toLowerCase().startsWith('on')) player.setAttribute(name, value);
      });
    } else {
      player = document.createElement('iframe');
      player.setAttribute('allowfullscreen', '1');
      if (options.autoplay === 'yes') player.setAttribute('allow', 'autoplay');
      player.src = options.autoplay === 'yes' ? autoplayUrl(options.url) : options.url;
    }

    // Inside the element's id, as its own rules name it (.elementor [data-id] > ...).
    const host = document.createElement('div');
    host.className = 'elementor harlow-lightbox-host';
    host.innerHTML = `<div class="elementor-element" data-id="${widget.dataset.id || ''}" style="display: contents">
      <div id="${modal.id || ''}" class="dialog-widget dialog-lightbox-widget dialog-type-buttons dialog-type-lightbox elementor-lightbox" role="dialog" aria-modal="true">
        <div class="dialog-widget-content dialog-lightbox-widget-content">
          <div class="dialog-message dialog-lightbox-message">
            <div class="elementor-video-container">
              <div class="elementor-video-wrapper elementor-video-${shape}" style="--video-aspect-ratio: ${ratio}"></div>
            </div>
          </div>
          <div class="dialog-close-button dialog-lightbox-close-button" role="button" tabindex="0" aria-label="Close">${CLOSE}</div>
        </div>
      </div>
    </div>`;
    host.querySelector('.elementor-video-wrapper').appendChild(player);
    const message = host.querySelector('.dialog-message');
    if (modal.entranceAnimation) message.classList.add('animated', modal.entranceAnimation);
    document.body.appendChild(host);
    document.body.classList.add('dialog-prevent-scroll');

    const close = () => {
      host.remove();
      document.body.classList.remove('dialog-prevent-scroll');
      document.removeEventListener('keydown', onKey);
    };
    function onKey(e) {
      if (e.key === 'Escape') close();
    }
    host.querySelector('.dialog-lightbox-close-button').addEventListener('click', close);
    host.querySelector('.dialog-lightbox-close-button').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') close();
    });
    host.querySelector('.dialog-widget-content').addEventListener('click', (e) => {
      if (!e.target.closest('.elementor-video-container, .dialog-lightbox-close-button')) close();
    });
    document.addEventListener('keydown', onKey);
    host.querySelector('.dialog-lightbox-close-button').focus();
  }

  function init(widget, options = {}) {
    let s;
    try { s = JSON.parse(widget.dataset.settings || '{}'); } catch (e) { s = {}; }
    const off = [];
    const on = (target, type, fn) => {
      target.addEventListener(type, fn);
      off.push(() => target.removeEventListener(type, fn));
    };
    const overlay = widget.querySelector('.elementor-custom-embed-image-overlay');
    const frame = widget.querySelector('iframe.elementor-video-iframe');
    const video = widget.querySelector('video.elementor-video');

    // Lazy load: the embed's address when the player comes into view.
    let observer = null;
    if (frame && frame.dataset.lazyLoad && !overlay) {
      observer = new IntersectionObserver((entries) => {
        if (!entries.some((en) => en.isIntersecting)) return;
        frame.src = frame.dataset.lazyLoad;
        observer.disconnect();
      });
      observer.observe(frame);
    }

    // A file: from its start to its end; again from the start when it loops.
    if (video) {
      const start = Number(s.start) || 0;
      const end = Number(s.end) || 0;
      on(video, 'timeupdate', () => {
        if (!end || video.currentTime < end) return;
        if (s.loop === 'yes') {
          video.currentTime = start;
          video.play();
        } else {
          video.pause();
        }
      });
      if (start && s.loop === 'yes') {
        on(video, 'ended', () => {
          video.currentTime = start;
          video.play();
        });
      }
    }

    // The picture over the player.
    if (overlay) {
      const play = () => {
        const box = overlay.dataset.elementorLightbox;
        if (box) {
          if (options.editor) return;
          try { openLightbox(widget, JSON.parse(box)); } catch (e) { /* not a lightbox's settings */ }
          return;
        }
        overlay.remove();
        if (video) {
          video.play();
          return;
        }
        if (frame) {
          frame.setAttribute('allow', 'autoplay');
          frame.src = autoplayUrl(frame.dataset.lazyLoad || frame.src);
        }
      };
      on(overlay, 'click', play);
      on(overlay, 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          play();
        }
      });
    }

    return () => {
      if (observer) observer.disconnect();
      off.forEach((f) => f());
    };
  }

  window.harlowWidgets = window.harlowWidgets || {};
  window.harlowWidgets.video = init;
  if (!window.harlowWidgetsManual) {
    document.querySelectorAll('.elementor-widget-video').forEach((el) => init(el));
  }
})();
