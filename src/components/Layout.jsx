import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, BadgePercent, Briefcase, Check, Headphones, ChevronDown, CreditCard, Heart, Info, Globe, Hotel, House, Lock, LogIn, LogOut, Menu, UserRound, X } from 'lucide-react';
import { Logo } from './Icons.jsx';
import { useWishlist } from '../lib/context/useWishlist.js';
import { useAuth } from '../lib/context/useAuth.js';

export function Brand() {
  return (
    <Link to="/" className="brand">
      <Logo />
      <span className="brand-word">Tripon<span className="brand-x">X</span></span>
    </Link>
  );
}

// ---------- Navbar (pms-ota navigation, TriponX glass styling) ----------
const NAV_LINKS = [
  { label: 'Home', to: '/', end: true, Icon: House },
  { label: 'Hotels', to: '/hotels', Icon: Hotel },
  { label: 'Offers', to: '/#offers', hash: true, Icon: BadgePercent },
  { label: 'Help & Support', to: '/#help-support', hash: true, Icon: Headphones },
];

// Navbar link with its icon. Section links (/#offers) use Link; page links use NavLink for the active state.
function NavItem({ l }) {
  const content = <>{l.Icon && <l.Icon size={16} aria-hidden="true" />}{l.label}</>;
  return l.hash
    ? <Link to={l.to}>{content}</Link>
    : <NavLink to={l.to} end={l.end}>{content}</NavLink>;
}

const ACCOUNT_LINKS = [
  { label: 'My profile', to: '/profile', Icon: UserRound },
  { label: 'Wishlist', to: '/wishlist', Icon: Heart },
  { label: 'My trips', to: '/trips', Icon: Briefcase },
  { label: 'Make a payment', to: '/make-a-payment', Icon: CreditCard },
];

const CURRENCIES = [['INR', 'Indian Rupee'], ['USD', 'US Dollar'], ['EUR', 'Euro'], ['GBP', 'British Pound'], ['AED', 'UAE Dirham'], ['SGD', 'Singapore Dollar'], ['AUD', 'Australian Dollar'], ['JPY', 'Japanese Yen']];
const LANGUAGES = [['en', 'English'], ['hi', 'Hindi'], ['fr', 'French'], ['de', 'German'], ['es', 'Spanish'], ['it', 'Italian'], ['ja', 'Japanese']];
const COUNTRY_CODES = 'AE AU BR CA CH CN DE ES FR GB GR ID IN IT JP KR LK MV MX MY NL NP NZ PH PT QA SA SG TH TR US VN ZA'.split(' ');
const regionNames = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['en'], { type: 'region' }) : null;
const COUNTRIES = COUNTRY_CODES.map((code) => ({ code, name: regionNames?.of(code) ?? code })).sort((a, b) => a.name.localeCompare(b.name));
const flagOf = (code) => code.toUpperCase().replace(/[A-Z]/g, (c) => String.fromCodePoint(c.charCodeAt(0) + 127397));

function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return scrolled;
}

// Closes a popover on outside click / Escape.
function useDismiss(open, setOpen, ref) {
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open, setOpen, ref]);
}

