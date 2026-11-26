// Module row under the Partner Hub top bar: icon on top, name below, active module highlighted.
// Scrolls sideways when the modules don't fit (tablets / phones); the active module is kept in view.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { PARTNER_MODULES, PROPERTY_LIST_MODULES } from './partnerModules.js';
import { PARTNER_PATHS, moduleSoonPath, propertyRatesSectionPath } from './paths.js';
import { RATES_INVENTORY_SECTIONS } from '../../lib/data/ratesInventorySections.js';
import '../../styles/partner.css';

export function PartnerModuleNav() {
  const trackRef = useRef(null);
  const ratesRef = useRef(null);
  const flyoutRef = useRef(null);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [flyoutStyle, setFlyoutStyle] = useState({ top: 0, left: 0, width: 0 });
  const { pathname } = useLocation();
  const { propertyId } = useParams();
  const [params] = useSearchParams();
  const activeView = params.get('view') ?? 'overview';
  const activeSection = params.get('section');
  const onPropertyPage = pathname.startsWith(`${PARTNER_PATHS.properties}/`);
  const onPropertyListFlow = pathname === PARTNER_PATHS.properties
    || pathname === PARTNER_PATHS.newProperty
    || pathname === moduleSoonPath('inbox');
  const modules = onPropertyListFlow ? PROPERTY_LIST_MODULES : PARTNER_MODULES;
  const belongsTo = (path) => pathname === path || pathname.startsWith(`${path}/`);
  const activeRates = onPropertyPage && activeView === 'rates-inventory';

  useEffect(() => {
    const track = trackRef.current;
    const active = track?.querySelector('.pmn-item.is-active');
    if (!track || !active || track.scrollWidth <= track.clientWidth) return;
    const t = track.getBoundingClientRect();
    const a = active.getBoundingClientRect();
    const left = track.scrollLeft + (a.left - t.left) - (t.width - a.width) / 2;
    track.scrollTo({ left, behavior: 'instant' });
  }, [pathname, activeView]);

  useEffect(() => {
    setFlyoutOpen(false);
  }, [pathname, activeView, activeSection]);

  useLayoutEffect(() => {
    if (!flyoutOpen) return undefined;
    const place = () => {
      const rect = ratesRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.max(rect.width, 286);
      const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
      setFlyoutStyle({ top: Math.round(rect.bottom + 4), left: Math.round(left), width: Math.round(width) });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [flyoutOpen]);

  useEffect(() => {
    if (!flyoutOpen) return undefined;
    const close = () => setFlyoutOpen(false);
    const onPointerDown = (event) => {
      if (ratesRef.current?.contains(event.target) || flyoutRef.current?.contains(event.target)) return;
      close();
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', close, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', close);
    };
  }, [flyoutOpen]);

  const moduleActive = ({ id, view, also = [] }, isActive = false) => (
    view
      ? (onPropertyPage ? activeView === view : id === 'home' && pathname === PARTNER_PATHS.properties)
      : (isActive || also.some(belongsTo))
  );

  return (
    <nav className="pmn" aria-label="Partner modules">
      <div className="pmn-track" ref={trackRef}>
        {modules.map((module) => {
          const { id, label, Icon, href, hrefFor, view, also } = module;
          if (id === 'rates-inventory') {
            return (
              <div className="pmn-flyout-wrap" key={id} ref={ratesRef}>
                <button type="button"
                  className={`pmn-item pmn-flyout-trigger ${activeRates ? 'is-active' : ''}`}
                  aria-haspopup="menu"
                  aria-expanded={flyoutOpen}
                  aria-controls="pmn-rates-flyout"
                  onClick={() => setFlyoutOpen((open) => !open)}>
                  <span className="pmn-icon"><Icon size={22} strokeWidth={1.8} aria-hidden="true" /></span>
                  <span className="pmn-label">{label}</span>
                </button>
              </div>
            );
          }
          return (
            <NavLink key={id} to={hrefFor ? hrefFor({ propertyId }) : href}
              className={({ isActive }) => `pmn-item ${moduleActive(module, isActive) ? 'is-active' : ''}`}>
              <span className="pmn-icon"><Icon size={22} strokeWidth={1.8} aria-hidden="true" /></span>
              <span className="pmn-label">{label}</span>
            </NavLink>
          );
        })}
      </div>
      {flyoutOpen && typeof document !== 'undefined' && createPortal(
        <div className="pmn-flyout" id="pmn-rates-flyout" role="menu" aria-label="Rates & Inventory sections"
          ref={flyoutRef} style={flyoutStyle}>
          {RATES_INVENTORY_SECTIONS.map((section) => (
            <NavLink key={section.id} role="menuitem"
              to={propertyRatesSectionPath(propertyId ?? 'sample', section.id)}
              className={`pmn-flyout-item ${activeRates && activeSection === section.id ? 'is-active' : ''}`}
              onClick={() => setFlyoutOpen(false)}>
              <span className="pmn-flyout-label">{section.label}</span>
            </NavLink>
          ))}
        </div>,
        document.body,
      )}
    </nav>
  );
}
