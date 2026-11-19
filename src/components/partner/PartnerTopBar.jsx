// Partner Hub top bar, shared by the landing page and the signed-in pages.
// Signed out: Visit TriponX.
// Signed in: avatar "Hi, Name ▾" menu (email, Visit TriponX, Sign out).
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ChevronDown, LogOut } from 'lucide-react';
import { Brand } from '../Layout.jsx';
import '../../styles/partner.css';

export const PARTNER_SUPPORT_EMAIL = 'partners@triponx.travel';

function initials(user) {
  const parts = (user.name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length) return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  return (user.email || 'P')[0].toUpperCase();
}

function AccountMenu({ user, onSignOut }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const firstName = (user.name || '').trim().split(/\s+/)[0];

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div className="pt-account" ref={ref}>
      <button type="button" className="pt-account-btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="pt-avatar" aria-hidden="true">{initials(user)}</span>
        <span className="pt-hi">Hi, {firstName || 'Partner'}</span>
        <ChevronDown size={16} aria-hidden="true" className={open ? 'is-open' : ''} />
      </button>
      {open && (
        <div className="pt-menu glass-pop" role="menu">
          <div className="pt-menu-who">
            <strong>{user.name || 'Partner account'}</strong>
            <span>{user.email || (user.phone ? `+91 ${user.phone}` : '')}</span>
          </div>
          <Link to="/" role="menuitem" className="pt-menu-item" onClick={() => setOpen(false)}>
            <ArrowUpRight size={16} aria-hidden="true" />Visit TriponX
          </Link>
          <button type="button" role="menuitem" className="pt-menu-item" onClick={() => { setOpen(false); onSignOut(); }}>
            <LogOut size={16} aria-hidden="true" />Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function PartnerTopBar({ user, onSignOut }) {
  return (
    <header className="lp-topbar">
      <div className="lp-topbar-inner">
        <div className="lp-topbar-brand">
          <Brand />
          <span className="lp-hub-tag">Partner Hub</span>
        </div>
        <nav className="lp-topbar-actions" aria-label="Partner Hub">
          {user ? <AccountMenu user={user} onSignOut={onSignOut} /> : (
            <Link to="/" className="btn btn-light btn-sm">Visit TriponX<ArrowUpRight size={15} aria-hidden="true" /></Link>
          )}
        </nav>
      </div>
    </header>
  );
}
