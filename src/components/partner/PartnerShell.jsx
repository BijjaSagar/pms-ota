// Layout for signed-in Partner Hub pages: top bar + module row + content.
// Signed-out visitors are sent to the Partner Hub sign-in.
import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { PartnerTopBar } from './PartnerTopBar.jsx';
import { PartnerModuleNav } from './PartnerModuleNav.jsx';
import { PartnerCredit } from './PartnerCredit.jsx';
import { PARTNER_PATHS } from './paths.js';
import { useAuth } from '../../lib/context/useAuth.js';
import { AuthLoading } from '../auth/RequireAuth.jsx';
import '../../styles/partner.css';

export function PartnerShell({ title, children }) {
  const { user, isAuthenticated, authReady, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const prev = document.title;
    document.title = `${title} · Partner Hub — TriponX`;
    return () => { document.title = prev; };
  }, [title]);

  if (!authReady) return <div className="lp-shell"><AuthLoading /></div>;
  if (!isAuthenticated) return <Navigate to={PARTNER_PATHS.landing} replace />;

  const signOut = async () => { await logout(); navigate(PARTNER_PATHS.landing, { replace: true }); };

  return (
    <div className="lp-shell ps-shell">
      <div className="ps-header">
        <PartnerTopBar user={user} onSignOut={signOut} />
        <PartnerModuleNav />
      </div>
      <main className="ps-main">
        <div className="ps-content">{children}</div>
        <PartnerCredit className="ps-credit" />
      </main>
    </div>
  );
}
