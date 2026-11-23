// Logged-in devices — data/behaviour from pms-ota; TriponX grouped app-style list.
// Each signed-in device has its own Log out button (asks first). Logging out "This device" signs you
// out here; any other device is marked signed out. "Log out of all other devices" does the rest in one go.
import { useCallback, useState } from 'react';
import { LogOut, Monitor, Smartphone } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';
import { SectionCard } from './SectionCard.jsx';
import { PortalModal as Modal } from './PortalModal.jsx';

export function LoggedInDevicesSection({ devices, onLogoutDevice, onLogoutOthers }) {
  const active = devices.filter((d) => d.loggedIn).length;
  const othersActive = devices.filter((d) => d.loggedIn && !d.current).length;
  // { kind: 'one', device } | { kind: 'others' } | null
  const [confirm, setConfirm] = useState(null);
  const close = useCallback(() => setConfirm(null), []);

  const confirmLogout = () => {
    if (confirm?.kind === 'one') onLogoutDevice(confirm.device);
    if (confirm?.kind === 'others') onLogoutOthers();
    setConfirm(null);
  };

  const isCurrent = confirm?.kind === 'one' && confirm.device.current;
  const title = confirm?.kind === 'others' ? 'Log out of all other devices?' : 'Log out of this device?';
  const text = confirm?.kind === 'others'
    ? `${othersActive} other ${othersActive === 1 ? 'device' : 'devices'} will be signed out. They will need to sign in again.`
    : isCurrent
      ? 'You are using this device now. You will be signed out here and need to sign in again to manage your bookings.'
      : `${confirm?.device?.name ?? 'This device'} will be signed out of your account. It will need to sign in again.`;

  return (
    <SectionCard
      title="Logged-in devices"
      description="These devices are currently signed in to your account. If you see something you don't recognise, log it out and reset your password."
      action={<Badge tone="success">{active} {active === 1 ? 'session' : 'sessions'} active</Badge>}
    >
      <ul className="app-list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {devices.map((device) => {
          const Icon = device.type === 'desktop' ? Monitor : Smartphone;
          return (
            <li key={device.id} className={`app-row dev-row ${device.loggedIn ? '' : 'is-out'}`}>
              <span className="app-row-icon"><Icon size={18} aria-hidden="true" /></span>
              <div className="app-row-main">
                <div className="row-gap-8 wrap center">
                  <p>{device.name}</p>
                  {device.current ? <Badge tone="accent">This device</Badge> : null}
                </div>
                <p className="dev-state"><span className={`dev-dot ${device.loggedIn ? 'on' : ''}`} aria-hidden="true" />{device.loggedIn ? 'Logged in' : 'Signed out'}</p>
              </div>
              <div className="dev-meta"><span>{device.location}</span><span>{device.loggedIn ? device.loginTime : device.signedOutAt ?? device.loginTime}</span></div>
              {device.loggedIn ? (
                <button
                  type="button"
                  className="pill-btn danger dev-logout"
                  onClick={() => setConfirm({ kind: 'one', device })}
                  aria-label={`Log out ${device.name}${device.current ? ' (this device)' : ''}`}
                >
                  <LogOut size={14} aria-hidden="true" /><span>Log out</span>
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>

      {othersActive > 0 ? (
        <div className="dev-actions">
          <button type="button" className="pill-btn danger" onClick={() => setConfirm({ kind: 'others' })}>
            <LogOut size={14} aria-hidden="true" />Log out of all other devices
          </button>
        </div>
      ) : null}

      {confirm ? (
        <Modal title={title} onClose={close}>
          <p className="modal-text">{text}</p>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={close}>Cancel</button>
            <button type="button" className="btn btn-danger" onClick={confirmLogout}>Log out</button>
          </div>
        </Modal>
      ) : null}
    </SectionCard>
  );
}
