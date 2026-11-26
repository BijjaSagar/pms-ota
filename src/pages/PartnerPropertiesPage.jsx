// Partner Hub home: "Your properties" (/list-property/properties), from the API.
// Active (approved properties, from the API) | In progress (drafts, changes needed) with a "From request to live" guide.
// A submitted property is approved at once (until the super admin module exists), so it moves straight to Active.
// ?tab=active | in-progress. Without it, Active is shown unless only in-progress properties exist.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, CalendarDays, CheckCircle2, ClipboardCheck, Clock3, Info, MapPin, Plus, Rocket, Send, Trash2 } from 'lucide-react';
import { BookingSummary } from '../components/partner/BookingSummary.jsx';
import { PartnerShell } from '../components/partner/PartnerShell.jsx';
import { PrivateImage } from '../components/partner/PrivateImage.jsx';
import { PropertyIcon } from '../components/partner/PropertyIcons.jsx';
import { AuthLoading } from '../components/auth/RequireAuth.jsx';
import { IN_PROGRESS_TAB, PARTNER_PATHS, propertyPath } from '../components/partner/paths.js';
import { deleteProperty, listProperties } from '../lib/api/properties.js';
import { PROPERTY_INFO_SECTIONS } from '../lib/data/partner.js';
import { STATUS_INFO } from '../lib/data/propertyStatus.js';
import { nameOf } from '../lib/utils/propertySummary.js';
import '../styles/partner.css';
import '../styles/partner-properties.css';

const ACTIVE = 'active';

// Statuses of each view, in display order.
const GROUPS = {
  [ACTIVE]: ['LIVE', 'SUSPENDED'],
  [IN_PROGRESS_TAB]: ['CHANGES_REQUESTED', 'DRAFT', 'REJECTED'],
};
const VIEWS = [
  { key: ACTIVE, label: 'Active' },
  { key: IN_PROGRESS_TAB, label: 'In progress' },
];
const EMPTY = {
  [ACTIVE]: { Icon: CheckCircle2, title: 'No active properties yet', text: 'Once you submit a property, it appears here with its bookings and earnings.' },
  [IN_PROGRESS_TAB]: { Icon: ClipboardCheck, title: 'Nothing in progress', text: 'Drafts and properties that still need details appear here.' },
};
const STEPS = [
  { Icon: Plus, title: 'Add your property', text: 'Pick the type and fill in the details.' },
  { Icon: Send, title: 'Submit it', text: 'Complete every step and submit your property.' },
  { Icon: Rocket, title: 'Go live', text: 'It is approved right away, and guests can find and book it on TriponX.' },
];

const dateOf = (iso) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));

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
      <div className="pv-empty-actions">{children}</div>
    </div>
  );
}

