/*
 * Posts lists (Elementor Pro's posts and archive posts widgets): the filter bar shows only
 * the cards of the term clicked, fading the others out; load more fetches the list's next
 * page (the address in its e-load-more-anchor), takes the same widget's cards from it and
 * adds them, on a click of its button or when the end of the list comes into view
 * (infinite scroll), until the last page, where it says there are no more.
 */
(() => {
  const FADE = [
    { opacity: 0, transform: 'scale(0.8)' },
    { opacity: 1, transform: 'scale(1)' },
  ];

  // The filter bar's term, applied to every card of a list (new ones too).
  const applyFilter = (container, term, animate) => {
    container.querySelectorAll(':scope > .elementor-post').forEach((card) => {
      const show = term === '__all' || card.classList.contains(`elementor-filter-${term}`);
      const hidden = card.classList.contains('elementor-filter-hidden');
      if (show && hidden) {
        card.classList.remove('elementor-filter-hidden');
        if (animate && card.animate) card.animate(FADE, { duration: 300, easing: 'ease-out' });
      } else if (!show && !hidden) {
        if (animate && card.animate) {
          card.animate([...FADE].reverse(), { duration: 300, easing: 'ease-in' })
            .onfinish = () => card.classList.add('elementor-filter-hidden');
        } else {
          card.classList.add('elementor-filter-hidden');
        }
      }
    });
  };

  const setup = (widget) => {
    if (widget.dataset.harlowPosts) return;
    widget.dataset.harlowPosts = '1';
    const container = widget.querySelector('.elementor-posts-container');
    if (!container) return;
    let term = '__all';

    // The filter bar.
    const filters = widget.querySelectorAll('.elementor-portfolio__filter');
    filters.forEach((item) => {
      const pick = () => {
        filters.forEach((f) => f.classList.toggle('elementor-active', f === item));
        term = item.dataset.filter || '__all';
        applyFilter(container, term, true);
      };
      item.addEventListener('click', pick);
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          pick();
        }
      });
    });

    // Load more.
    const anchor = widget.querySelector('.e-load-more-anchor');
    let settings = {};
    try {
      settings = JSON.parse(widget.dataset.settings || '{}');
    } catch (e) {
      settings = {};
    }
    const type = settings.pagination_type || '';
    if (!anchor || !type.startsWith('load_more')) return;
    let loading = false;

    const atEnd = () => +anchor.dataset.page >= +anchor.dataset.maxPage;
    if (atEnd()) widget.classList.add('e-load-more-pagination-end');

    const loadMore = () => {
      if (loading || atEnd() || !anchor.dataset.nextPage) return;
      loading = true;
      widget.classList.add('e-load-more-pagination-loading');
      fetch(anchor.dataset.nextPage, { credentials: 'same-origin' })
        .then((response) => response.text())
        .then((html) => {
          const page = new DOMParser().parseFromString(html, 'text/html');
          const twin = page.querySelector(`.elementor-element[data-id="${widget.dataset.id}"]`);
          const cards = twin ? twin.querySelectorAll('.elementor-posts-container > .elementor-post') : [];
          cards.forEach((card) => container.appendChild(document.importNode(card, true)));
          applyFilter(container, term, false);
          const next = twin ? twin.querySelector('.e-load-more-anchor') : null;
          anchor.dataset.page = next ? next.dataset.page : anchor.dataset.maxPage;
          anchor.dataset.nextPage = next ? next.dataset.nextPage : '';
          if (!cards.length) anchor.dataset.page = anchor.dataset.maxPage;
        })
        .catch(() => {
          anchor.dataset.page = anchor.dataset.maxPage;
        })
        .finally(() => {
          loading = false;
          widget.classList.remove('e-load-more-pagination-loading');
          if (atEnd()) widget.classList.add('e-load-more-pagination-end');
        });
    };

    if (type === 'load_more_on_click') {
      const button = widget.querySelector('.elementor-button-wrapper .elementor-button');
      if (button) {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          loadMore();
        });
      }
    } else if ('IntersectionObserver' in window) {
      const watch = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
        if (atEnd()) watch.disconnect();
      }, { rootMargin: '0px 0px 300px 0px' });
      watch.observe(anchor);
    }
  };

  document.querySelectorAll('.elementor-widget-posts, .elementor-widget-archive-posts').forEach(setup);
})();
