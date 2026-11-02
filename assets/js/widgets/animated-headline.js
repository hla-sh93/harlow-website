/*
 * Animated headline (Elementor Pro's animated headline widget, harlow/animated-headline),
 * from the element's data-settings as Elementor keeps them.
 *
 * Highlighted: when the headline comes into view its shape (printed by the server) is
 * drawn in highlight_animation_duration ms; with the loop on it fades away after
 * highlight_iteration_delay ms and is drawn again.
 *
 * Rotating: every rotate_iteration_delay ms the shown word gives way to the next one, as
 * the animation type does it: typing (the word is selected, then the next is typed letter
 * by letter), clip (the box closes to its cursor and opens on the next word), swirl, blinds
 * and wave (letter by letter), flip, drop-in, slide and slide down (the stylesheet's
 * keyframes on the words). Without the loop it stops on the last word. The box keeps the
 * width of the widest word, so the line does not move, except for typing and clip.
 */
(() => {
  const LETTERS = ['typing', 'swirl', 'blinds', 'wave'];
  const TYPE_DELAY = 150;
  const LETTER_DELAY = 50;
  const SELECTION = 500;
  const CLIP = 600;

  const settingsOf = (root) => {
    try {
      return JSON.parse((root && root.dataset.settings) || '{}') || {};
    } catch (e) {
      return {};
    }
  };

  const whenSeen = (el, run) => {
    if (!('IntersectionObserver' in window)) {
      run();
      return;
    }
    const seen = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        seen.disconnect();
        run();
      }
    });
    seen.observe(el);
  };

  const lettersOf = (word) => [...word.querySelectorAll('.elementor-headline-dynamic-letter')];

  const split = (word) => {
    const text = word.textContent;
    word.textContent = '';
    [...text].forEach((ch) => {
      const letter = document.createElement('span');
      letter.className = 'elementor-headline-dynamic-letter';
      letter.textContent = ch === ' ' ? ' ' : ch;
      word.appendChild(letter);
    });
    if (word.classList.contains('elementor-headline-text-active')) {
      lettersOf(word).forEach((l) => l.classList.add('elementor-headline-animation-in'));
    }
  };

  const letterIn = (l) => {
    l.classList.remove('elementor-headline-animation-out');
    l.classList.add('elementor-headline-animation-in');
  };
  const letterOut = (l) => {
    l.classList.remove('elementor-headline-animation-in');
    l.classList.add('elementor-headline-animation-out');
  };

  // Each letter in turn, then done.
  const oneByOne = (letters, each, delay, done) => {
    letters.forEach((l, i) => setTimeout(() => each(l), i * delay));
    setTimeout(done, letters.length * delay);
  };

  const highlight = (headline, wrapper, s) => {
    const duration = Number(s.highlight_animation_duration) || 1200;
    const delay = Number(s.highlight_iteration_delay) || 8000;
    wrapper.style.setProperty('--animation-duration', `${duration}ms`);
    const draw = () => {
      wrapper.classList.add('e-animated');
      if (s.loop !== 'yes') return;
      setTimeout(() => {
        wrapper.classList.add('e-hide-highlight');
        setTimeout(() => {
          wrapper.classList.remove('e-animated', 'e-hide-highlight');
          wrapper.getBoundingClientRect();
          draw();
        }, 600);
      }, duration + delay);
    };
    whenSeen(headline, draw);
  };

  const rotate = (headline, wrapper, s) => {
    const type = s.animation_type || 'typing';
    const words = [...wrapper.querySelectorAll('.elementor-headline-dynamic-text')];
    if (words.length < 2) return;
    const delay = Number(s.rotate_iteration_delay) || 2500;
    const letters = LETTERS.includes(type);
    if (letters) words.forEach(split);

    // The box as wide as the widest word, so the headline does not move.
    const fit = () => {
      if (type === 'typing') return;
      if (type === 'clip') {
        const active = words.find((w) => w.classList.contains('elementor-headline-text-active'));
        wrapper.style.width = `${active.getBoundingClientRect().width + 4}px`;
        return;
      }
      wrapper.style.width = '';
      wrapper.style.width = `${Math.max(...words.map((w) => w.getBoundingClientRect().width))}px`;
    };
    fit();
    addEventListener('resize', fit);
    if (document.fonts) document.fonts.ready.then(fit);

    const swap = (from, to) => {
      from.classList.remove('elementor-headline-text-active');
      from.classList.add('elementor-headline-text-inactive');
      to.classList.remove('elementor-headline-text-inactive');
      to.classList.add('elementor-headline-text-active');
    };

    let index = 0;
    const step = () => {
      const current = words[index];
      const nextIndex = (index + 1) % words.length;
      const next = words[nextIndex];
      const after = () => {
        index = nextIndex;
        if (s.loop !== 'yes' && index === words.length - 1) return;
        setTimeout(step, delay);
      };

      if (type === 'typing') {
        wrapper.classList.add('elementor-headline-typing-selected');
        setTimeout(() => {
          wrapper.classList.remove('elementor-headline-typing-selected');
          lettersOf(current).forEach(letterOut);
          lettersOf(next).forEach((l) => l.classList.remove('elementor-headline-animation-in', 'elementor-headline-animation-out'));
          swap(current, next);
          oneByOne(lettersOf(next), letterIn, TYPE_DELAY, after);
        }, SELECTION);
      } else if (type === 'clip') {
        wrapper.style.transition = `width ${CLIP}ms`;
        wrapper.style.width = '2px';
        setTimeout(() => {
          swap(current, next);
          wrapper.style.width = `${next.getBoundingClientRect().width + 4}px`;
          setTimeout(after, CLIP);
        }, CLIP);
      } else if (letters) {
        swap(current, next);
        oneByOne(lettersOf(current), letterOut, LETTER_DELAY, () => {});
        oneByOne(lettersOf(next), letterIn, LETTER_DELAY, after);
      } else {
        swap(current, next);
        after();
      }
    };

    whenSeen(headline, () => setTimeout(step, delay));
  };

  document.querySelectorAll('.elementor-headline').forEach((headline) => {
    const wrapper = headline.querySelector('.elementor-headline-dynamic-wrapper');
    if (!wrapper) return;
    const s = settingsOf(headline.closest('[data-widget_type]'));
    if (s.headline_style === 'rotate') rotate(headline, wrapper, s);
    else highlight(headline, wrapper, s);
  });
})();
