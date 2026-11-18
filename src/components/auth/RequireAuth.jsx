// Guards pages that need an account. Signed-out visitors see a short locked card and the
// register/login modal opens straight away; once they verify, the page they asked for renders.
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { useAuth } from '../../lib/context/useAuth.js';
import '../../styles/auth.css';

export function RequireAuth({ children }) {
  const { isAuthenticated, openAuth } = useAuth();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!isAuthenticated) openAuth('register', 'Please sign in or sign up to continue.');
  }, [isAuthenticated, pathname, openAuth]);

  if (isAuthenticated) return children;

  return (
    <div className="container auth-gate">
      <div className="card auth-gate-card">
        <span className="empty-icon"><LockKeyhole size={22} /></span>
        <h1 className="h-card">Sign in to see this page</h1>
        <p className="muted-sm">Continue with your email or mobile number and a one-time code. It takes less than a minute.</p>
        <div className="auth-gate-actions">
          <button type="button" className="btn btn-dark" onClick={() => openAuth()}>Sign in or sign up</button>
        </div>
        <Link to="/" className="auth-link">Back to home</Link>
      </div>
    </div>
  );
}
