// Partner Hub home: "My Properties" (/list-property/properties).
// Tabs: Active Properties (approved, live on TriponX) and In-Progress Properties (submitted listing requests).
// There is no approval flow yet, so Active is always empty and every submitted request is in progress.
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Building2, CalendarDays, Clock3, MapPin, Plus } from 'lucide-react';
import { PartnerShell } from '../components/partner/PartnerShell.jsx';
import { IN_PROGRESS_TAB, PARTNER_PATHS, propertiesTab } from '../components/partner/paths.js';
import { useAuth } from '../lib/context/useAuth.js';
import { PROPERTY_TYPES, ROOM_RANGES, getPartnerLeads } from '../lib/data/partner.js';
import '../styles/partner.css';

const optionLabel = (options, value) => options.find(([v]) => v === value)?.[1] ?? '—';
const submittedOn = (iso) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));

function ListNewButton({ className = '' }) {
  return (
    <Link to={PARTNER_PATHS.newProperty} className={`btn btn-primary ${className}`}>
      <Plus size={18} aria-hidden="true" />List New Property
    </Link>
  );
}

function EmptyState({ title, text, children }) {
  return (
    <div className="pp-empty">
      <span className="pp-empty-icon"><Building2 size={28} aria-hidden="true" /></span>
      <h2 className="h-card">{title}</h2>
      <p className="muted-sm">{text}</p>
      <div className="pp-empty-actions">{children}</div>
    </div>
  );
}

export default function PartnerPropertiesPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === IN_PROGRESS_TAB ? IN_PROGRESS_TAB : 'active';

  // Re-read when the account changes (sign-in in another tab, etc.).
  const inProgress = useMemo(() => getPartnerLeads(user?.id), [user?.id]);
  const active = []; // filled once listings can be approved

  const tabs = [
    ['active', `Active Properties (${active.length})`],
    [IN_PROGRESS_TAB, `In-Progress Properties (${inProgress.length})`],
  ];
  const selectTab = (key) => setParams(key === 'active' ? {} : { tab: key }, { replace: true });

  return (
    <PartnerShell title="My Properties">
      <div className="pp-head">
        <h1 className="pp-title">My Properties</h1>
        <ListNewButton className="pp-head-cta" />
      </div>

      <div className="pp-tabs" role="tablist" aria-label="Properties">
        {tabs.map(([key, label]) => (
          <button key={key} type="button" role="tab" id={`pp-tab-${key}`} aria-selected={tab === key}
            aria-controls={`pp-panel-${key}`} className={tab === key ? 'is-active' : ''} onClick={() => selectTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'active' && (
        <section id="pp-panel-active" role="tabpanel" aria-labelledby="pp-tab-active" className="pp-panel">
          <EmptyState title="No Active Properties"
            text="Complete your listing soon and make your inactive properties active.">
            <Link to={propertiesTab(IN_PROGRESS_TAB)} replace className="btn btn-light">View In-Progress Properties</Link>
            <ListNewButton />
          </EmptyState>
        </section>
      )}

      {tab === IN_PROGRESS_TAB && (
        <section id={`pp-panel-${IN_PROGRESS_TAB}`} role="tabpanel" aria-labelledby={`pp-tab-${IN_PROGRESS_TAB}`} className="pp-panel">
          {inProgress.length === 0 ? (
            <EmptyState title="No In-Progress Properties"
              text="Start a listing and it will show up here while our team reviews it.">
              <ListNewButton />
            </EmptyState>
          ) : (
            <ul className="pp-list">
              {inProgress.map((p) => (
                <li key={p.reference} className="pp-row">
                  <span className="pp-row-icon" aria-hidden="true"><Building2 size={22} /></span>
                  <div className="pp-row-main">
                    <strong className="pp-row-name">{p.propertyName}</strong>
                    <span className="pp-row-meta">
                      {optionLabel(PROPERTY_TYPES, p.propertyType)}
                      <span aria-hidden="true">·</span>
                      <MapPin size={13} aria-hidden="true" />{p.city}
                      <span aria-hidden="true">·</span>
                      {optionLabel(ROOM_RANGES, p.rooms)}
                    </span>
                  </div>
                  <div className="pp-row-side">
                    <span className="pp-status"><Clock3 size={13} aria-hidden="true" />Under review</span>
                    <span className="pp-row-date"><CalendarDays size={13} aria-hidden="true" />Submitted {submittedOn(p.createdAt)}</span>
                    <span className="pp-row-ref">Request ID <span className="ref-code">{p.reference}</span></span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </PartnerShell>
  );
}
