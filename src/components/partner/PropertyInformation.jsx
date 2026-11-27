import { useMemo, useState } from 'react';
import { NavLink, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowRight, BedDouble, Building2, ClipboardList, Coffee, Gift, Image as ImageIcon,
  Landmark, Settings, Star,
} from 'lucide-react';
import {
  propertyInfoSectionById,
} from '../../lib/data/propertyInformationSections.js';
import { PARTNER_PATHS } from './paths.js';
import { contentScore, pendingSections } from '../../lib/utils/propertySummary.js';
import { BasicInformationEditor } from './BasicInformationEditor.jsx';
import RoomsRateplansWorkspace from './RoomsRateplansWorkspace.jsx';
import AmenitiesRestaurantWorkspace from './AmenitiesRestaurantWorkspace.jsx';
import InclusionsPackagesWorkspace from './InclusionsPackagesWorkspace.jsx';
import PhotosVideosWorkspace from './PhotosVideosWorkspace.jsx';
import '../../styles/partner-property-information.css';
import '../../styles/partner-rooms-rateplans.css';
import '../../styles/partner-amenities-restaurant.css';
import '../../styles/partner-inclusions-packages.css';
import '../../styles/partner-photos-videos.css';

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

const SETTINGS_KEY = 'triponx.partner.propertyInformation.settings';
const DEFAULT_SETTINGS = {
  onlineBookings: true,
  emailAlerts: true,
  smsAlerts: false,
  priceAlerts: true,
};

const show = (value) => {
  if (value === undefined || value === null) return '—';
  const text = String(value).trim();
  return text || '—';
};

const yesNo = (value) => {
  if (value === true || value === 'yes') return 'Yes';
  if (value === false || value === 'no') return 'No';
  return show(value);
};

const labelFor = (code) => String(code).replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const mask = (value) => {
  const text = show(value);
  if (text === '—' || text.length <= 4) return text;
  return `${'•'.repeat(text.length - 4)}${text.slice(-4)}`;
};

const rupees = (value) => {
  const amount = Number(value);
  if (value === '' || value === undefined || value === null || !Number.isFinite(amount)) return '—';
  return `₹${amount.toLocaleString('en-IN')}`;
};

