// "Add a property" (/list-property/new), two steps:
//   1. PropertyTypePicker — what are you listing? (no ?type in the URL)
//   2. ListingRequestForm — details, with the chosen type pre-filled (?type=resort)
// Keeping the type in the URL means refresh and the browser Back button behave as expected.
// Once submitted, the request appears under Your properties -> Under review.
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Hammer } from 'lucide-react';
import { ListingRequestForm } from '../components/partner/ListingRequestForm.jsx';
import { PartnerShell } from '../components/partner/PartnerShell.jsx';
import { PropertyTypePicker } from '../components/partner/PropertyTypePicker.jsx';
import { IN_PROGRESS_TAB, PARTNER_PATHS, propertiesTab } from '../components/partner/paths.js';
import { propertyTypeById } from '../lib/data/partner.js';
import '../styles/partner.css';

// Step 2 (property details) is being rebuilt — until then it shows "Coming soon".
// Flip to true to bring back the ListingRequestForm below; nothing else needs to change.
const DETAILS_STEP_READY = false;

export default function PartnerNewPropertyPage() {
  const [params, setParams] = useSearchParams();
  const chosen = propertyTypeById(params.get('type') || ''); // ignores unknown / empty values
  const type = chosen?.[0] ? chosen[0] : '';

  return (
    <PartnerShell title="Add a property">
      <Link to={PARTNER_PATHS.properties} className="pp-back"><ArrowLeft size={16} aria-hidden="true" />Your properties</Link>

      {!type ? (
        // ?from=<type> (set by "Change type") keeps the previous choice selected in the picker.
        <PropertyTypePicker cancelTo={PARTNER_PATHS.properties} initialType={propertyTypeById(params.get('from') || '')?.[0] ?? ''}
          onContinue={(t) => setParams({ type: t })} />
      ) : (
        <>
          <p className="ptp-step">Step 2 of 2 · Property details</p>
          <div className="pp-head">
            <h1 className="pp-title">Add a property</h1>
          </div>
          <p className="ptp-chosen">
            Listing a <strong>{chosen[1]}</strong>
            <button type="button" className="auth-link" onClick={() => setParams({ from: type })}>Change type</button>
          </p>
          {DETAILS_STEP_READY ? (
            <div className="card pp-form-card">
              {/* key: switching type remounts the form with the new pre-filled type */}
              <ListingRequestForm key={type} initialType={type}
                doneLink={{ to: propertiesTab(IN_PROGRESS_TAB), label: 'See requests under review' }} />
            </div>
          ) : (
            <section className="pp-soon" aria-labelledby="pp-soon-title">
              <span className="pp-soon-icon"><Hammer size={28} aria-hidden="true" /></span>
              <h2 id="pp-soon-title" className="pp-soon-title">Coming soon</h2>
            </section>
          )}
        </>
      )}
    </PartnerShell>
  );
}
