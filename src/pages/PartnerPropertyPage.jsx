// One property (/list-property/properties/:propertyId), opened from the booking summary.
// ?view= picks the section. Sections are placeholders for now; build each one in place of "Coming soon".
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Hammer, Info } from 'lucide-react';
import { PartnerShell } from '../components/partner/PartnerShell.jsx';
import { PropertyBookings } from '../components/partner/PropertyBookings.jsx';
import { PropertyRatesInventory } from '../components/partner/PropertyRatesInventory.jsx';
import { PropertyRatingsReviews } from '../components/partner/PropertyRatingsReviews.jsx';
import { PropertyAnalytics } from '../components/partner/PropertyAnalytics.jsx';
import { PARTNER_PATHS } from '../components/partner/paths.js';
import { AuthLoading } from '../components/auth/RequireAuth.jsx';
import { listProperties } from '../lib/api/properties.js';
import '../styles/partner.css';
import '../styles/partner-properties.css';

const VIEWS = [
  { key: 'overview', label: 'Overview' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'rates-inventory', label: 'Rates & Inventory' },
  { key: 'check-ins', label: 'Check-ins' },
  { key: 'staying', label: 'Staying' },
  { key: 'check-outs', label: 'Check-outs' },
  { key: 'earnings', label: 'Earnings' },
  { key: 'reviews', label: 'Ratings & Reviews' },
  { key: 'analytics', label: 'Analytics' },
];

function PropertyDetails() {
  const { propertyId } = useParams();
  const [params] = useSearchParams();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    listProperties()
      .then((found) => { if (active) setItems(found); })
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
      {view.key === 'bookings' ? (
        <PropertyBookings property={property} />
      ) : view.key === 'rates-inventory' ? (
        <PropertyRatesInventory property={property} />
      ) : view.key === 'reviews' ? (
        <PropertyRatingsReviews property={property} />
      ) : view.key === 'analytics' ? (
        <PropertyAnalytics property={property} />
      ) : (
        <section className="pp-soon" aria-labelledby="pd-soon-title">
          <span className="pp-soon-icon"><Hammer size={28} aria-hidden="true" /></span>
          <h2 id="pd-soon-title" className="pp-soon-title">{view.label}: coming soon</h2>
        </section>
      )}
    </>
  );
}

export default function PartnerPropertyPage() {
  return <PartnerShell title="Property"><PropertyDetails /></PartnerShell>;
}
