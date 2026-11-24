// Partner Hub home: "Your properties" (/list-property/properties), from the API.
// Status cards (Live / Under review / Drafts) filter the grid; a "From request to live" guide sits beside it.
// ?tab=live | in-progress | drafts. Without it, the first group that has something is shown.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, CalendarDays, CheckCircle2, ClipboardCheck, Clock3, FilePenLine, Info, MapPin, Plus, Rocket, Search, Trash2 } from 'lucide-react';
import { PartnerShell } from '../components/partner/PartnerShell.jsx';
import { PrivateImage } from '../components/partner/PrivateImage.jsx';
import { PropertyIcon } from '../components/partner/PropertyIcons.jsx';
import { AuthLoading } from '../components/auth/RequireAuth.jsx';
import { IN_PROGRESS_TAB, PARTNER_PATHS, propertyPath } from '../components/partner/paths.js';
import { deleteProperty, listProperties } from '../lib/api/properties.js';
import { PROPERTY_INFO_SECTIONS } from '../lib/data/partner.js';
import { STATUS_INFO } from '../lib/data/propertyStatus.js';
import '../styles/partner.css';

const LIVE = 'live';
const REVIEW = IN_PROGRESS_TAB;
const DRAFTS = 'drafts';

const GROUPS = {
  [LIVE]: ['LIVE', 'SUSPENDED'],
  [REVIEW]: ['UNDER_REVIEW'],
  [DRAFTS]: ['DRAFT', 'CHANGES_REQUESTED', 'REJECTED'],
};
const CARDS = [
  { key: LIVE, label: 'Live', hint: 'Approved by our team', Icon: CheckCircle2 },
  { key: REVIEW, label: 'Under review', hint: 'Being checked by our team', Icon: Clock3 },
  { key: DRAFTS, label: 'Drafts', hint: 'Finish and submit', Icon: FilePenLine },
];
const EMPTY = {
  [LIVE]: { Icon: CheckCircle2, title: 'Nothing live yet', text: 'Once a property is approved it appears here.' },
  [REVIEW]: { Icon: ClipboardCheck, title: 'Nothing under review', text: 'Submit a property and it will wait here while our team checks it.' },
  [DRAFTS]: { Icon: FilePenLine, title: 'No drafts', text: 'Properties you have started but not submitted appear here.' },
};
const STEPS = [
  { Icon: Plus, title: 'Add your property', text: 'Pick the type and fill in the details.' },
  { Icon: Search, title: 'We review it', text: 'Our team checks the details, usually within 48 hours.' },
  { Icon: Rocket, title: 'Go live', text: 'Guests can find and book it on TriponX.' },
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
      <strong className="pv-card-name">{p.propertyName ?? `New ${p.typeLabel.toLowerCase()}`}</strong>
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
  const view = Object.hasOwn(GROUPS, asked ?? '') ? asked : [LIVE, REVIEW, DRAFTS].find((key) => inGroup(key).length) ?? LIVE;
  const shown = inGroup(view);

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
          <p className="muted-sm pv-sub">Add new places and follow each one from draft to live.</p>
        </div>
        <AddButton className="pv-head-cta" />
      </header>

      <div className="pv-stats pv-stats-3" role="tablist" aria-label="Filter properties">
        {CARDS.map(({ key, label, hint, Icon }) => (
          <button key={key} type="button" role="tab" id={`pv-tab-${key}`} aria-selected={view === key} aria-controls="pv-panel"
            className={`pv-stat pv-stat-${key} ${view === key ? 'is-on' : ''}`} onClick={() => setParams({ tab: key }, { replace: true })}>
            <span className="pv-stat-top">
              <span className="pv-stat-icon"><Icon size={18} aria-hidden="true" /></span>
              <span className="pv-stat-count">{items ? inGroup(key).length : '–'}</span>
            </span>
            <span className="pv-stat-label">{label}</span>
            <span className="pv-stat-hint">{hint}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="pi-notice is-error" role="alert">
          <Info size={18} aria-hidden="true" /><span>{error}</span>
          {!items && <button type="button" className="btn btn-light" onClick={load}>Try again</button>}
        </div>
      )}

      <div className="pv-layout">
        <section id="pv-panel" role="tabpanel" aria-labelledby={`pv-tab-${view}`} className="pv-panel">
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
    </>
  );
}

export default function PartnerPropertiesPage() {
  return <PartnerShell title="Your properties"><Properties /></PartnerShell>;
}
