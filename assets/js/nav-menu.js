/*
 * Nav menu: hover submenus on the horizontal menu, and the burger toggle with its
 * full-width dropdown on tablet and mobile. Replaces Elementor Pro's nav-menu handler and
 * SmartMenus with the same classes, attributes and timings.
 */
(() => {
  const SHOW_DELAY = 250;   // SmartMenus showTimeout
  const HIDE_DELAY = 500;   // SmartMenus hideTimeout
  const FADE_OUT = 200;     // SmartMenus default hide animation

  const settingsOf = (el) => {
    try { return JSON.parse(el.dataset.settings || '{}'); } catch (e) { return {}; }
  };

  // Horizontal menu: submenus open on hover, nested ones to the right.
  function initMain(nav) {
    nav.querySelectorAll('li.menu-item-has-children').forEach((li) => {
      const link = li.querySelector(':scope > a');
      const sub = li.querySelector(':scope > ul');
      if (!link || !sub) return;
      link.classList.add('has-submenu');
      link.setAttribute('aria-haspopup', 'true');
      link.setAttribute('aria-expanded', 'false');
      let timer = null;

      const show = () => {
        const nested = li.parentElement.closest('li.menu-item-has-children') !== null;
        const minWidth = Math.max(li.offsetWidth, parseFloat(getComputedStyle(sub).fontSize) * 10);
        sub.style.cssText = `width:auto;min-width:${nested ? 0 : minWidth}px;max-width:1000px;`
          + (nested ? 'top:0;left:100%;' : 'top:auto;left:0;margin-left:0;margin-top:0;')
          + 'display:block;opacity:1;';
        const box = sub.getBoundingClientRect();
        if (box.right > document.documentElement.clientWidth) {        // keepInViewport
          sub.style.left = nested ? 'auto' : `${document.documentElement.clientWidth - box.right}px`;
          if (nested) sub.style.right = '100%';
        }
        link.classList.add('highlighted');
        link.setAttribute('aria-expanded', 'true');
        sub.setAttribute('aria-hidden', 'false');
      };
      const hide = () => {
        link.classList.remove('highlighted');
        link.setAttribute('aria-expanded', 'false');
        sub.setAttribute('aria-hidden', 'true');
        sub.style.transition = `opacity ${FADE_OUT}ms`;
        sub.style.opacity = '0';
        setTimeout(() => { if (!link.classList.contains('highlighted')) sub.style.display = 'none'; }, FADE_OUT);
      };
      li.addEventListener('mouseenter', () => { clearTimeout(timer); timer = setTimeout(show, SHOW_DELAY); });
      li.addEventListener('mouseleave', () => { clearTimeout(timer); timer = setTimeout(hide, HIDE_DELAY); });
      link.addEventListener('click', (e) => {
        if (link.getAttribute('href') === '#') { e.preventDefault(); clearTimeout(timer); show(); }
      });
    });
  }

  // Dropdown (burger) menu: submenus open and close on click, like SmartMenus' collapsible mode.
  function initDropdownSubs(nav) {
    nav.querySelectorAll('li.menu-item-has-children > a').forEach((link) => {
      const sub = link.parentElement.querySelector(':scope > ul');
      if (!sub) return;
      link.classList.add('has-submenu');
      link.setAttribute('aria-expanded', 'false');
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const open = link.classList.toggle('highlighted');
        link.setAttribute('aria-expanded', String(open));
        sub.style.display = open ? 'block' : 'none';
        widget.dispatchEvent(new Event('menuresize'));
      });
    });
  }

  let widget = null;

  function initWidget(el) {
    widget = el;
    const settings = settingsOf(el);
    const main = el.querySelector('.elementor-nav-menu--main');
    const toggle = el.querySelector('.elementor-menu-toggle');
    const dropdown = el.querySelector('.elementor-nav-menu__container.elementor-nav-menu--dropdown');
    if (main) initMain(main);
    if (!toggle || !dropdown) return;
    initDropdownSubs(dropdown);
    const links = dropdown.querySelectorAll('a.elementor-item');

    // full_width "stretch": the dropdown spans the page under the toggle
    const stretch = () => {
      if (!settings.full_width) return;
      dropdown.style.width = `${document.documentElement.clientWidth}px`;
      dropdown.style.left = '0px';
      const left = dropdown.getBoundingClientRect().left;
      dropdown.style.left = `${-left}px`;
      dropdown.style.top = `${toggle.offsetHeight}px`;
    };
    const menuHeight = () => {
      const open = toggle.classList.contains('elementor-active');
      const list = dropdown.querySelector('.elementor-nav-menu');
      dropdown.style.setProperty('--menu-height', open && list ? `${list.offsetHeight}px` : '0');
    };
    const setOpen = (open) => {
      toggle.classList.toggle('elementor-active', open);
      toggle.setAttribute('aria-expanded', String(open));
      dropdown.setAttribute('aria-hidden', String(!open));
      links.forEach((a) => a.setAttribute('tabindex', open ? '0' : '-1'));
      menuHeight();
      if (open) stretch();
    };
    toggle.addEventListener('click', () => setOpen(!toggle.classList.contains('elementor-active')));
    toggle.addEventListener('keyup', (e) => { if (e.keyCode === 13 || e.keyCode === 32) toggle.click(); });
    if (settings.full_width) {
      dropdown.querySelectorAll('.menu-item:not(.menu-item-has-children) > a')
        .forEach((a) => a.addEventListener('click', () => setOpen(false)));
    }
    el.addEventListener('menuresize', menuHeight);
    window.addEventListener('resize', stretch);
    stretch();
    menuHeight();
  }

  document.querySelectorAll('.elementor-widget-nav-menu').forEach(initWidget);

  // The site's custom script adds a close button to the header's mobile menu.
  document.querySelectorAll('.nav-header .header-mobile-menu nav').forEach((nav) => {
    const close = document.createElement('div');
    close.className = 'close-button';
    nav.appendChild(close);
    close.addEventListener('click', () => {
      document.querySelectorAll('.nav-header .header-mobile-menu .elementor-menu-toggle')
        .forEach((t) => t.classList.remove('elementor-active'));
    });
  });

  // Anchor links in the menu are marked active while their section is in view.
  const vh = () => window.innerHeight;
  document.querySelectorAll('.elementor-nav-menu--main .elementor-item-anchor').forEach((a) => {
    if (a.pathname !== location.pathname || !a.hash) return;
    let target = null;
    try { target = document.querySelector(decodeURIComponent(a.hash)); } catch (e) { return; }
    if (!target) return;
    const tall = target.offsetHeight > vh() / 2;
    const margin = `${tall ? -vh() / 2 : 0}px 0px ${-vh() / 2}px 0px`;
    new IntersectionObserver((entries) => entries.forEach((en) => {
      a.classList.toggle('elementor-item-active', en.isIntersecting);
      a.setAttribute('aria-current', en.isIntersecting ? 'location' : '');
    }), { rootMargin: margin }).observe(target);
  });
})();
