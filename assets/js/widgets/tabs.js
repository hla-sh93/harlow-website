/*
 * Tabs (Elementor's tabs widget, harlow/tabs): the first tab opens; a click on a title opens
 * its tab and closes the open one. On a phone the titles stand above their contents and a
 * click on the open title closes it. The titles take the keyboard as a tab list does: the
 * arrow keys move between them, Home and End go to the first and the last, Enter and Space
 * open the one that has the focus.
 */
(() => {
  document.querySelectorAll('.elementor-tabs').forEach((tabs) => {
    const own = (el) => el.closest('.elementor-tabs') === tabs;
    const titles = [...tabs.querySelectorAll('.elementor-tab-title')].filter(own);
    const contents = [...tabs.querySelectorAll('.elementor-tab-content')].filter(own);
    if (!titles.length) return;
    let open = null;

    const set = (tab, on) => {
      titles.filter((t) => t.dataset.tab === tab).forEach((t) => {
        t.classList.toggle('elementor-active', on);
        t.setAttribute('aria-selected', String(on));
        t.setAttribute('aria-expanded', String(on));
        t.setAttribute('tabindex', on ? '0' : '-1');
      });
      contents.filter((c) => c.dataset.tab === tab).forEach((c) => {
        c.classList.toggle('elementor-active', on);
        c.style.display = on ? 'block' : 'none';
        if (on) c.removeAttribute('hidden');
        else c.setAttribute('hidden', 'hidden');
      });
    };

    const activate = (tab) => {
      if (open !== null && open !== tab) set(open, false);
      set(tab, true);
      open = tab;
    };

    titles.forEach((title) => {
      title.addEventListener('click', () => {
        const tab = title.dataset.tab;
        if (title.classList.contains('elementor-tab-mobile-title') && open === tab) {
          set(tab, false);
          open = null;
          return;
        }
        activate(tab);
      });

      title.addEventListener('keydown', (e) => {
        // The titles of the same kind as this one: the row's, or the phone's.
        const mobile = title.classList.contains('elementor-tab-mobile-title');
        const row = titles.filter((t) => t.classList.contains('elementor-tab-mobile-title') === mobile);
        const at = row.indexOf(title);
        let next = null;
        switch (e.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            next = row[(at + 1) % row.length];
            break;
          case 'ArrowLeft':
          case 'ArrowUp':
            next = row[(at - 1 + row.length) % row.length];
            break;
          case 'Home':
            next = row[0];
            break;
          case 'End':
            next = row[row.length - 1];
            break;
          case 'Enter':
          case ' ':
            e.preventDefault();
            title.click();
            return;
          default:
            return;
        }
        e.preventDefault();
        next.focus();
      });
    });

    activate(titles[0].dataset.tab);
  });
})();
