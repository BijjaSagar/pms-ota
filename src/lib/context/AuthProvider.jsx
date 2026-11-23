// Front-end only auth: registered accounts and the current sessions live in localStorage.
// Replace register/login with API calls once the backend exists; the context shape can stay the same.
//
// Guest (main site) and partner (Partner Hub, /list-property/...) logins are two different things:
//                    accounts                     session
//   main site   ->   triponx.users.v1             triponx.session.v1
//   Partner Hub ->   triponx.partnerUsers.v1      triponx.partnerSession.v1
// Each area only sees its own accounts and its own session: a guest account can't sign in to the
// Partner Hub (and the other way round), and signing in or out of one never touches the other.
// Components keep using useAuth() as before — which area is on screen decides which side they get.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from './auth-context';
import { AuthModal } from '../../components/auth/AuthModal.jsx';

const USERS_KEY = 'triponx.users.v1';
const SESSION_KEY = 'triponx.session.v1';
const PARTNER_USERS_KEY = 'triponx.partnerUsers.v1';
const PARTNER_SESSION_KEY = 'triponx.partnerSession.v1';
export const PARTNER_PATH = '/list-property';

export const isPartnerPath = (pathname = '') => pathname === PARTNER_PATH || pathname.startsWith(PARTNER_PATH + '/');

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

const readList = (key) => {
  const list = readJSON(key, []);
  return Array.isArray(list) ? list : [];
};

// Partner accounts made before the split lived in the shared list. Only the Partner Hub sets a password,
// so those are the ones with a passwordHash: copy them over once so existing partners can still sign in
// (same id, so their drafts and listings stay theirs).
function readPartnerUsers() {
  if (typeof window !== 'undefined') {
    try {
      if (window.localStorage.getItem(PARTNER_USERS_KEY) === null) {
        return readList(USERS_KEY).filter((u) => u && u.passwordHash);
      }
    } catch {
      // storage blocked: fall through to an empty list
    }
  }
  return readList(PARTNER_USERS_KEY);
}

// Email is compared case-insensitively; phone by its digits only.
export function normalizeIdentifier(method, value) {
  const v = String(value ?? '').trim();
  return method === 'phone' ? v.replace(/\D/g, '').slice(-10) : v.toLowerCase();
}

function AuthProvider({ children }) {
  const [guestUsers, setGuestUsers] = useState(() => readList(USERS_KEY));
  const [partnerUsers, setPartnerUsers] = useState(readPartnerUsers);
  const [guestUser, setGuestUser] = useState(() => readJSON(SESSION_KEY, null));
  const [partnerUser, setPartnerUser] = useState(() => readJSON(PARTNER_SESSION_KEY, null));
  const [modal, setModal] = useState({ open: false, mode: 'register', message: '' });

  // Which area is on screen decides which accounts and session the app sees and changes.
  const { pathname } = useLocation();
  const isPartner = isPartnerPath(pathname);
  const users = isPartner ? partnerUsers : guestUsers;
  const setUsers = isPartner ? setPartnerUsers : setGuestUsers;
  const user = isPartner ? partnerUser : guestUser;
  const setUser = isPartner ? setPartnerUser : setGuestUser;

  useEffect(() => { writeJSON(USERS_KEY, guestUsers); }, [guestUsers]);
  useEffect(() => { writeJSON(PARTNER_USERS_KEY, partnerUsers); }, [partnerUsers]);
  useEffect(() => { writeJSON(SESSION_KEY, guestUser); }, [guestUser]);
  useEffect(() => { writeJSON(PARTNER_SESSION_KEY, partnerUser); }, [partnerUser]);

  const findUser = useCallback(
    (method, value) => {
      const id = normalizeIdentifier(method, value);
      return users.find((u) => (method === 'phone' ? u.phone === id : u.email === id)) ?? null;
    },
    [users],
  );

  // Sign up = verified email + mobile number (see AuthFlow). Both are stored normalised.
  // passwordHash is optional: guest sign-up uses OTP only; Partner Hub accounts also set a password.
  const register = useCallback(({ name = '', email, phone, passwordHash }) => {
    const newUser = {
      id: `${isPartner ? 'partner' : 'user'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      email: normalizeIdentifier('email', email),
      phone: normalizeIdentifier('phone', phone),
      ...(passwordHash ? { passwordHash } : {}),
      createdAt: new Date().toISOString(),
    };
    setUsers((current) => [...current, newUser]);
    setUser(newUser);
    return newUser;
  }, [isPartner, setUsers, setUser]);

  // Patch a stored account (e.g. new password hash). Keeps the signed-in copy in sync.
  const updateUser = useCallback((id, patch) => {
    setUsers((current) => current.map((u) => (u.id === id ? { ...u, ...patch } : u)));
    setUser((current) => (current && current.id === id ? { ...current, ...patch } : current));
  }, [setUsers, setUser]);

  const login = useCallback((existing) => { setUser(existing); }, [setUser]);
  const logout = useCallback(() => { setUser(null); }, [setUser]);

  // mode: 'login' (default) opens Sign in, 'register' opens Sign up.
  const openAuth = useCallback((mode = 'login', message = '') => {
    setModal({ open: true, mode, message });
  }, []);
  const closeAuth = useCallback(() => {
    setModal((m) => ({ ...m, open: false }));
  }, []);

  // The sign-in popup never opens on its own — only via openAuth() from a Sign in / Sign up click.

  // Keep open tabs of the same area in sync (sign in/out in one main-site tab shows in the others;
  // same for Partner Hub tabs) without a reload. The two areas stay independent.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === SESSION_KEY) setGuestUser(readJSON(SESSION_KEY, null));
      if (e.key === PARTNER_SESSION_KEY) setPartnerUser(readJSON(PARTNER_SESSION_KEY, null));
      if (e.key === USERS_KEY) setGuestUsers(readList(USERS_KEY));
      if (e.key === PARTNER_USERS_KEY) setPartnerUsers(readList(PARTNER_USERS_KEY));
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
      updateUser,
      login,
      logout,
      openAuth,
      closeAuth,
    }),
    [user, modal.open, findUser, register, updateUser, login, logout, openAuth, closeAuth],
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
