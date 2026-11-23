// Sign-in for both areas, backed by the TriponX API (see lib/api/client.js for the token model).
//
// Guest (main site) and partner (Partner Hub, /list-property/...) are two different accounts and sessions:
//   main site   -> /api/v1/auth/*           traveller accounts, one-time codes only
//   Partner Hub -> /api/v1/partner/auth/*   partner accounts, email + password + code
// Signing in or out of one never touches the other. Components keep using useAuth(): which area is on
// screen decides which session `user`, `isAuthenticated`, `authReady` and `logout` refer to.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from './auth-context';
import { AuthModal } from '../../components/auth/AuthModal.jsx';
import { createSession, publicApi } from '../api/client.js';
import { announceTravellerSignedOut } from './auth-events.js';

export const PARTNER_PATH = '/list-property';
export const isPartnerPath = (pathname = '') => pathname === PARTNER_PATH || pathname.startsWith(PARTNER_PATH + '/');

// Email is compared case-insensitively; phone by its digits only (Indian numbers, without +91).
export function normalizeIdentifier(method, value) {
  const v = String(value ?? '').trim();
  return method === 'phone' ? v.replace(/\D/g, '').slice(-10) : v.toLowerCase();
}

// The rest of the app reads user.name / user.email / user.phone / user.id.
export function travellerFromApi(u) {
  if (!u) return null;
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  return {
    ...u,
    name,
    phone: u.mobile ?? '',
  };
}
const partnerFromApi = (p) => (p ? { ...p, name: p.fullName ?? '', phone: '' } : null);

// Old demo-only data (accounts and password hashes in localStorage) is no longer used: remove it once.
function dropDemoStorage() {
  try {
    ['triponx.users.v1', 'triponx.session.v1', 'triponx.partnerUsers.v1', 'triponx.partnerSession.v1']
      .forEach((k) => window.localStorage.removeItem(k));
    Object.keys(window.localStorage).filter((k) => k.startsWith('triponx.devices.v1.')).forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // storage blocked: nothing to clean
  }
}

// Tell other open tabs about sign-in / sign-out, so they follow without a reload.
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('triponx-auth') : null;
const announce = (area, type) => { try { channel?.postMessage({ area, type }); } catch { /* ignore */ } };

// One session object per area for the whole app (module level: survives StrictMode remounts,
// so a refresh is never sent twice with the same cookie).
const listeners = { traveller: new Set(), partner: new Set() };
const emit = (area, event) => listeners[area].forEach((fn) => fn(event));

export const travellerApi = createSession({
  refreshPath: '/auth/refresh',
  onLost: () => emit('traveller', { type: 'lost' }),
});
export const partnerApi = createSession({
  refreshPath: '/partner/auth/refresh',
  onRefreshed: (data) => emit('partner', { type: 'user', user: partnerFromApi(data?.partner) }),
  onLost: () => emit('partner', { type: 'lost' }),
});

// Restore a sign-in after a page load from the refresh cookie (no cookie -> signed out, quietly).
let travellerRestore = null;
let partnerRestore = null;
const restoreTraveller = () => {
  travellerRestore ??= travellerApi.refresh()
    .then(() => travellerApi.get('/auth/me'))
    .then(travellerFromApi)
    .catch(() => null)
    .finally(() => { setTimeout(() => { travellerRestore = null; }, 0); });
  return travellerRestore;
};
const restorePartner = () => {
  partnerRestore ??= partnerApi.refresh()
    .then((data) => partnerFromApi(data?.partner))
    .catch(() => null)
    .finally(() => { setTimeout(() => { partnerRestore = null; }, 0); });
  return partnerRestore;
};

