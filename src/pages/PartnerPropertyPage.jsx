// One property (/list-property/properties/:propertyId), opened from the booking summary.
// ?view= picks the section. Sections are placeholders for now; build each one in place of "Coming soon".
import { useEffect, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Hammer, Info } from 'lucide-react';
import { PartnerShell } from '../components/partner/PartnerShell.jsx';
import { PropertyBookings } from '../components/partner/PropertyBookings.jsx';
import { PropertyRatesInventory } from '../components/partner/PropertyRatesInventory.jsx';
import { PropertyRatingsReviews } from '../components/partner/PropertyRatingsReviews.jsx';
import { PropertyAnalytics } from '../components/partner/PropertyAnalytics.jsx';
import { CURRENT_PROPERTY, PARTNER_PATHS, currentPropertyId, rememberProperty } from '../components/partner/paths.js';
import { AuthLoading } from '../components/auth/RequireAuth.jsx';
import { cachedProperties, listProperties } from '../lib/api/properties.js';
import { useAuth } from '../lib/context/useAuth.js';
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
  const { user } = useAuth();
  const account = user?.id;
  // Cached list shows at once when switching modules; the request below refreshes it quietly.
  const [items, setItems] = useState(() => cachedProperties(account));
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    listProperties(account)
      .then((found) => { if (active) { setItems(found); setError(''); } })
      .catch((problem) => { if (active) setError(problem.message); });
    return () => { active = false; };
  }, [account]);

  const property = items?.find((p) => p.id === propertyId);
  useEffect(() => { if (property) rememberProperty(property.id); }, [property]);

  const back = <Link to={PARTNER_PATHS.properties} className="pp-back"><ArrowLeft size={16} aria-hidden="true" />Your properties</Link>;
  if (error && !items) return <>{back}<div className="pi-notice is-error" role="alert"><Info size={18} aria-hidden="true" /><span>{error}</span></div></>;
  if (!items) return <AuthLoading label="Loading property…" />;

  if (!property) {
    // Placeholder id (opened from Payments / More before any property) or a property that is gone: open the first one.
    const fallback = items[0];
    if (fallback && (propertyId === CURRENT_PROPERTY || propertyId === currentPropertyId())) {
      return <Navigate replace to={`${PARTNER_PATHS.properties}/${encodeURIComponent(fallback.id)}?${params}`} />;
    }
    return (
      <>{back}<div className="pv-empty">
        <h1 className="pv-empty-title">{items.length ? 'Property not found' : 'No properties yet'}</h1>
      </div></>
    );
  }

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
