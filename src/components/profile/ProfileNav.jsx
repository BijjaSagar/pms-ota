// Profile sections from pms-ota (ProfileNav.tsx) as a TriponX pill segmented control.
import { KeyRound, MonitorSmartphone, UserRound, Users } from 'lucide-react';

// section ids: 'profile' | 'travellers' | 'devices' | 'password'
const items = [
  { id: 'profile', label: 'My profile', icon: UserRound },
  { id: 'travellers', label: 'Co-travellers', icon: Users },
  { id: 'devices', label: 'Logged-in devices', icon: MonitorSmartphone },
  { id: 'password', label: 'Reset password', icon: KeyRound },
];

export function ProfileNav({ active, onChange }) {
  return (
    <nav aria-label="Profile sections" className="seg-tabs prof-tabs">
      {items.map(({ id, label, icon: Icon }) => (
        <button key={id} type="button" onClick={() => onChange(id)} aria-current={active === id ? 'page' : undefined}
          className={`seg-tab ${active === id ? 'is-active' : ''}`}>
          <Icon size={15} aria-hidden="true" />{label}
        </button>
      ))}
    </nav>
  );
}
