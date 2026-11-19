// Guards pages that need an account. Signed-out visitors see the page blurred with a small
// "sign in to continue" card on top. The sign-in popup opens ONLY when they click a button —
// never automatically.
import { LockKeyhole, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/context/useAuth.js';
import '../../styles/auth.css';

export function RequireAuth({ children }) {
  const { isAuthenticated, openAuth } = useAuth();

  if (isAuthenticated) return children;

  return (
    <div className="auth-gate-wrap">
      {/* The real page, blurred and non-interactive, so visitors see what they'll get */}
      <div className="auth-locked" aria-hidden="true" inert="">
        {children}
      </div>
      <div className="auth-gate card" role="region" aria-labelledby="auth-gate-title">
        <span className="auth-gate-icon"><LockKeyhole size={22} aria-hidden="true" /></span>
        <h1 id="auth-gate-title" className="h3">Sign in to continue</h1>
        <p className="muted-sm">Sign in with a one-time code to see this page. New here? You can sign up from the same window.</p>
        <div className="auth-gate-actions">
          <button type="button" className="btn btn-dark" onClick={() => openAuth('login')}>
            <LogIn size={16} aria-hidden="true" />Sign in
          </button>
          <Link to="/" className="btn btn-light">Back to home</Link>
        </div>
      </div>
    </div>
  );
}
