// After a failed Save / Next / Submit: take the user to the first problem, on any page.
//
// A plain element.focus() only scrolls the minimum amount, so the field ends up hidden behind a sticky
// header (or the page just stays parked at the bottom next to the button). Instead this:
//   1. finds the first field with an error (in page order),
//   2. scrolls its whole block (label + box + message) to just under the sticky header — smoothly, unless
//      the user prefers reduced motion — or, inside a scrolling popup, centres it in the popup,
//   3. focuses it without a second jump.
// Nothing moves when the field is already fully on screen.

export const ERROR_FIELD = [
  '.has-error input:not([type=hidden])',
  '.has-error select',
  '.has-error textarea',
  '.has-error .pi-responsive-select-trigger',
  '[aria-invalid="true"]',
].join(', ');

// Blocks that wrap a field and its label/message. Tab buttons are flagged too but are not the problem itself.
const ERROR_BLOCK = '.has-error:not(.pi-amenity-tab)';
// Sticky / fixed bars at the top of the page that can cover a field.
const TOP_BARS = '.ps-header, .site-header, .lp-topbar';
// Sticky action bars at the bottom of a form (Save / Next).
const BOTTOM_BARS = '.pi-actions, .lp-form-actions';

const isPinned = (el) => {
  const { position } = getComputedStyle(el);
  return position === 'sticky' || position === 'fixed';
};

function topCover() {
  let bottom = 0;
  document.querySelectorAll(TOP_BARS).forEach((bar) => {
    if (!isPinned(bar)) return;
    const r = bar.getBoundingClientRect();
    if (r.top <= 1 && r.bottom > bottom) bottom = r.bottom;
  });
  return bottom;
}

function bottomCover(root) {
  let height = 0;
  root.querySelectorAll?.(BOTTOM_BARS).forEach((bar) => {
    if (!isPinned(bar)) return;
    const r = bar.getBoundingClientRect();
    if (r.bottom >= window.innerHeight - 1) height = Math.max(height, r.height);
  });
  return height;
}

function scrollParent(el) {
  for (let node = el.parentElement; node && node !== document.body && node !== document.documentElement; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight + 1) return node;
  }
  return null;
}

const smooth = () => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

/**
 * @param {ParentNode | null | undefined} root  where to look (a form, a section); defaults to the document
 * @param {object} [options]
 * @param {string} [options.focus]       selector of the control to focus (first match in page order)
 * @param {string} [options.keepInView]  selector of something above the field (e.g. a tab row) to show as
 *                                       well, when the field still fits on screen with it
 */
export function revealFirstError(root, { focus = ERROR_FIELD, keepInView = null } = {}) {
  requestAnimationFrame(() => {
    const scope = root ?? document;
    const target = scope.querySelector(focus);
    let anchor = target?.closest(ERROR_BLOCK)
      ?? target?.closest('label, .form-field, fieldset')
      ?? scope.querySelector(`${ERROR_BLOCK}, .field-error, [role="alert"]`)
      ?? target;
    if (!anchor) return;
    // Nested error blocks (a radio list inside its fieldset): use the outer one so its title shows too.
    while (anchor.parentElement?.closest(ERROR_BLOCK)) anchor = anchor.parentElement.closest(ERROR_BLOCK);

    const popup = scrollParent(anchor);
    if (popup) {
      const p = popup.getBoundingClientRect();
      const a = anchor.getBoundingClientRect();
      if (a.top < p.top + 8 || a.bottom > p.bottom - 8) anchor.scrollIntoView({ block: 'center', behavior: smooth() });
    } else {
      const top = topCover();
      const bottom = window.innerHeight - bottomCover(scope) - 8;
      const box = anchor.getBoundingClientRect();
      if (box.top < top + 8 || box.bottom > bottom) {
        let destination = window.scrollY + box.top - top - 16;
        const extra = keepInView ? scope.querySelector(keepInView) : null;
        if (extra) {
          const extraTop = extra.getBoundingClientRect().top;
          if (extraTop <= box.top && box.bottom - extraTop <= bottom - top - 16) destination = window.scrollY + extraTop - top - 16;
        }
        window.scrollTo({ top: Math.max(0, destination), behavior: smooth() });
      }
    }
    target?.focus({ preventScroll: true });
  });
}
