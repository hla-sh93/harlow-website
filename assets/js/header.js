/*
 * Header: past 200px of scroll the bar turns brand blue and the logo shrinks.
 * Same rule as the site's own custom script, which set both on every scroll event.
 * The blue is the brand colour (design/brand.css), so the Customizer's choice reaches it.
 */
(() => {
  const header = document.getElementById('nav-header');
  if (!header) return;
  const logo = header.querySelector('.logo');
  const brand = getComputedStyle(document.documentElement).getPropertyValue('--hl-color-primary').trim() || '#0165A1';

  window.addEventListener('scroll', () => {
    const past = window.scrollY >= 200;
    header.style.backgroundColor = past ? brand : '#0165A100';
    if (logo) logo.style.width = past ? '125px' : '165px';
  }, { passive: true });
})();
