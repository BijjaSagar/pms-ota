// Partner Hub home: "Your properties" (/list-property/properties).
// TriponX layout: status cards (Live / Under review) that filter the list, a request-card grid, and a
// "From request to live" guide beside it. There is no approval flow yet, so Live is always empty and every
// submitted listing request is under review. `?tab=in-progress` selects Under review (kept for old links).
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarDays, CheckCircle2, ClipboardCheck, Clock3, MapPin, Plus, Rocket, Search } from 'lucide-react';
import { PartnerShell } from '../components/partner/PartnerShell.jsx';
import { PropertyIcon } from '../components/partner/PropertyIcons.jsx';
import { IN_PROGRESS_TAB, PARTNER_PATHS, propertiesTab } from '../components/partner/paths.js';
import { useAuth } from '../lib/context/useAuth.js';
import { PROPERTY_TYPES, ROOM_RANGES, getPartnerLeads } from '../lib/data/partner.js';
import '../styles/partner.css';

const LIVE = 'live';
const REVIEW = IN_PROGRESS_TAB;

const optionLabel = (options, value) => options.find(([v]) => v === value)?.[1] ?? '—';
const submittedOn = (iso) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));

const STEPS = [
  { Icon: Plus, title: 'Add your property', text: 'Pick the type and share the basics.' },
  { Icon: Search, title: 'We review it', text: 'Our team checks the details, usually within 48 hours.' },
  { Icon: Rocket, title: 'Go live', text: 'Guests can find and book it on TriponX.' },
];

function AddButton({ className = '' }) {
  return (
    <Link to={PARTNER_PATHS.newProperty} className={`btn btn-primary ${className}`}>
      <Plus size={18} aria-hidden="true" />Add a property
    </Link>
  );
}

function Empty({ Icon, title, text, children }) {
  return (
    <div className="pv-empty">
      <span className="pv-empty-icon"><Icon size={26} aria-hidden="true" /></span>
      <h2 className="pv-empty-title">{title}</h2>
      <p className="muted-sm">{text}</p>
      {children && <div className="pv-empty-actions">{children}</div>}
    </div>
  );
}

export default function PartnerPropertiesPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const view = params.get('tab') === REVIEW ? REVIEW : LIVE;

  const underReview = useMemo(() => getPartnerLeads(user?.id), [user?.id]);
  const live = []; // filled once listings can be approved

  const cards = [
    { key: LIVE, label: 'Live', hint: 'Bookable by guests', count: live.length, Icon: CheckCircle2 },
    { key: REVIEW, label: 'Under review', hint: 'Being checked by our team', count: underReview.length, Icon: Clock3 },
  ];
  const show = (key) => setParams(key === LIVE ? {} : { tab: key }, { replace: true });

  return (
    <PartnerShell title="Your properties">
      <header className="pv-head">
        <div>
          <h1 className="pp-title">Your properties</h1>
          <p className="muted-sm pv-sub">Add new places and follow each one from request to live.</p>
        </div>
        <AddButton className="pv-head-cta" />
      </header>

      <div className="pv-stats" role="tablist" aria-label="Filter properties">
        {cards.map(({ key, label, hint, count, Icon }) => (
          <button key={key} type="button" role="tab" id={`pv-tab-${key}`} aria-selected={view === key} aria-controls="pv-panel"
            className={`pv-stat pv-stat-${key} ${view === key ? 'is-on' : ''}`} onClick={() => show(key)}>
            <span className="pv-stat-top">
              <span className="pv-stat-icon"><Icon size={18} aria-hidden="true" /></span>
              <span className="pv-stat-count">{count}</span>
            </span>
            <span className="pv-stat-label">{label}</span>
            <span className="pv-stat-hint">{hint}</span>
          </button>
        ))}
      </div>

      <div className="pv-layout">
        <section id="pv-panel" role="tabpanel" aria-labelledby={`pv-tab-${view}`} className="pv-panel">
          {view === LIVE && (
            <Empty Icon={CheckCircle2} title="Nothing live yet"
              text="Once a property is approved it goes live for guests and appears here.">
              <AddButton />
              {underReview.length > 0 && (
                <Link to={propertiesTab(REVIEW)} replace className="btn btn-light">See requests under review</Link>
              )}
            </Empty>
          )}

          {view === REVIEW && (underReview.length === 0 ? (
            <Empty Icon={ClipboardCheck} title="No requests under review"
              text="Add a property and it will wait here while our team checks it.">
              <AddButton />
            </Empty>
          ) : (
            <ul className="pv-grid">
              {underReview.map((p) => (
                <li key={p.reference} className="pv-card">
                  <div className="pv-card-top">
                    <span className="pv-card-art"><PropertyIcon type={p.propertyType} size={34} /></span>
                    <span className="pv-chip"><Clock3 size={13} aria-hidden="true" />Under review</span>
                  </div>
                  <strong className="pv-card-name">{p.propertyName}</strong>
                  <span className="pv-card-meta">
                    {optionLabel(PROPERTY_TYPES, p.propertyType)}
                    <span aria-hidden="true">·</span>
                    <MapPin size={13} aria-hidden="true" />{p.city}
                  </span>
                  <span className="pv-card-meta">{optionLabel(ROOM_RANGES, p.rooms)}</span>
                  <div className="pv-card-foot">
                    <span><CalendarDays size={13} aria-hidden="true" />{submittedOn(p.createdAt)}</span>
                    <span className="ref-code">{p.reference}</span>
                  </div>
                </li>
              ))}
            </ul>
          ))}
        </section>

        <aside className="pv-guide" aria-labelledby="pv-guide-title">
          <h2 id="pv-guide-title" className="pv-guide-title">From request to live</h2>
          <ol className="pv-steps">
            {STEPS.map(({ Icon, title, text }, i) => (
              <li key={title}>
                <span className="pv-step-icon"><Icon size={16} aria-hidden="true" /></span>
                <div>
                  <strong><span className="sr-only">Step {i + 1}: </span>{title}</strong>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </PartnerShell>
  );
}
