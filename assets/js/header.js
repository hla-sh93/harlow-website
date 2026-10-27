/*
 * Header: past 200px of scroll the bar turns brand blue and the logo shrinks.
 * Same rule as the site's own custom script, which set both on every scroll event.
 */
(() => {
  const header = document.getElementById('nav-header');
  if (!header) return;
  const logo = header.querySelector('.logo');

  window.addEventListener('scroll', () => {
    const past = window.scrollY >= 200;
    header.style.backgroundColor = past ? '#0165A1' : '#0165A100';
    if (logo) logo.style.width = past ? '125px' : '165px';
  }, { passive: true });
})();
