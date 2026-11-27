import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function RulesModalShell({ title, subtitle, children, footer, onClose, wide }) {
  // Esc closes; the page behind does not scroll while it is open.
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; };
  }, [onClose]);

  return createPortal(
    <div className="rpw-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`rpw-modal ${wide ? 'is-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="rpw-modal-head">
          <div>
            <h3>{title}</h3>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button type="button" className="rpw-icon-btn" onClick={onClose} aria-label="Close dialog"><X size={17} aria-hidden="true" /></button>
        </header>
        <div className="rpw-modal-body">{children}</div>
        {footer ? <footer className="rpw-modal-foot">{footer}</footer> : null}
      </section>
    </div>,
    document.body,
  );
}
