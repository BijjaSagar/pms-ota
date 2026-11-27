import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { MORE_MODULES, PARTNER_MODULES, PROPERTY_LIST_MODULES } from './partnerModules.js';
import {
  PARTNER_PATHS, currentPropertyId, moduleSoonPath,
  propertyInformationSectionPath, propertyRatesSectionPath,
} from './paths.js';
import { RATES_INVENTORY_SECTIONS } from '../../lib/data/ratesInventorySections.js';
import { PROPERTY_INFO_NAV_SECTIONS } from '../../lib/data/propertyInformationSections.js';
import '../../styles/partner.css';

const FLYOUT_MODULE_IDS = ['rates-inventory', 'property-information', 'more'];

export function PartnerModuleNav() {
  const trackRef = useRef(null);
  const ratesRef = useRef(null);
  const propertyInfoRef = useRef(null);
  const moreRef = useRef(null);
  const flyoutRef = useRef(null);
  const triggerRefs = {
    'rates-inventory': ratesRef,
    'property-information': propertyInfoRef,
    more: moreRef,
  };
  const [openFlyout, setOpenFlyout] = useState(null);
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
  const activePropertyInfo = onPropertyPage && activeView === 'property-information';
  const moreActive = belongsTo(moduleSoonPath('more')) || MORE_MODULES.some((m) => belongsTo(m.href));
  const property = currentPropertyId(propertyId);

  const flyoutConfigs = {
    'rates-inventory': {
      id: 'pmn-rates-flyout',
      label: 'Rates & Inventory sections',
      width: 286,
      ref: ratesRef,
      active: activeRates,
      sections: RATES_INVENTORY_SECTIONS,
      showDescription: false,
      to: (item) => propertyRatesSectionPath(property, item.id),
      itemActive: (item) => activeRates && activeSection === item.id,
    },
    'property-information': {
      id: 'pmn-property-information-flyout',
      label: 'Property Information sections',
      width: 280,
      ref: propertyInfoRef,
      active: activePropertyInfo,
      sections: PROPERTY_INFO_NAV_SECTIONS,
      showDescription: false,
      to: (item) => propertyInformationSectionPath(property, item.id),
      itemActive: (item) => activePropertyInfo && activeSection === item.id,
    },
    more: {
      id: 'pmn-more-flyout',
      label: 'More sections',
      width: 220,
      ref: moreRef,
      active: moreActive,
      sections: MORE_MODULES,
      showDescription: false,
      to: (item) => item.href,
      itemActive: (item) => belongsTo(item.href),
    },
  };

  useEffect(() => {
    const track = trackRef.current;
    const active = track?.querySelector('.pmn-item.is-active');
    if (!track || !active || track.scrollWidth <= track.clientWidth) return;
    const t = track.getBoundingClientRect();
    const a = active.getBoundingClientRect();
    const left = track.scrollLeft + (a.left - t.left) - (t.width - a.width) / 2;
    track.scrollTo({ left, behavior: 'instant' });
  }, [pathname, activeView, activeSection]);

  useEffect(() => {
    setOpenFlyout(null);
  }, [pathname, activeView, activeSection]);

  useLayoutEffect(() => {
    if (!openFlyout) return undefined;
    const config = flyoutConfigs[openFlyout];
    const place = () => {
      const rect = config?.ref.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.max(rect.width, config.width);
      const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
      setFlyoutStyle({ top: Math.round(rect.bottom + 4), left: Math.round(left), width: Math.round(width) });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [openFlyout]);

  useEffect(() => {
    if (!openFlyout) return undefined;
    const close = () => setOpenFlyout(null);
    const onPointerDown = (event) => {
      const trigger = triggerRefs[openFlyout]?.current;
      if (trigger?.contains(event.target) || flyoutRef.current?.contains(event.target)) return;
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
  }, [openFlyout]);

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
          if (FLYOUT_MODULE_IDS.includes(id)) {
            const config = flyoutConfigs[id];
            return (
              <div className="pmn-flyout-wrap" key={id} ref={triggerRefs[id]}>
                <button type="button"
                  className={`pmn-item pmn-flyout-trigger ${config.active ? 'is-active' : ''}`}
                  aria-haspopup="menu"
                  aria-expanded={openFlyout === id}
                  aria-controls={config.id}
                  onClick={() => setOpenFlyout((current) => (current === id ? null : id))}>
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
      {openFlyout && flyoutConfigs[openFlyout] && typeof document !== 'undefined' && createPortal(
        <div className="pmn-flyout" id={flyoutConfigs[openFlyout].id} role="menu"
          aria-label={flyoutConfigs[openFlyout].label} ref={flyoutRef} style={flyoutStyle}>
          {flyoutConfigs[openFlyout].sections.map((item) => (
            <NavLink key={item.id} role="menuitem" to={flyoutConfigs[openFlyout].to(item)}
              className={`pmn-flyout-item ${flyoutConfigs[openFlyout].itemActive(item) ? 'is-active' : ''}`}
              onClick={() => setOpenFlyout(null)}>
              <span className="pmn-flyout-label">{item.label}</span>
              {flyoutConfigs[openFlyout].showDescription && item.description
                ? <span className="pmn-flyout-desc">{item.description}</span>
                : null}
            </NavLink>
          ))}
        </div>,
        document.body,
      )}
    </nav>
  );
}
