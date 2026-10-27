/*
 * Cookie bar (GDPR Cookie Compliance markup): shown until the visitor accepts; "settings"
 * opens the cookie settings dialog. The choice is kept in localStorage. Nothing is loaded
 * or blocked by it here: this static site sets no cookies.
 */
(() => {
  const KEY = 'harlow-cookie-consent';
  const bar = document.getElementById('moove_gdpr_cookie_info_bar');
  const modal = document.getElementById('moove_gdpr_cookie_modal');
  const stored = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const store = (v) => { try { localStorage.setItem(KEY, v); } catch (e) { /* private mode */ } };

  const hideBar = () => {
    if (!bar) return;
    bar.classList.add('moove-gdpr-info-bar-hidden');
    bar.style.display = 'none';
    document.body.classList.remove('gdpr-infobar-visible');
  };
  const showBar = () => {
    if (!bar) return;
    bar.classList.remove('moove-gdpr-info-bar-hidden');
    bar.style.display = '';
    document.body.classList.add('gdpr-infobar-visible');
  };

  const openModal = () => {
    if (!modal) return;
    modal.classList.remove('gdpr_lightbox-hide');
    modal.classList.add('cookie-modal-open');
    document.body.classList.add('cookie-modal-lock');
  };
  const closeModal = () => {
    if (!modal) return;
    modal.classList.add('gdpr_lightbox-hide');
    modal.classList.remove('cookie-modal-open');
    document.body.classList.remove('cookie-modal-lock');
  };

  if (!stored()) showBar();
  document.querySelectorAll('.moove-gdpr-infobar-allow-all, .moove-gdpr-modal-allow-all').forEach((btn) => {
    btn.addEventListener('click', (e) => { e.preventDefault(); store('all'); hideBar(); closeModal(); });
  });
  document.querySelectorAll('.moove-gdpr-modal-save-settings').forEach((btn) => {
    btn.addEventListener('click', (e) => { e.preventDefault(); store('custom'); hideBar(); closeModal(); });
  });
  document.querySelectorAll('[data-href="#moove_gdpr_cookie_modal"], .change-settings-button').forEach((btn) => {
    btn.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
  });
  if (modal) {
    modal.querySelectorAll('.moove-gdpr-modal-close').forEach((btn) => btn.addEventListener('click', (e) => {
      e.preventDefault(); closeModal();
    }));
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    // tabs in the dialog
    const navLinks = modal.querySelectorAll('.moove-gdpr-tab-nav');
    navLinks.forEach((link) => link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = link.getAttribute('href');
      modal.querySelectorAll('.moove-gdpr-tab-main').forEach((tab) => {
        tab.style.display = `#${tab.id}` === id ? 'block' : 'none';
      });
      navLinks.forEach((l) => l.parentElement.classList.toggle('menu-item-selected', l === link));
    }));
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
})();