function PropertyCard({ property: p, deleting, onDelete }) {
  const status = STATUS_INFO[p.status] ?? { label: p.status, tone: 'wait' };
  return (
    <li className="pv-card">
      {p.coverUrl && <PrivateImage path={p.coverUrl} alt="" className="pv-card-cover" />}
      <div className="pv-card-top">
        <span className="pv-card-art"><PropertyIcon type={p.type} size={34} /></span>
        <span className={`pv-chip is-${status.tone}`}>
          {status.tone === 'good' ? <CheckCircle2 size={13} aria-hidden="true" /> : <Clock3 size={13} aria-hidden="true" />}{status.label}
        </span>
      </div>
      <strong className="pv-card-name">{nameOf(p)}</strong>
      <span className="pv-card-meta">
        {p.typeLabel}
        {p.city && <><span aria-hidden="true">·</span><MapPin size={13} aria-hidden="true" />{p.city}</>}
      </span>
      <span className="pv-card-meta">
        {p.editable
          ? `${p.completedSections.length} of ${PROPERTY_INFO_SECTIONS.length} steps complete`
          : `${p.totalRooms} room${p.totalRooms === 1 ? '' : 's'}`}
      </span>
      {p.reviewNote && <p className="pv-card-note"><Info size={14} aria-hidden="true" />{p.reviewNote}</p>}
      {p.editable && (
        <div className="pv-card-actions">
          <Link to={propertyPath(p.id)} className="btn btn-primary">Continue<ArrowRight size={15} aria-hidden="true" /></Link>
          {p.status === 'DRAFT' && (
            <button type="button" className="btn btn-light" onClick={() => onDelete(p)} disabled={deleting} aria-label={`Delete draft ${p.reference}`}>
              <Trash2 size={15} aria-hidden="true" />{deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
        </div>
      )}
      <div className="pv-card-foot">
        <span><CalendarDays size={13} aria-hidden="true" />{dateOf(p.submittedAt ?? p.createdAt)}</span>
        <span className="ref-code">{p.reference}</span>
      </div>
    </li>
  );
}

function Properties() {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState('');
  const latest = useRef(0); // only the newest request may update the screen

  const load = useCallback(async () => {
    const request = ++latest.current;
    setError('');
    try {
      const found = await listProperties();
      if (request === latest.current) setItems(found);
    } catch (problem) {
      if (request === latest.current) setError(problem.message);
    }
  }, []);
  useEffect(() => {
    load();
    return () => { latest.current += 1; };
  }, [load]);

  const inGroup = (key) => (items ?? []).filter((p) => GROUPS[key].includes(p.status));
  const asked = params.get('tab');
  const fallback = !inGroup(ACTIVE).length && inGroup(IN_PROGRESS_TAB).length ? IN_PROGRESS_TAB : ACTIVE;
  const view = Object.hasOwn(GROUPS, asked ?? '') ? asked : fallback;
  const shown = inGroup(view).sort((a, b) => GROUPS[view].indexOf(a.status) - GROUPS[view].indexOf(b.status));
  const showSummary = view === ACTIVE && shown.length > 0;

  const onDelete = async (property) => {
    const name = property.propertyName ?? `this ${property.typeLabel.toLowerCase()} draft`;
    if (!window.confirm(`Delete ${name}? Everything saved in it, with its photos and documents, will be removed.`)) return;
    setDeleting(property.id);
    setError('');
    try {
      await deleteProperty(property.id);
      setItems((current) => current.filter((p) => p.id !== property.id));
    } catch (problem) {
      setError(problem.message);
    } finally {
      setDeleting('');
    }
  };

  return (
    <>
      <header className="pv-head">
        <div>
          <h1 className="pp-title">Your properties</h1>
          <p className="muted-sm pv-sub">Track bookings, finish pending listings and add new places.</p>
        </div>
        <AddButton className="pv-head-cta" />
      </header>

      <div className="pv-switch" role="group" aria-label="Show properties">
        {VIEWS.map(({ key, label }) => (
          <button key={key} type="button" aria-pressed={view === key} className={view === key ? 'is-on' : ''}
            onClick={() => setParams({ tab: key }, { replace: true })}>
            {label}<span className="pv-switch-count">{items ? inGroup(key).length : '–'}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="pi-notice is-error" role="alert">
          <Info size={18} aria-hidden="true" /><span>{error}</span>
          {!items && <button type="button" className="btn btn-light" onClick={load}>Try again</button>}
        </div>
      )}

      {showSummary ? (
        <BookingSummary properties={shown} />
      ) : (
        <div className="pv-layout">
          <section className="pv-panel" aria-label={view === ACTIVE ? 'Active properties' : 'Properties in progress'}>
            {!items && !error && <AuthLoading label="Loading your properties…" />}
            {items && shown.length === 0 && <Empty {...EMPTY[view]}><AddButton className="pv-add-block" /></Empty>}
            {shown.length > 0 && (
              <ul className="pv-grid">
                {shown.map((p) => <PropertyCard key={p.id} property={p} deleting={deleting === p.id} onDelete={onDelete} />)}
              </ul>
            )}
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
      )}
    </>
  );
}

export default function PartnerPropertiesPage() {
  return <PartnerShell title="Your properties"><Properties /></PartnerShell>;
}
