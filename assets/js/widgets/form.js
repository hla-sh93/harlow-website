/*
 * Form (Elementor Pro's form widget, harlow/form): sent without leaving the page, as
 * Elementor's form handler sends it. The browser checks each field first; the answer of
 * the REST route harlow/v1/form shows under the form (elementor-message-success or
 * -danger), a refused field's own message under that field, and a redirect is followed.
 * A form of steps shows one step at a time: Next checks the step's fields before moving
 * on, the indicators and the progress bar follow. The Popup action opens a popup of the
 * Theme Builder or closes the form's own. Without this script the form posts itself and
 * the page shows the answer when the visitor is sent back.
 */
(() => {
  const HIDDEN = 'elementor-hidden';
  const STATE = 'e-form__indicators__indicator--state-';

  const message = (text, kind) => {
    const el = document.createElement('div');
    el.className = `elementor-message elementor-message-${kind}`;
    el.setAttribute('role', 'alert');
    el.textContent = text;
    return el;
  };

  const clearErrors = (scope) => {
    scope.querySelectorAll('.elementor-help-inline').forEach((el) => el.remove());
    scope.querySelectorAll('.elementor-error').forEach((el) => el.classList.remove('elementor-error'));
  };

  const fieldError = (group, text) => {
    group.classList.add('elementor-error');
    const el = document.createElement('span');
    el.className = 'elementor-message elementor-message-danger elementor-help-inline elementor-form-help-inline';
    el.setAttribute('role', 'alert');
    el.textContent = text;
    group.appendChild(el);
  };

  // The fields of a step (or of the form) as the browser checks them, plus what it cannot:
  // a required group of checkboxes, the size and number of the files chosen.
  const valid = (scope, form) => {
    clearErrors(scope);
    const inputs = [...scope.querySelectorAll('input, select, textarea')]
      .filter((el) => !el.disabled && el.type !== 'hidden' && !el.closest('.elementor-field-type-honeypot'));
    for (const el of inputs) {
      if (!el.checkValidity()) {
        el.reportValidity();
        return false;
      }
    }
    let ok = true;
    scope.querySelectorAll('.elementor-field-type-checkbox.elementor-field-required').forEach((group) => {
      if (!group.querySelector('input:checked')) {
        fieldError(group, form.dataset.requiredMessage || '');
        ok = false;
      }
    });
    scope.querySelectorAll('.elementor-upload-field').forEach((input) => {
      const most = parseFloat(input.dataset.maxsize || '0');
      const files = [...(input.files || [])];
      const group = input.closest('.elementor-field-group');
      if (most && files.some((file) => file.size > most * 1024 * 1024)) {
        fieldError(group, input.dataset.maxsizeMessage || '');
        ok = false;
      }
      const count = parseInt(input.dataset.maxfiles || '0', 10);
      if (count && files.length > count) {
        fieldError(group, form.dataset.errorMessage || '');
        ok = false;
      }
    });
    if (!ok) {
      const first = scope.querySelector('.elementor-error input, .elementor-error select, .elementor-error textarea');
      if (first) first.focus();
    }
    return ok;
  };

  const steps = (form) => {
    const list = [...form.querySelectorAll('.e-form__step')];
    if (!list.length) return null;
    const indicators = [...form.querySelectorAll('.e-form__indicators__indicator')]
      .filter((el) => !el.classList.contains('e-form__indicators__indicator__progress'));
    const meter = form.querySelector('.e-form__indicators__indicator__progress__meter');
    let current = Math.max(0, list.findIndex((step) => !step.classList.contains(HIDDEN)));

    const show = (index) => {
      current = Math.max(0, Math.min(list.length - 1, index));
      list.forEach((step, i) => step.classList.toggle(HIDDEN, i !== current));
      indicators.forEach((el, i) => {
        el.classList.toggle(`${STATE}active`, i === current);
        el.classList.toggle(`${STATE}completed`, i < current);
        el.classList.toggle(`${STATE}inactive`, i > current);
      });
      if (meter) {
        const percent = Math.round(((current + 1) / list.length) * 100);
        meter.style.setProperty('--e-form-steps-indicator-progress-meter-width', `${percent}%`);
        meter.textContent = `${percent}%`;
      }
    };

    form.addEventListener('click', (event) => {
      const button = event.target.closest('.e-form__buttons__wrapper__button-next, .e-form__buttons__wrapper__button-previous');
      if (!button || !form.contains(button)) return;
      event.preventDefault();
      if (button.classList.contains('e-form__buttons__wrapper__button-previous')) {
        show(current - 1);
        return;
      }
      if (!valid(list[current], form)) return;
      show(current + 1);
      const first = list[current].querySelector('input:not([type="hidden"]), select, textarea');
      if (first) first.focus({ preventScroll: true });
    });

    show(current);
    return {
      show,
      current: () => list[current],
      stepOf: (el) => list.findIndex((step) => step.contains(el)),
    };
  };

  // Open a popup of the Theme Builder, or close the one the form is in, as a link to
  // #harlow-popup-<id> or #harlow-popup-close does (assets/js/popup.js).
  const popup = (form, ask) => {
    document.dispatchEvent(new CustomEvent('harlow:form-popup', { detail: ask }));
    const id = parseInt(ask.id, 10) || 0;
    const closing = ask.action === 'close';
    if (closing ? !(form.closest('.harlow-popup') || document.querySelector('.harlow-popup--open'))
      : !(id && document.getElementById(`harlow-popup-${id}`))) return;
    const link = document.createElement('a');
    link.href = closing ? '#harlow-popup-close' : `#harlow-popup-${id}`;
    link.hidden = true;
    form.appendChild(link);
    link.click();
    link.remove();
  };

  const done = (form, answer, walker) => {
    form.classList.remove('elementor-form-waiting');
    const button = form.querySelector('[type="submit"]');
    if (button) {
      button.disabled = false;
      button.querySelectorAll('.elementor-form-spinner').forEach((el) => el.remove());
    }
    const data = answer.data || {};
    if (answer.success) {
      form.reset();
      if (walker) walker.show(0);
      form.appendChild(message(answer.message || '', 'success'));
      form.dispatchEvent(new CustomEvent('harlow:form-success', { bubbles: true, detail: answer }));
      if (data.popup) popup(form, data.popup);
      if (data.redirect_url) window.location.href = data.redirect_url;
      return;
    }
    let firstStep = -1;
    Object.entries(answer.errors || {}).forEach(([id, text]) => {
      const group = form.querySelector(`.elementor-field-group-${CSS.escape(id)}`);
      if (!group) return;
      fieldError(group, text);
      if (walker) {
        const at = walker.stepOf(group);
        if (at >= 0 && (firstStep < 0 || at < firstStep)) firstStep = at;
      }
    });
    if (walker && firstStep >= 0) walker.show(firstStep);
    form.appendChild(message(answer.message || form.dataset.errorMessage || '', 'danger'));
    form.dispatchEvent(new CustomEvent('harlow:form-error', { bubbles: true, detail: answer }));
  };

  const send = (form, walker) => {
    const button = form.querySelector('[type="submit"]');
    form.classList.add('elementor-form-waiting');
    if (button) {
      button.disabled = true;
      const holder = button.querySelector('.elementor-button-content-wrapper') || button;
      const spinner = document.createElement('span');
      spinner.className = 'elementor-form-spinner';
      spinner.setAttribute('aria-hidden', 'true');
      holder.appendChild(spinner);
    }
    const body = new FormData(form);
    body.append('harlow_js', '1');
    fetch(form.action, {
      method: 'POST',
      body,
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    })
      .then((response) => response.json().catch(() => ({})))
      .then((answer) => done(form, answer || {}, walker))
      .catch(() => done(form, {}, walker));
  };

  document.querySelectorAll('.elementor-widget-form form.elementor-form[data-harlow-form]').forEach((form) => {
    const walker = steps(form);
    // The script checks the fields itself, step by step, with the browser's own bubbles.
    form.noValidate = true;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (form.classList.contains('elementor-form-waiting')) return;
      form.querySelectorAll(':scope > .elementor-message').forEach((el) => el.remove());
      if (!valid(walker ? walker.current() : form, form)) return;
      send(form, walker);
    });
  });
})();
