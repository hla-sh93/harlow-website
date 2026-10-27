/*
 * Harlow's People popups and the management team tabs, from the site's own custom script:
 * a person card opens its popup (fade 400ms, shown as flex) and locks the page scroll; a
 * click outside the inner box or on the close link fades it out again.
 */
(() => {
  const FADE = 400;
  const body = document.body;

  const fadeIn = (el) => {
    el.style.opacity = '0';
    el.style.display = 'flex';
    el.getBoundingClientRect();
    el.style.transition = `opacity ${FADE}ms`;
    el.style.opacity = '1';
  };
  const fadeOut = (el) => {
    if (getComputedStyle(el).display === 'none') return;
    el.style.transition = `opacity ${FADE}ms`;
    el.style.opacity = '0';
    setTimeout(() => { el.style.display = 'none'; }, FADE);
  };
  const unlock = () => {
    body.style.overflow = 'auto';
    body.style.overflowY = 'auto';
    body.style.paddingRight = '0';
  };

  document.querySelectorAll('.hp-inner-popup-holder').forEach((el) => {
    el.addEventListener('click', (e) => e.stopPropagation());
  });
  document.querySelectorAll('.harlow-emp').forEach((card) => {
    card.addEventListener('click', () => {
      body.style.overflowY = 'hidden';
      body.style.paddingRight = '20px';
      const popup = card.querySelector('.hp-popup-holder');
      if (popup) fadeIn(popup);
    });
  });
  document.querySelectorAll('.hp-popup-holder').forEach((popup) => {
    popup.addEventListener('click', (e) => {
      e.stopPropagation();
      fadeOut(popup);
      unlock();
    });
  });
  document.querySelectorAll('.hp-close').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.querySelectorAll('.hp-popup-holder').forEach(fadeOut);
      unlock();
    });
  });

  // Management team tabs
  const tabs = [['supportive-management', 'core-management'], ['core-management', 'supportive-management']];
  tabs.forEach(([show, hide]) => {
    const btn = document.getElementById(`${show}-btn`);
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById(show)?.classList.remove('d-none');
      document.getElementById(hide)?.classList.add('d-none');
      btn.classList.add('active');
      document.getElementById(`${hide}-btn`)?.classList.remove('active');
    });
  });
})();
