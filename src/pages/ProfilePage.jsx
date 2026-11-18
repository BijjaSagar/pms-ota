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
import '../styles/account.css';

function initials(profile) {
  return `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase() || 'TX';
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [profile, setProfile] = useState(() => ({ ...sampleProfile, document: { ...sampleProfile.document } }));
  const [travellers, setTravellers] = useState(initialCoTravellers);
  const [devices] = useState(initialDevices);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const photoUrlRef = useRef(null);

  useEffect(() => () => { if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current); }, []);

  const updateProfile = (key, value) => setProfile((c) => ({ ...c, [key]: value }));
  const updateDocument = (key, value) => setProfile((c) => ({ ...c, document: { ...c.document, [key]: value } }));
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
  const confirmLogout = () => { setLogoutOpen(false); navigate('/'); };

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
          <MyProfileSection profile={profile} onChange={updateProfile} onDocumentChange={updateDocument} onPhotoChange={handlePhotoChange} />
        ) : null}
        {activeSection === 'travellers' ? (
          <CoTravellersSection travellers={travellers} onSave={saveTraveller} onRemove={removeTraveller} />
        ) : null}
        {activeSection === 'devices' ? <LoggedInDevicesSection devices={devices} /> : null}
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
