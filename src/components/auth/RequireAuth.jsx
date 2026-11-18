// Guards pages that need an account. Signed-out visitors see the page blurred with the
// sign-in modal on top; once they verify, the page becomes usable. Closing the modal
// without signing in sends them back to Home.
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/context/useAuth.js';
import '../../styles/auth.css';

export function RequireAuth({ children }) {
  const { isAuthenticated, authOpen, openAuth } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [prompted, setPrompted] = useState(false);

  useEffect(() => {
    if (isAuthenticated) return;
    openAuth('register', 'Please sign in or sign up to continue.');
    setPrompted(true);
  }, [isAuthenticated, pathname, openAuth]);

  useEffect(() => {
    if (!isAuthenticated && prompted && !authOpen) navigate('/', { replace: true });
  }, [isAuthenticated, prompted, authOpen, navigate]);

  if (isAuthenticated) return children;
  // Show the real page blurred and non-interactive behind the sign-in popup.
  return (
    <div className="auth-locked" aria-hidden="true" inert="">
      {children}
    </div>
  );
}