function AuthProvider({ children }) {
  const [guestUser, setGuestUser] = useState(null);
  const [partnerUser, setPartnerUser] = useState(null);
  const [ready, setReady] = useState({ traveller: false, partner: false });
  const [modal, setModal] = useState({ open: false, mode: 'register', message: '' });

  const { pathname } = useLocation();
  const isPartner = isPartnerPath(pathname);
  const area = isPartner ? 'partner' : 'traveller';

  useEffect(() => { dropDemoStorage(); }, []);

  // Session events from the API client (token refreshed with new details, or the session was lost).
  useEffect(() => {
    const onTraveller = (e) => { if (e.type === 'lost') { setGuestUser(null); announceTravellerSignedOut(); } };
    const onPartner = (e) => {
      if (e.type === 'lost') setPartnerUser(null);
      if (e.type === 'user' && e.user) setPartnerUser(e.user);
    };
    listeners.traveller.add(onTraveller);
    listeners.partner.add(onPartner);
    return () => { listeners.traveller.delete(onTraveller); listeners.partner.delete(onPartner); };
  }, []);

  // Restore the session of the area on screen (each area only when first visited).
  const restoring = useRef({ traveller: false, partner: false });
  const restore = useCallback(async (which) => {
    if (restoring.current[which]) return;
    restoring.current[which] = true;
    const found = await (which === 'partner' ? restorePartner() : restoreTraveller());
    if (which === 'partner') setPartnerUser(found); else setGuestUser(found);
    setReady((r) => ({ ...r, [which]: true }));
    restoring.current[which] = false;
  }, []);
  useEffect(() => { if (!ready[area]) restore(area); }, [area, ready, restore]);

  // Another tab signed in or out.
  useEffect(() => {
    if (!channel) return undefined;
    const onMessage = ({ data }) => {
      if (!data?.area) return;
      if (data.type === 'logout') {
        if (data.area === 'partner') { partnerApi.clear(); setPartnerUser(null); } else { travellerApi.clear(); setGuestUser(null); announceTravellerSignedOut(); }
      }
      if (data.type === 'login') restore(data.area);
    };
    channel.addEventListener('message', onMessage);
    return () => channel.removeEventListener('message', onMessage);
  }, [restore]);

  // ---------- Traveller (main site): one-time codes ----------
  const signedInTraveller = useCallback((result) => {
    travellerApi.set(result);
    const u = travellerFromApi(result.user);
    setGuestUser(u);
    setReady((r) => ({ ...r, traveller: true }));
    announce('traveller', 'login');
    return { user: u, isNewUser: Boolean(result.isNewUser) };
  }, []);

  const traveller = useMemo(() => ({
    /** purpose 'signin' | 'signup'; contact { email } or { mobile } (Indian, 10 digits). */
    requestOtp: (purpose, contact) => publicApi.post('/auth/otp/request', {
      purpose,
      ...(contact.mobile ? { mobileCountryCode: '+91', mobile: contact.mobile } : { email: contact.email }),
    }),
    verifySignin: async (contact, otp) => signedInTraveller(await publicApi.post('/auth/signin/verify', {
      otp,
      ...(contact.mobile ? { mobileCountryCode: '+91', mobile: contact.mobile } : { email: contact.email }),
    })),
    verifySignup: async (email, otp) => signedInTraveller(await publicApi.post('/auth/signup/verify-email', { email, otp })),
    /** Add or change the email / mobile on the signed-in account (two steps, code each time). */
    requestContactOtp: (contact) => travellerApi.post('/me/contact/otp/request',
      contact.mobile ? { mobileCountryCode: '+91', mobile: contact.mobile } : { email: contact.email }),
    verifyContactOtp: async (contact, otp) => {
      const profile = await travellerApi.post('/me/contact/otp/verify', {
        otp,
        ...(contact.mobile ? { mobileCountryCode: '+91', mobile: contact.mobile } : { email: contact.email }),
      });
      setGuestUser((u) => (u ? travellerFromApi({ ...u, email: profile.email, mobile: profile.mobile, mobileCountryCode: profile.mobileCountryCode, emailVerified: profile.emailVerified, mobileVerified: profile.mobileVerified }) : u));
      return profile;
    },
    /** After a profile save: keep the header name etc. in sync. */
    applyProfile: (profile) => setGuestUser((u) => (u ? travellerFromApi({ ...u, ...profile, profileComplete: Boolean(profile.firstName && profile.lastName) }) : u)),
  }), [signedInTraveller]);

  // ---------- Partner Hub: email + password, then a code ----------
  const signedInPartner = useCallback((result) => {
    partnerApi.set(result);
    const p = partnerFromApi(result.partner);
    setPartnerUser(p);
    setReady((r) => ({ ...r, partner: true }));
    announce('partner', 'login');
    return p;
  }, []);

  const partner = useMemo(() => ({
    signup: ({ fullName, email, password, confirmPassword }) => publicApi.post('/partner/auth/signup', { fullName, email, password, confirmPassword }),
    verifySignup: async (email, otp) => signedInPartner(await publicApi.post('/partner/auth/signup/verify', { email, otp })),
    login: (email, password) => publicApi.post('/partner/auth/login', { email, password }), // -> { challengeId, destination, … }
    verifyLogin: async (challengeId, otp) => signedInPartner(await publicApi.post('/partner/auth/login/verify', { challengeId, otp })),
    resendOtp: (purpose, { email, challengeId }) => publicApi.post('/partner/auth/otp/resend', purpose === 'login' ? { purpose, challengeId } : { purpose, email }),
    forgotPassword: (email) => publicApi.post('/partner/auth/password/forgot', { email }),
    verifyResetOtp: (email, otp) => publicApi.post('/partner/auth/password/verify-otp', { email, otp }), // -> { resetToken }
    resetPassword: (resetToken, password, confirmPassword) => publicApi.post('/partner/auth/password/reset', { resetToken, password, confirmPassword }),
  }), [signedInPartner]);

  // ---------- Sign out (the area on screen) ----------
  const logout = useCallback(async () => {
    if (isPartner) {
      setPartnerUser(null);
      partnerApi.clear();
      try { await publicApi.post('/partner/auth/logout'); } catch { /* cookie cleared anyway on next refresh failure */ }
      announce('partner', 'logout');
    } else {
      setGuestUser(null);
      announceTravellerSignedOut(); // trips + booking details leave this browser
      travellerApi.clear(); // drop the in-memory access token at once
      // Always tell the server, even without a token: it ends the session from the refresh cookie
      // and deletes the tpx_rt cookie (DevTools > Application > Cookies).
      try { await publicApi.post('/auth/logout'); } catch { /* offline: the session still ends when it expires */ }
      announce('traveller', 'logout');
    }
  }, [isPartner]);

  // mode: 'login' (default) opens Sign in, 'register' opens Sign up.
  const openAuth = useCallback((mode = 'login', message = '') => {
    setModal({ open: true, mode, message });
  }, []);
  const closeAuth = useCallback(() => {
    setModal((m) => ({ ...m, open: false }));
  }, []);

  const user = isPartner ? partnerUser : guestUser;
  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      authReady: ready[area],
      authOpen: modal.open,
      traveller,
      partner,
      logout,
      openAuth,
      closeAuth,
    }),
    [user, ready, area, modal.open, traveller, partner, logout, openAuth, closeAuth],
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