export function Header({ children, overlay = false }) {
  const scrolled = useScrolled();
  const { pathname } = useLocation();
  const { count: wishlistCount } = useWishlist();
  const { user, openAuth, logout } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.name?.split(' ')[0] || 'Account';
  const handleLogout = () => { setAccountOpen(false); setMenuOpen(false); navigate('/'); logout(); };
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [localeOpen, setLocaleOpen] = useState(false);
  const [locale, setLocale] = useState({ country: 'IN', currency: 'INR', language: 'en' });
  const accountRef = useRef(null);
  useDismiss(accountOpen, setAccountOpen, accountRef);
  useEffect(() => { setMenuOpen(false); setAccountOpen(false); }, [pathname]);

  return (
    <header className={`site-header ${overlay ? 'is-overlay' : ''} ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="container">
        <div className="glass-nav">
          <Brand />
          {children ?? (
            <nav aria-label="Main navigation" className="primary-nav">
              {NAV_LINKS.map((l) => <NavItem key={l.label} l={l} />)}
            </nav>
          )}
          <div className="header-actions">
            <Link to="/wishlist" className="icon-btn glass-chip nav-heart" aria-label={`Wishlist${wishlistCount ? `, ${wishlistCount} saved` : ''}`}>
              <Heart size={18} />
              {wishlistCount > 0 && <span className="nav-count">{wishlistCount}</span>}
            </Link>
            <Link to="/hotels" className="btn btn-dark btn-sm book-stay hide-sm">Book a stay</Link>
            {!user ? (
              <button type="button" className="nav-signin" onClick={() => openAuth('login')}>Sign in</button>
            ) : (
            <div className="account" ref={accountRef}>
              <button type="button" className="btn btn-dark btn-sm account-btn" aria-haspopup="menu" aria-expanded={accountOpen} onClick={() => setAccountOpen((v) => !v)}>
                <UserRound size={16} /><span className="hide-xs">{firstName}</span><ChevronDown size={14} />
              </button>
              {accountOpen && (
                <div className="account-menu glass-pop" role="menu">
                  <div className="account-user">
                    <strong>{user.name || 'My account'}</strong>
                    <span>{user.email || `+91 ${user.phone}`}</span>
                  </div>
                  {ACCOUNT_LINKS.map(({ label, to, Icon }) => (
                    <Link key={label} to={to} role="menuitem" className="account-item"><Icon size={16} />{label}</Link>
                  ))}
                  <button type="button" role="menuitem" className="account-item account-locale" onClick={() => { setAccountOpen(false); setLocaleOpen(true); }}>
                    <Globe size={16} />Region &amp; currency<span className="account-locale-val">{locale.currency} · {locale.language.toUpperCase()}</span>
                  </button>
                  <button type="button" role="menuitem" className="account-item account-logout" onClick={handleLogout}>
                    <LogOut size={16} />Log out
                  </button>
                </div>
              )}
            </div>
            )}
            <button type="button" className="btn glass-chip btn-sm locale-chip hide-md" onClick={() => setLocaleOpen(true)} aria-label="Currency and language settings">
              {locale.country} {locale.currency}
            </button>
            <button type="button" className="icon-btn glass-chip menu-btn" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="mobile-menu glass-pop">
            <nav aria-label="Mobile navigation">
              {NAV_LINKS.map(({ label, to, Icon }) => <Link key={label} to={to} className="mobile-menu-link"><Icon size={16} />{label}</Link>)}
            </nav>
            <nav aria-label="Account navigation" className="mobile-menu-account">
              {ACCOUNT_LINKS.map(({ label, to, Icon }) => <Link key={label} to={to} className="mobile-menu-link"><Icon size={16} />{label}</Link>)}
            </nav>
            <Link to="/hotels" className="btn btn-dark btn-sm">Book a stay</Link>
            <button type="button" className="btn glass-chip btn-sm" onClick={() => { setMenuOpen(false); setLocaleOpen(true); }}>
              {flagOf(locale.country)} {locale.currency} · {locale.language.toUpperCase()}
            </button>
            {user ? (
              <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}><LogOut size={16} />Log out</button>
            ) : (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => { setMenuOpen(false); openAuth('login'); }}><LogIn size={16} />Sign in</button>
            )}
          </div>
        )}
      </div>

      {localeOpen && (
        <LocaleModal value={locale} onClose={() => setLocaleOpen(false)} onApply={(v) => { setLocale(v); setLocaleOpen(false); }} />
      )}
    </header>
  );
}

function LocaleModal({ value, onClose, onApply }) {
  const [draft, setDraft] = useState(value);
  const set = (k) => (e) => setDraft({ ...draft, [k]: e.target.value });
  return (
    <Modal title="Region & currency" onClose={onClose}>
      <div className="col-gap-14">
        <SelectField label="Country" value={draft.country} onChange={set('country')}
          options={COUNTRIES.map((c) => [c.code, `${flagOf(c.code)} ${c.name}`])} />
        <SelectField label="Currency" value={draft.currency} onChange={set('currency')} options={CURRENCIES} />
        <SelectField label="Language" value={draft.language} onChange={set('language')} options={LANGUAGES} />
      </div>
      <button type="button" className="btn btn-primary btn-block mt-14" onClick={() => onApply(draft)}>Apply</button>
    </Modal>
  );
}

// ---------- Shared UI primitives ----------
export function Modal({ title, onClose, children, wide = false }) {
  const boxRef = useRef(null);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    boxRef.current?.focus();
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className={`modal glass-pop ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}
        tabIndex={-1} ref={boxRef} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="h3">{title}</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SelectField({ label, value, onChange, options, error }) {
  return (
    <label className={`form-field ${error ? 'has-error' : ''}`}>
      {label}
      <span className="select-wrap">
        <select value={value} onChange={onChange}>
          {options.map(([v, name]) => <option key={v} value={v}>{name}</option>)}
        </select>
        <ChevronDown size={16} className="select-caret" aria-hidden="true" />
      </span>
      {error && <span className="field-error" role="alert">{error}</span>}
    </label>
  );
}

export function TextField({ label, error, full, hint, as = 'input', ...props }) {
  const Tag = as;
  return (
    <label className={`form-field ${full ? 'span-all' : ''} ${error ? 'has-error' : ''}`}>
      {label}
      <Tag {...props} />
      {hint && !error && <span className="muted-xs">{hint}</span>}
      {error && <span className="field-error" role="alert">{error}</span>}
    </label>
  );
}

export function Stepper({ steps, current }) {
  return (
    <ol className="stepper-nav page-stepper" aria-label="Progress">
      {steps.map((label, i) => (
        <Fragment key={label}>
          {i > 0 && <li aria-hidden="true" className={`step-line ${i <= current ? 'on' : ''}`} />}
          <li className={i < current ? 'done' : i === current ? 'current' : ''} aria-current={i === current ? 'step' : undefined}>
            <span>{i < current ? '✓' : i + 1}</span>{label}
          </li>
        </Fragment>
      ))}
    </ol>
  );
}

export function EmptyState({ icon: Icon = Info, title, text, action }) {
  return (
    <div className="card empty-state">
      <span className="empty-icon"><Icon size={22} /></span>
      <p className="h-card">{title}</p>
      {text && <p className="muted-sm mb-16">{text}</p>}
      {action}
    </div>
  );
}

// ---------- Footer (pms-ota content, TriponX styling) ----------
const FOOTER_COLUMNS = [
  { title: 'Explore', links: [['Udaipur', '/hotels?destination=Udaipur'], ['Goa', '/hotels?destination=Goa'], ['Jaipur', '/hotels?destination=Jaipur'], ['Kerala', '/hotels?destination=Kerala'], ['Rishikesh', '/hotels?destination=Rishikesh']] },
  { title: 'Company', links: [['Our story', '/#why-triponx'], ['Journal', '/#destinations'], ['Careers', '/#why-triponx'], ['Press', '/#concierge']] },
  { title: 'Support', links: [['Contact concierge', '/#concierge'], ['Booking help', '/#help-support'], ['Cancellation policy', '/#help-support'], ['Accessibility', '/#help-support']] },
];

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const subscribe = (e) => {
    e.preventDefault();
    if (/^\S+@\S+\.\S{2,}$/.test(email.trim())) { setSubscribed(true); setEmail(''); }
  };
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand-col">
          <Brand />
          <p className="muted footer-blurb">Curated hotels, villas and stays, booked the calm way.</p>
          <p className="footer-h">Newsletter</p>
          <p className="muted-sm">New openings and quiet escapes, once a month.</p>
          {subscribed ? (
            <p className="footer-thanks"><Check size={16} />You're subscribed. See you next month.</p>
          ) : (
            <form className="footer-news" onSubmit={subscribe}>
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <input id="newsletter-email" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <button type="submit" className="btn btn-primary btn-sm" aria-label="Subscribe to newsletter"><ArrowRight size={16} /></button>
            </form>
          )}
        </div>
        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title} className="footer-col">
            <p className="footer-h">{col.title}</p>
            {col.links.map(([label, to]) => <Link key={label} to={to}>{label}</Link>)}
          </div>
        ))}
        <div className="footer-bottom span-all">
          <p className="muted-xs">© {new Date().getFullYear()} TriponX. All rights reserved.</p>
          <p className="muted-xs footer-credit">Designed and Developed by <strong>Triounity Technologies</strong></p>
          <p className="muted-xs footer-secure"><Lock size={12} />Secure payments · GST invoices · 24/7 concierge</p>
        </div>
      </div>
    </footer>
  );
}

// Real image when `src` is given (lazy-loaded); tinted placeholder with a label otherwise.
export function Photo({ src, label, tone = 'sage', className = '', eager = false, children }) {
  return (
    <div className={`photo tone-${tone} ${src ? 'has-img' : ''} ${className}`} role="img" aria-label={label}>
      {src && <img className="photo-img" src={src} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" />}
      {children}
      {!src && <span className="photo-label">Photo · {label}</span>}
    </div>
  );
}

export function Chip({ active, onClick, children }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={`chip ${active ? 'is-active' : ''}`}>
      {children}
    </button>
  );
}
