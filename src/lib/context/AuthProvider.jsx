// Front-end only auth: registered users and the current session live in localStorage.
// Replace register/login with API calls once the backend exists; the context shape can stay the same.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './auth-context';
import { AuthModal } from '../../components/auth/AuthModal.jsx';

const USERS_KEY = 'triponx.users.v1';
const SESSION_KEY = 'triponx.session.v1';

function readJSON(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage blocked (private mode etc.) — session simply won't persist
  }
}

// Email is compared case-insensitively; phone by its digits only.
export function normalizeIdentifier(method, value) {
  const v = String(value ?? '').trim();
  return method === 'phone' ? v.replace(/\D/g, '').slice(-10) : v.toLowerCase();
}

function AuthProvider({ children }) {
  const [users, setUsers] = useState(() => {
    const list = readJSON(USERS_KEY, []);
    return Array.isArray(list) ? list : [];
  });
  const [user, setUser] = useState(() => readJSON(SESSION_KEY, null));
  const [modal, setModal] = useState({ open: false, mode: 'register', message: '' });

  useEffect(() => { writeJSON(USERS_KEY, users); }, [users]);
  useEffect(() => { writeJSON(SESSION_KEY, user); }, [user]);

  const findUser = useCallback(
    (method, value) => {
      const id = normalizeIdentifier(method, value);
      return users.find((u) => (method === 'phone' ? u.phone === id : u.email === id)) ?? null;
    },
    [users],
  );

  // Sign up = verified email + mobile number (see AuthFlow). Both are stored normalised.
  const register = useCallback(({ name = '', email, phone }) => {
    const newUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      email: normalizeIdentifier('email', email),
      phone: normalizeIdentifier('phone', phone),
      createdAt: new Date().toISOString(),
    };
    setUsers((current) => [...current, newUser]);
    setUser(newUser);
    return newUser;
  }, []);

  const login = useCallback((existing) => { setUser(existing); }, []);
  const logout = useCallback(() => { setUser(null); }, []);

  // mode: 'login' (default) opens Sign in, 'register' opens Sign up.
  const openAuth = useCallback((mode = 'login', message = '') => {
    setModal({ open: true, mode, message });
  }, []);
  const closeAuth = useCallback(() => {
    setModal((m) => ({ ...m, open: false }));
  }, []);

  // The sign-in popup never opens on its own — only via openAuth() from a Sign in / Sign up click.

  // Keep tabs in sync: signing in or out in one tab shows up in the others without a reload.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === SESSION_KEY) setUser(readJSON(SESSION_KEY, null));
      if (e.key === USERS_KEY) setUsers(readJSON(USERS_KEY, []));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      authOpen: modal.open,
      findUser,
      register,
      login,
      logout,
      openAuth,
      closeAuth,
    }),
    [user, modal.open, findUser, register, login, logout, openAuth, closeAuth],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {modal.open && (
        <AuthModal message={modal.message} initialMode={modal.mode === 'register' ? 'signup' : 'signin'} onClose={closeAuth} />
      )}
    </AuthContext.Provider>
  );
}

export { AuthProvider };
