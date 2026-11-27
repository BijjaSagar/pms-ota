import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function RulesModalShell({ title, subtitle, children, footer, onClose, wide }) {
  if (typeof document === 'undefined') return null;
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
