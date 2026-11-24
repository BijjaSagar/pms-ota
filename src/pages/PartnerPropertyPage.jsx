// One property (/list-property/properties/:propertyId), opened from the booking summary.
// ?view= picks the section. Sections are placeholders for now; build each one in place of "Coming soon".
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Hammer, Info, MapPin } from 'lucide-react';
import { PartnerShell } from '../components/partner/PartnerShell.jsx';
import { PARTNER_PATHS } from '../components/partner/paths.js';
import { AuthLoading } from '../components/auth/RequireAuth.jsx';
import { listProperties } from '../lib/api/properties.js';
import { withSamples } from '../lib/data/sampleProperties.js';
import { nameOf } from '../lib/utils/propertySummary.js';
import '../styles/partner.css';
import '../styles/partner-properties.css';

const VIEWS = [
  { key: 'overview', label: 'Overview' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'check-ins', label: 'Check-ins' },
  { key: 'staying', label: 'Staying' },
  { key: 'check-outs', label: 'Check-outs' },
  { key: 'earnings', label: 'Earnings' },
  { key: 'reviews', label: 'Reviews' },
];

function PropertyDetails() {
  const { propertyId } = useParams();
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    listProperties()
      .then((found) => { if (active) setItems(withSamples(found)); })
      .catch((problem) => { if (active) setError(problem.message); });
    return () => { active = false; };
  }, []);

  const back = <Link to={PARTNER_PATHS.properties} className="pp-back"><ArrowLeft size={16} aria-hidden="true" />Your properties</Link>;
  if (error) return <>{back}<div className="pi-notice is-error" role="alert"><Info size={18} aria-hidden="true" /><span>{error}</span></div></>;
  if (!items) return <AuthLoading label="Loading property…" />;

  const property = items.find((p) => p.id === propertyId);
  if (!property) return <>{back}<div className="pv-empty"><h1 className="pv-empty-title">Property not found</h1></div></>;

  const view = VIEWS.find((v) => v.key === params.get('view')) ?? VIEWS[0];
  return (
    <>
      {back}
      <h1 className="pp-title">{nameOf(property)}</h1>
      <p className="pv-card-meta bs-page-meta">
        {property.typeLabel}
        {property.city && <><span aria-hidden="true">·</span><MapPin size={13} aria-hidden="true" />{property.city}</>}
        <span className="ref-code">{property.reference}</span>
        {property.isSample && <span className="bs-sample">Sample data</span>}
      </p>
      <div className="bs-tabs" role="group" aria-label="Property sections">
        {VIEWS.map(({ key, label }) => (
          <button key={key} type="button" aria-pressed={key === view.key} className={`bs-control ${key === view.key ? 'is-on' : ''}`}
            onClick={() => setParams({ view: key }, { replace: true })}>{label}</button>
        ))}
      </div>
      <section className="pp-soon" aria-labelledby="pd-soon-title">
        <span className="pp-soon-icon"><Hammer size={28} aria-hidden="true" /></span>
        <h2 id="pd-soon-title" className="pp-soon-title">{view.label}: coming soon</h2>
      </section>
    </>
  );
}

export default function PartnerPropertyPage() {
  return <PartnerShell title="Property"><PropertyDetails /></PartnerShell>;
}
