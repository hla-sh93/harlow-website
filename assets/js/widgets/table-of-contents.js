/*
 * Table of contents (Elementor Pro's table of contents widget, harlow/table-of-contents),
 * from the element's data-settings as Elementor keeps them: the list of the page's headings
 * of the levels chosen (headings_by_tags), in the container chosen (the page's own
 * Elementor documents, without the header and footer, when none is), but those inside an
 * exclude selector or inside a table of contents. A heading without an id is given one
 * (elementor-toc__heading-anchor-<n>). The list is nested by level (hierarchical_view),
 * numbered or with the bullet icon (marker_view); a click scrolls smoothly to its heading,
 * scroll_offset pixels below the top. The item of the heading being read is marked
 * (elementor-item-active), with the items above it; with collapse_subitems only its
 * subitems show. The title's buttons minimise and open the box, which starts minimised
 * on the devices of minimized_on.
 */
(() => {
  const DEFAULT_CONTAINER = '.elementor:not([data-elementor-type="header"]):not([data-elementor-type="footer"]):not([data-elementor-type="popup"])';
  const BREAKPOINTS = { desktop: Infinity, tablet: 1024, mobile: 767 };

  const settingsOf = (root) => {
    try {
      return JSON.parse((root && root.dataset.settings) || '{}') || {};
    } catch (e) {
      return {};
    }
  };

  const select = (selector, within = document) => {
    try {
      return [...within.querySelectorAll(selector)];
    } catch (e) {
      return [];
    }
  };

  const make = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };

  // The headings as a tree: each under the last heading of a higher level before it.
  const tree = (headings, hierarchical) => {
    const root = { level: 0, children: [] };
    const stack = [root];
    headings.forEach((heading) => {
      const node = { ...heading, children: [] };
      if (hierarchical) {
        while (stack.length > 1 && stack[stack.length - 1].level >= node.level) stack.pop();
      }
      stack[hierarchical ? stack.length - 1 : 0].children.push(node);
      if (hierarchical) stack.push(node);
    });
    return root.children;
  };

  document.querySelectorAll('.elementor-toc__body').forEach((body, tocIndex) => {
    const root = body.closest('[data-widget_type]') || body.parentElement;
    const s = settingsOf(root);
    const levels = Array.isArray(s.headings_by_tags) && s.headings_by_tags.length ? s.headings_by_tags : ['h2', 'h3', 'h4', 'h5', 'h6'];
    const numbers = s.marker_view !== 'bullets';
    const offset = Number(s.scroll_offset) || 0;

    // The headings.
    const containers = select(s.container || DEFAULT_CONTAINER);
    const excluded = (s.exclude_headings_by_selector || '').split(',').map((x) => x.trim()).filter(Boolean);
    const seen = new Set();
    const headings = [];
    containers.forEach((container) => {
      select(levels.join(','), container).forEach((el) => {
        if (seen.has(el) || el.closest('.elementor-widget-table-of-contents, [data-widget_type^="table-of-contents"]')) return;
        if (excluded.some((x) => { try { return el.closest(x); } catch (e) { return false; } })) return;
        const text = el.textContent.replace(/\s+/g, ' ').trim();
        if (!text) return;
        seen.add(el);
        headings.push(el);
      });
    });
    headings.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));

    body.textContent = '';
    if (!headings.length) {
      body.appendChild(make('div', 'elementor-toc__no-headings', s.no_headings_message || ''));
      return;
    }

    const items = headings.map((el, i) => {
      if (!el.id) el.id = `elementor-toc__heading-anchor-${tocIndex ? `${tocIndex}-` : ''}${i}`;
      return { el, level: Number(el.tagName.slice(1)), text: el.textContent.replace(/\s+/g, ' ').trim() };
    });

    // The list.
    const links = [];
    const build = (nodes, top) => {
      const list = make(numbers ? 'ol' : 'ul', 'elementor-toc__list-wrapper');
      nodes.forEach((node) => {
        const li = make('li', 'elementor-toc__list-item');
        const wrapper = make('div', 'elementor-toc__list-item-text-wrapper');
        if (!numbers && s.icon && s.icon.rendered_tag) wrapper.insertAdjacentHTML('beforeend', s.icon.rendered_tag);
        const a = make('a', `elementor-toc__list-item-text${top ? ' elementor-toc__top-level' : ''}`, node.text);
        a.href = `#${node.el.id}`;
        wrapper.appendChild(a);
        li.appendChild(wrapper);
        if (node.children.length) li.appendChild(build(node.children, false));
        list.appendChild(li);
        links.push({ a, li, el: node.el });
      });
      return list;
    };
    body.appendChild(build(tree(items, s.hierarchical_view === 'yes'), true));

    // A click scrolls to the heading.
    links.forEach(({ a, el }) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        scrollTo({ top: el.getBoundingClientRect().top + scrollY - offset, behavior: 'smooth' });
        if (history.replaceState) history.replaceState(null, '', `#${el.id}`);
      });
    });

    // The heading being read: the last one whose top has passed the top of the screen.
    let queued = false;
    const mark = () => {
      queued = false;
      let current = null;
      links.forEach((link) => {
        if (link.el.getBoundingClientRect().top - offset <= 10) current = link;
      });
      links.forEach(({ a, li }) => {
        a.classList.remove('elementor-item-active');
        li.classList.remove('elementor-item-active');
      });
      if (!current) return;
      current.a.classList.add('elementor-item-active');
      for (let li = current.li; li && body.contains(li); li = li.parentElement.closest('.elementor-toc__list-item')) {
        li.classList.add('elementor-item-active');
      }
    };
    addEventListener('scroll', () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(mark);
      }
    }, { passive: true });
    mark();

    // The minimised box.
    if (s.minimize_box !== 'yes') return;
    const buttons = select('.elementor-toc__toggle-button', root);
    const collapse = (closed) => {
      root.classList.toggle('elementor-toc--collapsed', closed);
      buttons.forEach((b) => b.setAttribute('aria-expanded', String(!closed)));
    };
    buttons.forEach((button) => {
      const closing = button.classList.contains('elementor-toc__toggle-button--collapse');
      button.addEventListener('click', () => {
        collapse(closing);
        const other = buttons.find((b) => b !== button);
        if (other) other.focus();
      });
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          button.click();
        }
      });
    });
    const below = BREAKPOINTS[s.minimized_on] || BREAKPOINTS.tablet;
    if (below === Infinity || innerWidth <= below) collapse(true);
  });
})();
