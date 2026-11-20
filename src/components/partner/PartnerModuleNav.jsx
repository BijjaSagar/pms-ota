// Module row under the Partner Hub top bar: icon on top, name below, active module highlighted.
// Scrolls sideways when the modules don't fit (tablets / phones); the active module is kept in view.
import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { PARTNER_MODULES } from './partnerModules.js';
import '../../styles/partner.css';

export function PartnerModuleNav() {
  const trackRef = useRef(null);
  const { pathname } = useLocation();

  // Centre the active module inside the row on navigation. Only the row scrolls (sideways) —
  // scrollIntoView would also move the page.
  useEffect(() => {
    const track = trackRef.current;
    const active = track?.querySelector('.pmn-item.is-active');
    if (!track || !active || track.scrollWidth <= track.clientWidth) return;
    // On-screen positions (offsetLeft depends on which ancestor is positioned — the sticky header is).
    const t = track.getBoundingClientRect();
    const a = active.getBoundingClientRect();
    const left = track.scrollLeft + (a.left - t.left) - (t.width - a.width) / 2;
    track.scrollTo({ left, behavior: 'instant' }); // instant: no slide on page load / navigation
  }, [pathname]);

  return (
    <nav className="pmn" aria-label="Partner modules">
      <div className="pmn-track" ref={trackRef}>
        {PARTNER_MODULES.map(({ id, label, Icon, href, also }) => (
          <NavLink key={id} to={href}
            className={({ isActive }) => `pmn-item ${isActive || also.includes(pathname) ? 'is-active' : ''}`}>
            <span className="pmn-icon"><Icon size={22} strokeWidth={1.8} aria-hidden="true" /></span>
            <span className="pmn-label">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
