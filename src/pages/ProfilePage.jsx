// Profile — sections, data & behaviour from pms-ota (ProfilePage.tsx); TriponX layout (identity card + pill tabs).
import { useCallback, useEffect, useRef, useState } from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CoTravellersSection } from '../components/profile/CoTravellersSection.jsx';
import { LoggedInDevicesSection } from '../components/profile/LoggedInDevicesSection.jsx';
import { MyProfileSection } from '../components/profile/MyProfileSection.jsx';
import { ProfileNav } from '../components/profile/ProfileNav.jsx';
import { ResetPasswordSection } from '../components/profile/ResetPasswordSection.jsx';
import { PortalModal as Modal } from '../components/profile/PortalModal.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { initialCoTravellers, initialDevices, sampleProfile } from '../lib/data/profile.js';
import { useAuth } from '../lib/context/useAuth.js';
import '../styles/account.css';

function initials(profile) {
  return `${profile.firstName.charAt(0)}${(profile.lastName || profile.firstName.slice(1)).charAt(0)}`.toUpperCase() || 'TX';
}

// Start the profile from the signed-in user's own details instead of the sample person.
function profileFromUser(user) {
  const parts = (user?.name ?? '').trim().split(/\s+/).filter(Boolean);
  return {
    ...sampleProfile,
    firstName: parts[0] ?? '',
    middleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : '',
    lastName: parts.length > 1 ? parts[parts.length - 1] : '',
    dob: '',
    cityOfResidence: '',
    state: '',
    mobile: user?.phone ?? '',
    email: user?.email ?? '',
  };
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [profile, setProfile] = useState(() => profileFromUser(user));
  const [travellers, setTravellers] = useState(initialCoTravellers);
  // Demo devices, but logging one out is remembered for this account (until the backend tracks real sessions).
  const devicesKey = `triponx.devices.v1.${user?.id ?? 'guest'}`;
  const [devices, setDevices] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(devicesKey));
      if (Array.isArray(saved)) return initialDevices.map((d) => ({ ...d, ...(saved.find((s) => s.id === d.id) ?? {}) }));
    } catch {
      // unreadable / blocked storage: fall back to the defaults
    }
    return initialDevices;
  });
  const saveDevices = (next) => {
    setDevices(next);
    try {
      window.localStorage.setItem(devicesKey, JSON.stringify(next.map(({ id, loggedIn, signedOutAt }) => ({ id, loggedIn, signedOutAt }))));
    } catch {
      // storage blocked — change lasts until reload
    }
  };
  const signedOutNow = () => `Signed out ${new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`;
  const [logoutOpen, setLogoutOpen] = useState(false);
  const photoUrlRef = useRef(null);

  useEffect(() => () => { if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current); }, []);

  const updateProfile = (key, value) => setProfile((c) => ({ ...c, [key]: value }));
  const handlePhotoChange = (file) => {
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    const url = URL.createObjectURL(file);
    photoUrlRef.current = url;
    updateProfile('photoUrl', url);
  };
  const saveTraveller = (traveller) => {
    setTravellers((c) => (c.some((i) => i.id === traveller.id) ? c.map((i) => (i.id === traveller.id ? traveller : i)) : [...c, traveller]));
  };
  const removeTraveller = (id) => setTravellers((c) => c.filter((i) => i.id !== id));
  const closeLogout = useCallback(() => setLogoutOpen(false), []);
  const confirmLogout = () => { setLogoutOpen(false); navigate('/'); logout(); };
  // Log out one device. "This device" = a real sign-out here (its row comes back as logged in on the next sign-in).
  const logoutDevice = (device) => {
    if (device.current) { confirmLogout(); return; }
    const at = signedOutNow();
    saveDevices(devices.map((d) => (d.id === device.id ? { ...d, loggedIn: false, signedOutAt: at } : d)));
  };
  const logoutOtherDevices = () => {
    const at = signedOutNow();
    saveDevices(devices.map((d) => (d.current || !d.loggedIn ? d : { ...d, loggedIn: false, signedOutAt: at })));
  };

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
        {profile.photoUrl
          ? <img src={profile.photoUrl} alt="" className="avatar" />
          : <span className="avatar">{initials(profile)}</span>}
        <div className="prof-who">
          <p className="h3">{profile.firstName} {profile.lastName}</p>
          <p className="muted-sm">{profile.email}</p>
        </div>
        <Badge tone="success">TriponX member</Badge>
        <button type="button" className="pill-btn danger" onClick={() => setLogoutOpen(true)}><LogOut size={14} aria-hidden="true" />Log out</button>
      </div>

      <ProfileNav active={activeSection} onChange={setActiveSection} />

      <div key={activeSection} className="prof-body">
        {activeSection === 'profile' ? (
          <MyProfileSection profile={profile} onChange={updateProfile} onPhotoChange={handlePhotoChange} />
        ) : null}
        {activeSection === 'travellers' ? (
          <CoTravellersSection travellers={travellers} onSave={saveTraveller} onRemove={removeTraveller} />
        ) : null}
        {activeSection === 'devices' ? <LoggedInDevicesSection devices={devices} onLogoutDevice={logoutDevice} onLogoutOthers={logoutOtherDevices} /> : null}
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
