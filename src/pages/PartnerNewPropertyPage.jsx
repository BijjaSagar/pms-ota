// "Add a property" (/list-property/new), two steps:
//   1. PropertyTypePicker — what are you listing? (no ?type in the URL)
//   2. PropertyInfoPage — property details, with the chosen type pre-filled (?type=resort)
// Keeping the type in the URL means refresh and the browser Back button behave as expected.
// Which types exist is decided by the API, not by a list in this app.
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { AuthLoading } from '../components/auth/RequireAuth.jsx';
import { PartnerShell } from '../components/partner/PartnerShell.jsx';
import { PropertyInfoPage } from '../components/partner/PropertyInfoPage.jsx';
import { PropertyTypePicker } from '../components/partner/PropertyTypePicker.jsx';
import { PARTNER_PATHS } from '../components/partner/paths.js';
import { usePropertyTypes } from '../lib/api/propertyTypes.js';
import '../styles/account.css';
import '../styles/partner.css';

// Opened by link or refresh: check the URL's type with the API before showing the form (else back to the picker).
function CheckedType({ type, picker, children }) {
  const { categories, loading, error, reload } = usePropertyTypes();
  if (loading) return <AuthLoading label="Loading property details…" />;
  if (error) {
    return (
      <div className="inline-error" role="alert">
        <span>{error}</span>
        <button type="button" className="pill-btn" onClick={reload}><RefreshCw size={13} aria-hidden="true" />Try again</button>
      </div>
    );
  }
  return categories.some((c) => c.types.some((t) => t.code === type)) ? children : picker;
}

export default function PartnerNewPropertyPage() {
  const [params, setParams] = useSearchParams();
  const type = params.get('type') || '';
  const [picked, setPicked] = useState(''); // just chosen from the API's list: no need to check it again

  const picker = (
    // ?from=<type> (set by "Change type") keeps the previous choice selected in the picker.
    <PropertyTypePicker cancelTo={PARTNER_PATHS.properties} initialType={params.get('from') || ''}
      onContinue={(code) => { setPicked(code); setParams({ type: code }); }} />
  );
  const form = <PropertyInfoPage key={type} type={type} />;

  return (
    <PartnerShell title="Add a property">
      {!type ? picker
        : type === picked ? form
          : <CheckedType key={type} type={type} picker={picker}>{form}</CheckedType>}
    </PartnerShell>
  );
}