const loadSettings = (id) => {
  try {
    const stored = window.sessionStorage.getItem(`${SETTINGS_KEY}.${id}`);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const saveSettings = (id, settings) => {
  try {
    window.sessionStorage.setItem(`${SETTINGS_KEY}.${id}`, JSON.stringify(settings));
  } catch {
    return;
  }
};

function InfoGrid({ rows }) {
  return (
    <dl className="pii-info-grid">
      {rows.map(([label, value]) => (
        <div className="pii-info-item" key={label}>
          <dt>{label}</dt>
          <dd>{show(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function Switch({ checked, label, onChange }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label}
      className={`pii-switch ${checked ? 'is-on' : ''}`}
      onClick={() => onChange(!checked)}>
      <span />
    </button>
  );
}

function RulesPolicies({ property, wizardPath }) {
  const policies = property.policies ?? {};
  return (
    <div className="pii-panel-stack">
      <InfoGrid rows={[
        ['Check-in time', policies.checkInTime],
        ['Check-out time', policies.checkOutTime],
        ['Cancellation', policies.cancellationPolicy ?? policies.cancellation],
        ['Early check-in', yesNo(policies.earlyCheckIn)],
        ['Late check-out', yesNo(policies.lateCheckOut)],
        ['Children policy', policies.childrenPolicy],
        ['Pets allowed', yesNo(policies.petsAllowed ?? policies.pets)],
        ['Identity proof', policies.idProof ?? policies.identityProof],
      ]} />
      <div className="pii-inline-action">
        <NavLink to={wizardPath} className="pii-link">Edit rules & policies <ArrowRight size={14} aria-hidden="true" /></NavLink>
      </div>
    </div>
  );
}

function ContentScore({ property, wizardPath }) {
  const safeProperty = useMemo(() => ({
    ...property,
    completedSections: Array.isArray(property.completedSections) ? property.completedSections : [],
  }), [property]);
  const score = contentScore(safeProperty);
  const pending = pendingSections(safeProperty);
  return (
    <div className="pii-score-layout">
      <div className="pii-score-ring" style={{ '--score': `${score}%` }}>
        <strong>{score}%</strong>
        <span>complete</span>
      </div>
      <div className="pii-panel-stack">
        <h3>{pending.length ? `${pending.length} sections need attention` : 'Listing is complete'}</h3>
        {pending.length ? (
          <ul className="pii-pending-list">
            {pending.map((item) => <li key={item.id}>{item.label}</li>)}
          </ul>
        ) : <p className="pii-muted">Everything required is complete.</p>}
        <NavLink to={wizardPath} className="pii-btn">Improve content score <ArrowRight size={14} aria-hidden="true" /></NavLink>
      </div>
    </div>
  );
}

function FinancialBankDetails({ property, wizardPath }) {
  const legal = property.legal ?? {};
  return (
    <div className="pii-panel-stack">
      <InfoGrid rows={[
        ['Legal / business name', legal.legalName ?? legal.businessName],
        ['PAN', mask(legal.pan)],
        ['GSTIN', mask(legal.gstin)],
        ['Account holder', legal.accountHolder],
        ['Bank name', legal.bankName],
        ['Account number', mask(legal.accountNumber)],
        ['GST registered', yesNo(legal.hasGst)],
      ]} />
      <div className="pii-inline-action">
        <NavLink to={wizardPath} className="pii-link">Edit financial details <ArrowRight size={14} aria-hidden="true" /></NavLink>
      </div>
    </div>
  );
}

function SettingsPanel({ settings, onChange, onReset }) {
  const items = [
    ['onlineBookings', 'Accept online bookings', 'Allow guests to book this property on TriponX.'],
    ['emailAlerts', 'Email notifications', 'Receive booking and payment alerts by email.'],
    ['smsAlerts', 'SMS alerts', 'Receive urgent booking alerts by SMS.'],
    ['priceAlerts', 'Rate change alerts', 'Get notified when market rates shift significantly.'],
  ];
  return (
    <div className="pii-panel-stack">
      <div className="pii-settings-list">
        {items.map(([key, label, detail]) => (
          <div className="pii-setting-row" key={key}>
            <div>
              <strong>{label}</strong>
              <small>{detail}</small>
            </div>
            <Switch checked={Boolean(settings[key])} label={label} onChange={(value) => onChange(key, value)} />
          </div>
        ))}
      </div>
      <div className="pii-inline-action">
        <button type="button" className="pii-link pii-reset" onClick={onReset}>Reset to defaults</button>
      </div>
    </div>
  );
}

export function PropertyInformation({ property }) {
  const [params] = useSearchParams();
  const section = propertyInfoSectionById(params.get('section'));
  const Icon = SECTION_ICONS[section.id] ?? Building2;
  const wizardPath = `${PARTNER_PATHS.newProperty}?property=${encodeURIComponent(property.id)}`;
  const [settings, setSettings] = useState(() => loadSettings(property.id));

  const changeSetting = (key, value) => {
    setSettings((current) => {
      const next = { ...current, [key]: value };
      saveSettings(property.id, next);
      return next;
    });
  };

  const resetSettings = () => {
    saveSettings(property.id, DEFAULT_SETTINGS);
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <div className="pii-page">
      <header className="pii-head">
        <div>
          <h1 className="pii-title">Property Information</h1>
          <p className="pii-sub">{show(property.propertyName)} · manage every part of this listing.</p>
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

        <div className="pii-section-body">
          {section.id === 'basic-information' ? <BasicInformationEditor property={property} /> : null}
          {section.id === 'rooms-rateplans' ? <RoomsRateplansWorkspace property={property} /> : null}
          {section.id === 'amenities-restaurants' ? <AmenitiesRestaurantWorkspace property={property} /> : null}
          {section.id === 'inclusions-packages' ? <InclusionsPackagesWorkspace property={property} /> : null}
          {section.id === 'photos-videos' ? <PhotosVideosWorkspace property={property} /> : null}
          {section.id === 'rules-policies' ? <RulesPolicies property={property} wizardPath={wizardPath} /> : null}
          {section.id === 'content-score' ? <ContentScore property={property} wizardPath={wizardPath} /> : null}
          {section.id === 'financial-bank-details' ? <FinancialBankDetails property={property} wizardPath={wizardPath} /> : null}
          {section.id === 'settings' ? <SettingsPanel settings={settings} onChange={changeSetting} onReset={resetSettings} /> : null}
        </div>
      </section>
    </div>
  );
}
