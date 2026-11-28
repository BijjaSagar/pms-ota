import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BedDouble, Building2, ClipboardList, Coffee, Gift, Image as ImageIcon,
  Info, Landmark, RefreshCw, Settings, Star,
} from 'lucide-react';
import { getInformation, getProperty } from '../../lib/api/properties.js';
import { AuthLoading } from '../auth/RequireAuth.jsx';
import { showFromTop } from '../../lib/utils/showFromTop.js';
import {
  propertyInfoSectionById,
} from '../../lib/data/propertyInformationSections.js';
import { BasicInformationEditor } from './BasicInformationEditor.jsx';
import RoomsRateplansWorkspace from './RoomsRateplansWorkspace.jsx';
import AmenitiesRestaurantWorkspace from './AmenitiesRestaurantWorkspace.jsx';
import InclusionsPackagesWorkspace from './InclusionsPackagesWorkspace.jsx';
import PhotosVideosWorkspace from './PhotosVideosWorkspace.jsx';
import RulesPoliciesWorkspace from './RulesPoliciesWorkspace.jsx';
import ContentScoreDashboard from './ContentScoreDashboard.jsx';
import FinancialBankDetailsWorkspace from './FinancialBankDetailsWorkspace.jsx';
import PropertySettingsWorkspace from './PropertySettingsWorkspace.jsx';
import '../../styles/partner-property-information.css';
import '../../styles/partner-rooms-rateplans.css';
import '../../styles/partner-amenities-restaurant.css';
import '../../styles/partner-inclusions-packages.css';
import '../../styles/partner-photos-videos.css';
import '../../styles/partner-rules-policies.css';
import '../../styles/partner-content-score.css';
import '../../styles/partner-financial-bank-details.css';
import '../../styles/partner-property-settings.css';

const SECTION_ICONS = {
  'basic-information': Building2,
  'rooms-rateplans': BedDouble,
  'amenities-restaurants': Coffee,
  'inclusions-packages': Gift,
  'photos-videos': ImageIcon,
  'rules-policies': ClipboardList,
  'content-score': Star,
  'financial-bank-details': Landmark,
  settings: Settings,
};

const show = (value) => {
  if (value === undefined || value === null) return '—';
  const text = String(value).trim();
  return text || '—';
};

/**
 * Loads the whole property (the list only has a summary) and its Property
 * Information once, and hands both to the open section. A section that saves
 * passes the new state back so the others see it too.
 */
function usePropertyInformation(propertyId) {
  const [state, setState] = useState({ detail: null, information: null, error: '', loading: true });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: '' }));
    try {
      const [detail, information] = await Promise.all([getProperty(propertyId), getInformation(propertyId)]);
      setState({ detail, information, error: '', loading: false });
    } catch (problem) {
      setState((current) => ({ ...current, loading: false, error: problem?.message || 'We could not load this property.' }));
    }
  }, [propertyId]);

  useEffect(() => { load(); }, [load]);

  const setDetail = useCallback((detail) => setState((current) => ({ ...current, detail })), []);
  const setInformation = useCallback((information) => setState((current) => ({ ...current, information })), []);
  return { ...state, reload: load, setDetail, setInformation };
}

export function PropertyInformation({ property: summary }) {
  const [params] = useSearchParams();
  const section = propertyInfoSectionById(params.get('section'));
  const tab = params.get('tab');
  const Icon = SECTION_ICONS[section.id] ?? Building2;
  // A new section or tab opens at its top, not where the last one was scrolled to.
  const bodyRef = useRef(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    showFromTop(bodyRef.current);
  }, [section.id, tab]);
  const { detail, information, error, loading, reload, setDetail, setInformation } = usePropertyInformation(summary.id);
  // Summary first (status, cover, stats), then everything the detail adds.
  const property = detail ? { ...summary, ...detail } : summary;
  const shared = { property, information, onPropertyChange: setDetail, onInformationChange: setInformation, onReload: reload };

  return (
    <div className="pii-page">
      <header className="pii-head">
        <div>
          <h1 className="pii-title">Property Information</h1>
          <p className="pii-sub">{show(information?.details.displayName || property.basic?.propertyName || property.propertyName)} · manage every part of this listing.</p>
        </div>
      </header>

      <section className="pii-content">
        <header className="pii-section-head">
          <span className="pii-section-icon"><Icon size={21} aria-hidden="true" /></span>
          <div>
            <h2>{section.label}</h2>
            <p>{section.description}</p>
          </div>
        </header>

        <div className="pii-section-body" ref={bodyRef}>
          {!detail || !information ? (
            error ? (
              <div className="pii-load-error" role="alert">
                <Info size={18} aria-hidden="true" />
                <span>{error}</span>
                <button type="button" onClick={reload} disabled={loading}><RefreshCw size={15} aria-hidden="true" />Try again</button>
              </div>
            ) : <AuthLoading label="Loading property information…" />
          ) : (
            <>
              {section.id === 'basic-information' ? <BasicInformationEditor key={property.id} {...shared} /> : null}
              {section.id === 'rooms-rateplans' ? <RoomsRateplansWorkspace key={property.id} {...shared} /> : null}
              {section.id === 'amenities-restaurants' ? <AmenitiesRestaurantWorkspace key={property.id} {...shared} /> : null}
              {section.id === 'inclusions-packages' ? <InclusionsPackagesWorkspace key={property.id} {...shared} /> : null}
              {section.id === 'photos-videos' ? <PhotosVideosWorkspace key={property.id} {...shared} /> : null}
              {section.id === 'rules-policies' ? <RulesPoliciesWorkspace key={property.id} {...shared} /> : null}
              {section.id === 'content-score' ? <ContentScoreDashboard key={property.id} {...shared} /> : null}
              {section.id === 'financial-bank-details' ? <FinancialBankDetailsWorkspace key={property.id} {...shared} /> : null}
              {section.id === 'settings' ? <PropertySettingsWorkspace key={property.id} {...shared} /> : null}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
