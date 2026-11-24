// "Add a property" (/list-property/new), two steps:
//   1. PropertyTypePicker — what are you listing? Continue creates a draft on the server.
//   2. PropertyInfoPage — the wizard for that draft (?property=<id>), loaded from the server, so refresh,
//      Back and other devices all continue where the partner stopped.
// Which types exist is decided by the API. ?type=resort (old links) only preselects one in the picker.
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthLoading } from '../components/auth/RequireAuth.jsx';
import { PartnerShell } from '../components/partner/PartnerShell.jsx';
import { PropertyInfoPage } from '../components/partner/PropertyInfoPage.jsx';
import { PropertyTypePicker } from '../components/partner/PropertyTypePicker.jsx';
import { PARTNER_PATHS } from '../components/partner/paths.js';
import { createProperty, getProperty, loadMasters } from '../lib/api/properties.js';
import { STATUS_INFO } from '../lib/data/propertyStatus.js';
import '../styles/partner.css';

function NewProperty({ initialType, onCreated }) {
  const [error, setError] = useState('');
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const onContinue = async (type) => {
    setError('');
    try {
      const property = await createProperty(type);
      if (mounted.current) onCreated(property.id); // left the page meanwhile: don't pull them back
    } catch (problem) {
      if (mounted.current) setError(problem.message);
    }
  };
  return <PropertyTypePicker cancelTo={PARTNER_PATHS.properties} initialType={initialType} onContinue={onContinue} error={error} />;
}

function Message({ title, text, children }) {
  return (
    <div className="pv-empty">
      <h1 className="pv-empty-title">{title}</h1>
      <p className="muted-sm">{text}</p>
      <div className="pv-empty-actions">
        {children}
        <Link to={PARTNER_PATHS.properties} className="btn btn-light">Back to Your properties</Link>
      </div>
    </div>
  );
}

function ExistingProperty({ id }) {
  const [property, setProperty] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setError(null);
    Promise.all([getProperty(encodeURIComponent(id)), loadMasters()])
      .then(([found]) => { if (active) setProperty(found); })
      .catch((problem) => { if (active) setError(problem); });
    return () => { active = false; };
  }, [id, attempt]);

  if (error) {
    const missing = error.status === 404 || error.status === 400;
    return (
      <Message title={missing ? 'Property not found' : 'We could not load this property'}
        text={missing ? 'It may have been deleted, or it belongs to another account.' : error.message}>
        {!missing && <button type="button" className="btn btn-primary" onClick={() => setAttempt((n) => n + 1)}>Try again</button>}
      </Message>
    );
  }
  if (!property) return <AuthLoading label="Loading your property…" />;
  if (!property.editable) {
    const status = STATUS_INFO[property.status];
    return (
      <Message title={`${property.basic.propertyName ?? property.typeLabel} · ${status?.label ?? property.status}`}
        text={property.reviewNote || `${status?.hint ?? ''} Reference ${property.reference}.`} />
    );
  }
  return <PropertyInfoPage property={property} onPropertyChange={setProperty} />;
}

export default function PartnerNewPropertyPage() {
  const [params, setParams] = useSearchParams();
  const id = params.get('property') || '';
  return (
    <PartnerShell title="Add a property">
      {id
        ? <ExistingProperty key={id} id={id} />
        : <NewProperty initialType={params.get('type') || params.get('from') || ''} onCreated={(created) => setParams({ property: created })} />}
    </PartnerShell>
  );
}
