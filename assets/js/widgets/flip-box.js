/*
 * Flip box (Elementor Pro's flip box widget): on a touch screen, a tap turns the box to its
 * back and a second tap, or a tap elsewhere, turns it back. The box is marked "still"
 * (harlow-flip-box--still) at the first touch, so the hover a tap leaves behind does not
 * hold it turned; harlow-flip-box--flipped turns it (assets/css/widgets/flip-box.css). A
 * tap on the front never follows the back's link: the first tap shows the back, the next
 * one on its button (or on the whole back, when it is the link) follows it.
 * With a mouse and the keyboard, the stylesheet alone turns the box (hover, focus).
 */
(() => {
  const FLIPPED = 'harlow-flip-box--flipped';
  const STILL = 'harlow-flip-box--still';
  const boxes = [...document.querySelectorAll('.elementor-widget-flip-box .elementor-flip-box')];
  if (!boxes.length) return;

  boxes.forEach((box) => {
    box.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'touch' || event.pointerType === 'pen') box.classList.add(STILL);
    });
    box.addEventListener('click', (event) => {
      if (!box.classList.contains(STILL)) return;
      if (!box.classList.contains(FLIPPED)) {
        event.preventDefault();
        boxes.forEach((other) => other.classList.remove(FLIPPED));
        box.classList.add(FLIPPED);
        return;
      }
      if (!event.target.closest('a')) box.classList.remove(FLIPPED);
    });
  });

  // A tap elsewhere turns the touched boxes back.
  document.addEventListener('click', (event) => {
    boxes.forEach((box) => {
      if (!box.contains(event.target)) box.classList.remove(FLIPPED);
    });
  });
})();
