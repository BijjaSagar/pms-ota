// Profile — sections from pms-ota (ProfilePage.tsx), TriponX layout (identity card + pill tabs).
// Data comes from the TriponX API: /me/profile, /me/profile/photo, /me/co-travellers, /auth/sessions.
import { useCallback, useEffect, useRef, useState } from 'react';
import { LogOut, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CoTravellersSection } from '../components/profile/CoTravellersSection.jsx';
import { LoggedInDevicesSection } from '../components/profile/LoggedInDevicesSection.jsx';
import { MyProfileSection } from '../components/profile/MyProfileSection.jsx';
import { ProfileNav } from '../components/profile/ProfileNav.jsx';
import { ResetPasswordSection } from '../components/profile/ResetPasswordSection.jsx';
import { PortalModal as Modal } from '../components/profile/PortalModal.jsx';
import { AuthLoading } from '../components/auth/RequireAuth.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import {
  createCoTraveller, deleteCoTraveller, getProfile, listCoTravellers, listDevices, loadPhoto,
  logoutDevice as revokeDevice, logoutOtherDevices, updateCoTraveller, updateProfile, uploadPhoto,
} from '../lib/api/profile.js';
import { useAuth } from '../lib/context/useAuth.js';
import '../styles/account.css';

function initials(profile) {
  const first = profile.firstName || profile.email || 'T';
  return `${first.charAt(0)}${(profile.lastName || first.slice(1)).charAt(0)}`.toUpperCase() || 'TX';
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, traveller } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [photoSrc, setPhotoSrc] = useState('');
  const [travellers, setTravellers] = useState(null); // null = not loaded yet
  const [travellersError, setTravellersError] = useState('');
  const [devices, setDevices] = useState(null);
  const [devicesError, setDevicesError] = useState('');
  const [logoutOpen, setLogoutOpen] = useState(false);
  const photoRef = useRef('');

  // Profile photo is fetched with the token and shown as a blob: URL; revoke the old one each time.
  const showPhoto = useCallback(async (path) => {
    let next = '';
    try { next = await loadPhoto(path); } catch { next = ''; }
    if (photoRef.current) URL.revokeObjectURL(photoRef.current);
    photoRef.current = next;
    setPhotoSrc(next);
  }, []);
  useEffect(() => () => { if (photoRef.current) URL.revokeObjectURL(photoRef.current); }, []);

  const loadProfile = useCallback(async () => {
    setLoadError('');
    try {
      const p = await getProfile();
      setProfile(p);
      showPhoto(p.photoPath);
    } catch (err) {
      setLoadError(err.message || 'Could not load your profile.');
    }
  }, [showPhoto]);
  // Behind the sign-in gate (signed out) this page is only a blurred preview: don't call the API then.
  useEffect(() => { if (user) loadProfile(); }, [user?.id, loadProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTravellers = useCallback(async () => {
    setTravellersError('');
    try { setTravellers(await listCoTravellers()); } catch (err) { setTravellersError(err.message); setTravellers((t) => t ?? []); }
  }, []);
  const loadDevices = useCallback(async () => {
    setDevicesError('');
    try { setDevices(await listDevices()); } catch (err) { setDevicesError(err.message); setDevices((d) => d ?? []); }
  }, []);
  // Load a tab's data when it opens (devices every time: they change as people sign in elsewhere).
  useEffect(() => {
    if (activeSection === 'travellers' && travellers === null) loadTravellers();
    if (activeSection === 'devices') loadDevices();
  }, [activeSection]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- My profile ----------
  const updateField = (key, value) => setProfile((c) => ({ ...c, [key]: value }));
  const saveProfile = async () => {
    const saved = await updateProfile(profile); // throws ApiError with fieldErrors on validation problems
    setProfile((c) => ({ ...c, ...saved, photoPath: c.photoPath }));
    traveller.applyProfile(saved);
    return saved;
  };
  const changePhoto = async (file) => {
    const updated = await uploadPhoto(file);
    if (updated) {
      setProfile((c) => ({ ...c, photoPath: updated.photoPath }));
      await showPhoto(updated.photoPath);
    }
  };
  const contactSaved = (apiProfile) => setProfile((c) => ({
    ...c,
    email: apiProfile.email ?? '',
    mobile: apiProfile.mobile ?? '',
    mobileCountryCode: apiProfile.mobileCountryCode || '+91',
    emailVerified: Boolean(apiProfile.emailVerified),
    mobileVerified: Boolean(apiProfile.mobileVerified),
  }));

  // ---------- Co-travellers ----------
  const saveTraveller = async (t, isNew) => {
    const saved = isNew ? await createCoTraveller(t) : await updateCoTraveller(t);
    setTravellers((c) => (isNew ? [...(c ?? []), saved] : (c ?? []).map((i) => (i.id === saved.id ? saved : i))));
    return saved;
  };
  const removeTraveller = async (id) => {
    await deleteCoTraveller(id);
    setTravellers((c) => (c ?? []).filter((i) => i.id !== id));
  };

  // ---------- Sign out / devices ----------
  const closeLogout = useCallback(() => setLogoutOpen(false), []);
  const confirmLogout = async () => { setLogoutOpen(false); await logout(); navigate('/'); };
  const logoutOneDevice = async (device) => {
    if (device.current) { await confirmLogout(); return; }
    await revokeDevice(device.id);
    setDevices((c) => (c ?? []).filter((d) => d.id !== device.id));
  };
  const logoutOthers = async () => {
    await logoutOtherDevices();
    await loadDevices();
  };

  if (!user) return <div className="container acct-page" aria-hidden="true"><div className="card prof-top" style={{ minHeight: 160 }} /></div>;

  if (!profile) {
    return (
      <div className="container acct-page">
        {loadError ? (
          <div className="card prof-load-error" role="alert">
            <p className="h3">We couldn’t load your profile</p>
            <p className="muted-sm">{loadError}</p>
            <button type="button" className="btn btn-dark btn-sm" onClick={loadProfile}><RefreshCw size={15} aria-hidden="true" />Try again</button>
          </div>
        ) : <AuthLoading label="Loading your profile…" />}
      </div>
    );
  }

  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || user?.name || 'Your account';

  return (
    <div className="container acct-page">
      <div className="acct-head">
        <div>
          <span className="acct-kicker">Your account</span>
          <h1 className="h1-lg">My profile</h1>
          <p className="section-sub">Manage your personal details, the people you travel with, and the devices signed in to your account.</p>
        </div>
      </div>

      <div className="card prof-top">
        {photoSrc
          ? <img src={photoSrc} alt="" className="avatar" />
          : <span className="avatar">{initials(profile)}</span>}
        <div className="prof-who">
          <p className="h3">{displayName}</p>
          <p className="muted-sm">{profile.email || (profile.mobile ? `${profile.mobileCountryCode} ${profile.mobile}` : '')}</p>
        </div>
        <Badge tone="success">TriponX member</Badge>
        <button type="button" className="pill-btn danger" onClick={() => setLogoutOpen(true)}><LogOut size={14} aria-hidden="true" />Log out</button>
      </div>

      <ProfileNav active={activeSection} onChange={setActiveSection} />

      <div key={activeSection} className="prof-body">
        {activeSection === 'profile' ? (
          <MyProfileSection
            profile={profile}
            photoSrc={photoSrc}
            displayName={displayName}
            onChange={updateField}
            onSave={saveProfile}
            onPhotoChange={changePhoto}
            onContactSaved={contactSaved}
          />
        ) : null}
        {activeSection === 'travellers' ? (
          travellers === null
            ? <AuthLoading label="Loading co-travellers…" />
            : <CoTravellersSection travellers={travellers} error={travellersError} onRetry={loadTravellers} onSave={saveTraveller} onRemove={removeTraveller} />
        ) : null}
        {activeSection === 'devices' ? (
          devices === null
            ? <AuthLoading label="Loading your devices…" />
            : <LoggedInDevicesSection devices={devices} error={devicesError} onRetry={loadDevices} onLogoutDevice={logoutOneDevice} onLogoutOthers={logoutOthers} />
        ) : null}
        {activeSection === 'password' ? <ResetPasswordSection registeredEmail={profile.email} /> : null}
      </div>

      {logoutOpen ? (
        <Modal title="Log out?" onClose={closeLogout}>
          <p className="modal-text">Are you sure you want to logout? You will need to sign in again to manage your bookings.</p>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setLogoutOpen(false)}>Cancel</button>
            <button type="button" className="btn btn-danger" onClick={confirmLogout}>Log out</button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
