import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, ChevronDown, X } from 'lucide-react';

// The dropdown of the "Add a property" wizard, shared with Property Information
// so both look and behave the same: a menu under (or above) the field on wide
// screens, a bottom sheet on phones. onChange gets { target: { value } }.

// Phones show the options as a bottom sheet; wider screens as a dropdown under (or above) the field.
const SHEET_QUERY = '(max-width: 720px)';
const MENU_MAX_HEIGHT = 280;
const STICKY_BAR_SPACE = 96; // sticky Save / Back bar at the bottom of the form

export function ResponsiveSelectField({ label, value, onChange, options, error, required = false, labelClassName = 'pi-label', className = '' }) {
  const [open, setOpen] = useState(false);
  // { sheet: bottom sheet (phones), up: open above the field, maxHeight: px that fit on screen }
  const [placement, setPlacement] = useState({ sheet: false, up: false, maxHeight: MENU_MAX_HEIGHT });
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const selected = options.find(([optionValue]) => optionValue === value);
  const selectedLabel = selected?.[1] ?? 'Select';

  const close = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  const toggle = () => {
    if (open) { close(); return; }
    const sheet = window.matchMedia(SHEET_QUERY).matches;
    let up = false;
    let maxHeight = MENU_MAX_HEIGHT;
    if (!sheet && triggerRef.current) {
      // Open where there is room: below unless the space under the field (minus the sticky bar) is too small.
      const rect = triggerRef.current.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom - STICKY_BAR_SPACE;
      const headerBottom = document.querySelector('.ps-header')?.getBoundingClientRect().bottom ?? 0; // sticky top bar + module row
      const above = rect.top - headerBottom - 12;
      const wanted = Math.min(MENU_MAX_HEIGHT, options.length * 45);
      up = below < wanted && above > below;
      maxHeight = Math.max(140, Math.min(MENU_MAX_HEIGHT, up ? above : below));
    }
    setPlacement({ sheet, up, maxHeight });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); }
    };
    // Field scrolled / resized away from where the dropdown was placed -> close it rather than leave it floating.
    const closeOnResize = () => setOpen(false);
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', closeOnResize);
    // Bottom sheet: keep the page behind it from scrolling.
    const prevOverflow = document.body.style.overflow;
    if (placement.sheet) document.body.style.overflow = 'hidden';
    // Bring the selected option into view.
    menuRef.current?.querySelector('.is-selected')?.scrollIntoView({ block: 'nearest' });
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', closeOnResize);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, placement.sheet]);

  const choose = (nextValue) => {
    onChange({ target: { value: nextValue } });
    close(true);
  };

  const menu = open && (
    <>
      <button type="button" className="pi-responsive-select-backdrop" aria-label="Close dropdown" onClick={() => close(true)} />
      <div
        ref={menuRef}
        className={`pi-responsive-select-menu ${placement.up ? 'is-up' : ''}`}
        role="listbox"
        aria-label={label}
        style={placement.sheet ? undefined : { '--pi-menu-max': `${placement.maxHeight}px` }}
      >
        <div className="pi-responsive-select-mobile-head">
          <span className="pi-sheet-handle" aria-hidden="true" />
          <strong>{label}</strong>
          <button type="button" className="pi-sheet-close" onClick={() => close(true)} aria-label="Close dropdown"><X size={18} aria-hidden="true" /></button>
        </div>
        <div className="pi-responsive-select-options">
          {/* The '' placeholder ("Select …") already shows on the field itself, so it isn't offered as a choice */}
          {options.filter(([optionValue]) => optionValue !== '').map(([optionValue, optionLabel]) => (
            <button
              type="button"
              key={optionValue}
              role="option"
              aria-selected={optionValue === value}
              className={optionValue === value ? 'is-selected' : ''}
              onClick={() => choose(optionValue)}
            >
              <span>{optionLabel}</span>
              {optionValue === value && <CheckCircle2 size={16} aria-hidden="true" />}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div ref={rootRef} className={`pi-responsive-select form-field ${className} ${error ? 'has-error' : ''}`}>
      <span className={labelClassName}>{label}{required ? <em aria-hidden="true"> *</em> : null}</span>
      <div className="pi-responsive-select-anchor">
        <button
          ref={triggerRef}
          type="button"
          className="pi-responsive-select-trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-invalid={Boolean(error)}
          onClick={toggle}
        >
          <span>{selectedLabel}</span>
          <ChevronDown size={16} aria-hidden="true" />
        </button>
        {/* Bottom sheet goes to <body>: no ancestor (transform, filter, containment) can trap position: fixed */}
        {open && (placement.sheet ? createPortal(menu, document.body) : menu)}
      </div>
      {error && <span className="field-error" role="alert">{error}</span>}
    </div>
  );
}
