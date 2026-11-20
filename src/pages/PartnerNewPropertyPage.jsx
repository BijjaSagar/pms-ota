// "Add a property" (/list-property/new), two steps:
//   1. PropertyTypePicker — what are you listing? (no ?type in the URL)
//   2. PropertyInfoPage — property details, with the chosen type pre-filled (?type=resort)
// Keeping the type in the URL means refresh and the browser Back button behave as expected.
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PartnerShell } from '../components/partner/PartnerShell.jsx';
import { PropertyInfoPage } from '../components/partner/PropertyInfoPage.jsx';
import { PropertyTypePicker } from '../components/partner/PropertyTypePicker.jsx';
import { PARTNER_PATHS } from '../components/partner/paths.js';
import { propertyTypeById } from '../lib/data/partner.js';
import '../styles/partner.css';

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
          <PropertyInfoPage key={type} type={type} typeLabel={chosen[1]} />
        </>
      )}
    </PartnerShell>
  );
}
