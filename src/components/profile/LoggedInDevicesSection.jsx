// Logged-in devices — data/behaviour from pms-ota; TriponX grouped app-style list.
import { Monitor, Smartphone } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';
import { SectionCard } from './SectionCard.jsx';

export function LoggedInDevicesSection({ devices }) {
  const active = devices.filter((d) => d.loggedIn).length;
  return (
    <SectionCard
      title="Logged-in devices"
      description="These devices are currently signed in to your account. If you see something you don't recognise, reset your password."
      action={<Badge tone="success">{active} {active === 1 ? 'session' : 'sessions'} active</Badge>}
    >
      <ul className="app-list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {devices.map((device) => {
          const Icon = device.type === 'desktop' ? Monitor : Smartphone;
          return (
            <li key={device.id} className="app-row dev-row">
              <span className="app-row-icon"><Icon size={18} aria-hidden="true" /></span>
              <div className="app-row-main">
                <div className="row-gap-8 wrap center">
                  <p>{device.name}</p>
                  {device.current ? <Badge tone="accent">This device</Badge> : null}
                </div>
                <p className="dev-state"><span className={`dev-dot ${device.loggedIn ? 'on' : ''}`} aria-hidden="true" />{device.loggedIn ? 'Logged in' : 'Signed out'}</p>
              </div>
              <div className="dev-meta"><span>{device.location}</span><span>{device.loginTime}</span></div>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
