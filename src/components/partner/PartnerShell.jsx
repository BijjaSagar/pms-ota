// Layout for signed-in Partner Hub pages: top bar + left sidebar + content.
// Signed-out visitors are sent to the Partner Hub sign-in.
import { useEffect } from 'react';
import { Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { PartnerTopBar } from './PartnerTopBar.jsx';
import { PartnerCredit } from './PartnerCredit.jsx';
import { PARTNER_PATHS } from './paths.js';
import { useAuth } from '../../lib/context/useAuth.js';
import '../../styles/partner.css';

const NAV = [
  // "List New Property" belongs to My Properties, so keep that item highlighted there too.
  { to: PARTNER_PATHS.properties, label: 'My Properties', Icon: Building2, also: [PARTNER_PATHS.newProperty] },
];

export function PartnerShell({ title, children }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const prev = document.title;
    document.title = `${title} · Partner Hub — TriponX`;
    return () => { document.title = prev; };
  }, [title]);

  if (!isAuthenticated) return <Navigate to={PARTNER_PATHS.landing} replace />;

  const signOut = () => { logout(); navigate(PARTNER_PATHS.landing, { replace: true }); };

  return (
    <div className="lp-shell ps-shell">
      <PartnerTopBar user={user} onSignOut={signOut} />
      <div className="ps-body">
        <nav className="ps-side" aria-label="Partner menu">
          {NAV.map(({ to, label, Icon, also }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `ps-side-link ${isActive || also.includes(pathname) ? 'is-active' : ''}`}>
              <Icon size={22} aria-hidden="true" /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <main className="ps-main">
          <div className="ps-content">{children}</div>
          <PartnerCredit className="ps-credit" />
        </main>
      </div>
    </div>
  );
}
