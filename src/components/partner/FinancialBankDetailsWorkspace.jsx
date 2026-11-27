import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  CircleAlert,
  FileText,
  Landmark,
  LockKeyhole,
  Save,
  Trash2,
} from 'lucide-react';
import {
  DOCUMENT_ACCEPT,
  IMAGE_MAX_BYTES,
  deleteDocument,
  formErrors,
  getProperty,
  loadFile,
  saveLegal,
  uploadDocument,
} from '../../lib/api/properties.js';
import {
  COMPANY_TYPE_OPTIONS,
  DOCUMENT_TYPES,
  FIELD_LABELS,
  FINANCIAL_PHASES,
  MSME_CATEGORY_OPTIONS,
  loadFinancialDraft,
  maskSensitive,
  maskedValue,
  normalizeFinancialForm,
  phaseCompletion,
  saveFinancialDraft,
  toLegalApiPayload,
  validateFinancialPhase,
} from '../../lib/data/financialBankDetails.js';
import '../../styles/partner-financial-bank-details.css';

function Field({ label, error, hint, full, children }) {
  return (
    <label className={`fbd-field ${full ? 'is-full' : ''} ${error ? 'has-error' : ''}`}>
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
      {error ? <small className="fbd-field-error" role="alert">{error}</small> : null}
    </label>
  );
}

function YesNo({ value, onChange }) {
  return (
    <div className="fbd-yesno" role="group">
      {[['yes', 'Yes'], ['no', 'No']].map(([option, label]) => (
        <button
          type="button"
          key={option}
          className={value === option ? 'is-selected' : ''}
          aria-pressed={value === option}
          onClick={() => onChange(option)}
        >
          {value === option ? <Check size={12} aria-hidden="true" /> : null}
          {label}
        </button>
      ))}
    </div>
  );
}

function DocumentRow({ label, hint, document, busy, onPick, onOpen, onRemove }) {
  const inputRef = useRef(null);
  return (
    <div className="fbd-document-row">
      <span className="fbd-document-icon"><FileText size={17} aria-hidden="true" /></span>
      <div className="fbd-document-meta"><strong>{label}</strong><small>{busy ? 'Working…' : document ? document.name : hint}</small></div>
      <input
        ref={inputRef}
        type="file"
        accept={DOCUMENT_ACCEPT}
        className="fbd-sr-only"
        aria-label={`Choose ${label}`}
        tabIndex={-1}
        onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) onPick(file); }}
      />
      {document ? <button type="button" className="fbd-btn is-light" onClick={onOpen} disabled={busy}>Open</button> : null}
      <button type="button" className="fbd-btn is-light" onClick={() => inputRef.current?.click()} disabled={busy}>{document ? 'Replace' : 'Upload'}</button>
      {document ? (
        <button type="button" className="fbd-icon-btn is-danger" onClick={onRemove} disabled={busy} aria-label={`Remove ${label}`}><Trash2 size={14} aria-hidden="true" /></button>
      ) : null}
    </div>
  );
}

export default function FinancialBankDetailsWorkspace({ property }) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [form, setForm] = useState(() => normalizeFinancialForm(property.legal, loadFinancialDraft(property.id)));
  const [legal, setLegal] = useState(() => property.legal ?? {});
  const [documents, setDocuments] = useState(() => (Array.isArray(property.documents) ? property.documents : []));
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busyDocument, setBusyDocument] = useState('');
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState('');

  useEffect(() => {
    if (!property.id) {
      setDetailLoading(false);
      return undefined;
    }
    let active = true;
    setDetailLoading(true);
    setDetailError('');
    getProperty(property.id)
      .then((next) => {
        if (!active) return;
        const detailLegal = next?.legal && typeof next.legal === 'object' ? next.legal : {};
        setLegal(detailLegal);
        setDocuments(Array.isArray(next?.documents) ? next.documents : []);
        setForm((current) => {
          const normalized = normalizeFinancialForm(detailLegal, current);
          saveFinancialDraft(property.id, normalized);
          return normalized;
        });
      })
      .catch((problem) => {
        if (active) setDetailError(problem?.message || 'Saved details could not be loaded.');
      })
      .finally(() => { if (active) setDetailLoading(false); });
    return () => { active = false; };
  }, [property.id]);

  const phase = FINANCIAL_PHASES[phaseIndex];
  const completion = phaseCompletion(form);

  const updateForm = (patch) => {
    setForm((current) => {
      const next = typeof patch === 'function' ? patch(current) : { ...current, ...patch };
      saveFinancialDraft(property.id, next);
      return next;
    });
  };

  const setField = (key, value) => {
    updateForm({ [key]: value });
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setStatus(null);
  };

  const goToPhase = (index, clearStatus = true) => {
    setPhaseIndex(index);
    setErrors({});
    if (clearStatus) setStatus(null);
  };

  const savePhase = async () => {
    const phasesToValidate = phase.id === 'review' ? FINANCIAL_PHASES.map((item) => item.id) : [phase.id];
    const found = Object.assign({}, ...phasesToValidate.map((id) => validateFinancialPhase(id, form)));
    if (Object.keys(found).length) {
      if (phase.id === 'review') {
        const firstInvalidIndex = FINANCIAL_PHASES.findIndex((item) => Object.keys(validateFinancialPhase(item.id, form)).length);
        if (firstInvalidIndex >= 0 && firstInvalidIndex !== phaseIndex) goToPhase(firstInvalidIndex, false);
      }
      setErrors(found);
      setStatus({ type: 'error', message: phase.id === 'review' ? 'Complete the highlighted phases before confirming.' : 'Complete the highlighted fields before continuing.' });
      return;
    }
    setErrors({});
    setSaving(true);
    setStatus(null);
    try {
      const payload = toLegalApiPayload(form);
      const nextProperty = await saveLegal(property.id, payload);
      if (nextProperty?.legal) setLegal((current) => ({ ...current, ...nextProperty.legal }));
      updateForm((current) => ({
        ...current,
        declaration: phase.id === 'review' ? true : current.declaration,
        saved: {
          pan: Boolean(payload.pan) || current.saved.pan,
          gstin: Boolean(payload.gstin) || current.saved.gstin,
          account: Boolean(payload.accountNumber) || current.saved.account,
        },
      }));
      setStatus({ type: 'success', message: phase.id === 'review' ? 'Financial & bank details confirmed.' : `${phase.title} saved.` });
      if (phaseIndex < FINANCIAL_PHASES.length - 1) goToPhase(phaseIndex + 1, false);
    } catch (problem) {
      const foundErrors = formErrors(problem, FIELD_LABELS);
      if (Object.keys(foundErrors).length) setErrors(foundErrors);
      setStatus({ type: 'error', message: problem?.message || 'Could not save these details. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = () => {
    saveFinancialDraft(property.id, form);
    setStatus({ type: 'success', message: 'Draft saved in this browser session.' });
  };

  const pickDocument = async (type, file) => {
    if (file.size > IMAGE_MAX_BYTES) {
      setStatus({ type: 'error', message: 'The document must be 10 MB or smaller.' });
      return;
    }
    setBusyDocument(type);
    setStatus(null);
    try {
      const nextProperty = await uploadDocument(property.id, type, file);
      if (Array.isArray(nextProperty?.documents)) setDocuments(nextProperty.documents);
      setStatus({ type: 'success', message: 'Document uploaded privately.' });
    } catch (problem) {
      setStatus({ type: 'error', message: problem?.message || 'Could not upload the document.' });
    } finally {
      setBusyDocument('');
    }
  };

  const removeDocument = async (type) => {
    setBusyDocument(type);
    setStatus(null);
    try {
      const nextProperty = await deleteDocument(property.id, type);
      if (Array.isArray(nextProperty?.documents)) setDocuments(nextProperty.documents);
      setStatus({ type: 'success', message: 'Document removed.' });
    } catch (problem) {
      setStatus({ type: 'error', message: problem?.message || 'Could not remove the document.' });
    } finally {
      setBusyDocument('');
    }
  };

  const openDocument = async (doc) => {
    setBusyDocument(doc.type);
    try {
      const url = URL.createObjectURL(await loadFile(doc.url));
      const link = window.document.createElement('a');
      link.href = url;
      link.download = doc.name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setStatus({ type: 'error', message: 'This document could not be opened.' });
    } finally {
      setBusyDocument('');
    }
  };

  const documentRows = [
    ...DOCUMENT_TYPES,
    ...(form.hasGst === 'yes' ? [{ type: 'GST_CERTIFICATE', label: 'GST certificate', hint: 'PDF or photo, up to 10 MB' }] : []),
  ];

  const phaseBadge = (item) => {
    if (item.id === 'documents') {
      const uploaded = documentRows.filter((row) => documents.some((doc) => doc.type === row.type)).length;
      return `${uploaded}/${documentRows.length}`;
    }
    if (item.id === 'review') return form.declaration ? 'Done' : '1 left';
    return completion[item.id] ? `${completion[item.id]} left` : 'Done';
  };

  return (
    <div className="fbd-workspace">
      <header className="fbd-head">
        <div>
          <span className="fbd-eyebrow"><LockKeyhole size={13} aria-hidden="true" />Private payout &amp; tax records</span>
          <h2>Financial &amp; Bank Details</h2>
          <p>Complete the numbered phases to prepare payouts, tax reporting and compliance records.</p>
        </div>
        <span className="fbd-privacy"><BadgeCheck size={15} aria-hidden="true" />Visible only to you and TriponX</span>
      </header>

      <nav className="fbd-phases" aria-label="Financial details phases">
        {FINANCIAL_PHASES.map((item, index) => (
          <button
            type="button"
            key={item.id}
            className={`fbd-phase ${index === phaseIndex ? 'is-active' : ''}`}
            onClick={() => goToPhase(index)}
            aria-current={index === phaseIndex ? 'step' : undefined}
          >
            <span className="fbd-phase-name">{item.shortLabel}</span>
            <span className="fbd-phase-count">{phaseBadge(item)}</span>
          </button>
        ))}
      </nav>

      {detailLoading ? <div className="fbd-status is-loading" role="status">Loading saved bank details…</div> : null}
      {detailError ? <div className="fbd-status is-error" role="alert">Saved bank details could not be loaded: {detailError}</div> : null}
      {status ? <div className={`fbd-status is-${status.type}`} role="status">{status.message}</div> : null}

      <div className="fbd-layout">
        <main className="fbd-main">
          <section className="fbd-card">
            <div className="fbd-card-head">
              <span className="fbd-card-icon"><Landmark size={18} aria-hidden="true" /></span>
              <div><h3>{phase.title}</h3><p>{phase.description}</p></div>
              <span className="fbd-step-count">Step {phaseIndex + 1} of {FINANCIAL_PHASES.length}</span>
            </div>

            {phase.id === 'payout' ? (
              <div className="fbd-form-grid">
                <Field label={FIELD_LABELS.accountHolder} error={errors.accountHolder}><input value={form.accountHolder} onChange={(event) => setField('accountHolder', event.target.value)} autoComplete="off" /></Field>
                <Field label={FIELD_LABELS.bankName} error={errors.bankName}><input value={form.bankName} onChange={(event) => setField('bankName', event.target.value)} autoComplete="off" /></Field>
                <Field label={FIELD_LABELS.accountNumber} error={errors.accountNumber} hint={legal.accountLast4 ? `Saved account ends with ${legal.accountLast4}` : ''}><input inputMode="numeric" value={form.accountNumber} onChange={(event) => setField('accountNumber', event.target.value)} autoComplete="off" /></Field>
                <Field label={FIELD_LABELS.confirmAccount} error={errors.confirmAccount}><input inputMode="numeric" value={form.confirmAccount} onChange={(event) => setField('confirmAccount', event.target.value)} autoComplete="off" /></Field>
                <Field label={FIELD_LABELS.ifsc} error={errors.ifsc} full><input value={form.ifsc} onChange={(event) => setField('ifsc', event.target.value.toUpperCase())} maxLength={13} autoComplete="off" placeholder="HDFC0001234" /></Field>
              </div>
            ) : null}

            {phase.id === 'tax' ? (
              <div className="fbd-form-grid">
                <Field label={FIELD_LABELS.legalName} error={errors.legalName} full><input value={form.legalName} onChange={(event) => setField('legalName', event.target.value)} autoComplete="organization" /></Field>
                <Field label={FIELD_LABELS.pan} error={errors.pan} hint={legal.panLast4 ? `Saved PAN ends with ${legal.panLast4}` : ''}><input value={form.pan} onChange={(event) => setField('pan', event.target.value.toUpperCase())} maxLength={12} autoComplete="off" placeholder="AAPFU0939F" /></Field>
                <Field label={FIELD_LABELS.hotelPan} error={errors.hotelPan}><input value={form.hotelPan} onChange={(event) => setField('hotelPan', event.target.value.toUpperCase())} maxLength={12} autoComplete="off" /></Field>
                <Field label={FIELD_LABELS.hasGst} error={errors.hasGst} full><YesNo value={form.hasGst} onChange={(value) => setField('hasGst', value)} /></Field>
                {form.hasGst === 'yes' ? (
                  <>
                    <Field label={FIELD_LABELS.gstin} error={errors.gstin} hint={legal.gstinLast4 ? `Saved GSTIN ends with ${legal.gstinLast4}` : ''}><input value={form.gstin} onChange={(event) => setField('gstin', event.target.value.toUpperCase())} maxLength={18} autoComplete="off" /></Field>
                    <Field label={FIELD_LABELS.gstEntityName} error={errors.gstEntityName}><input value={form.gstEntityName} onChange={(event) => setField('gstEntityName', event.target.value)} autoComplete="organization" /></Field>
                  </>
                ) : null}
              </div>
            ) : null}

            {phase.id === 'compliance' ? (
              <div className="fbd-form-grid">
                <Field label={FIELD_LABELS.hasTan} error={errors.hasTan}><YesNo value={form.hasTan} onChange={(value) => setField('hasTan', value)} /></Field>
                {form.hasTan === 'yes' ? <Field label={FIELD_LABELS.tanNumber} error={errors.tanNumber}><input value={form.tanNumber} onChange={(event) => setField('tanNumber', event.target.value.toUpperCase())} maxLength={10} autoComplete="off" placeholder="ABCD1234E" /></Field> : null}
                <Field label={FIELD_LABELS.msmeRegistered} error={errors.msmeRegistered}><YesNo value={form.msmeRegistered} onChange={(value) => setField('msmeRegistered', value)} /></Field>
                {form.msmeRegistered === 'yes' ? (
                  <>
                    <Field label={FIELD_LABELS.msmeCategory} error={errors.msmeCategory}><select value={form.msmeCategory} onChange={(event) => setField('msmeCategory', event.target.value)}><option value="">Select category</option>{MSME_CATEGORY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></Field>
                    <Field label={FIELD_LABELS.msmeNumber} error={errors.msmeNumber}><input value={form.msmeNumber} onChange={(event) => setField('msmeNumber', event.target.value)} autoComplete="off" /></Field>
                  </>
                ) : null}
                <Field label={FIELD_LABELS.companyRegistered} error={errors.companyRegistered} full><YesNo value={form.companyRegistered} onChange={(value) => setField('companyRegistered', value)} /></Field>
                {form.companyRegistered === 'yes' ? (
                  <>
                    <Field label={FIELD_LABELS.companyType} error={errors.companyType}><select value={form.companyType} onChange={(event) => setField('companyType', event.target.value)}><option value="">Select entity type</option>{COMPANY_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></Field>
                    <Field label={FIELD_LABELS.companyRegistrationNumber} error={errors.companyRegistrationNumber}><input value={form.companyRegistrationNumber} onChange={(event) => setField('companyRegistrationNumber', event.target.value)} autoComplete="off" /></Field>
                    <Field label={FIELD_LABELS.companyRegistrationName} error={errors.companyRegistrationName} full><input value={form.companyRegistrationName} onChange={(event) => setField('companyRegistrationName', event.target.value)} autoComplete="organization" /></Field>
                    <Field label={FIELD_LABELS.registrationDate} error={errors.registrationDate}><input type="date" value={form.registrationDate} onChange={(event) => setField('registrationDate', event.target.value)} /></Field>
                  </>
                ) : null}
              </div>
            ) : null}

            {phase.id === 'documents' ? (
              <div className="fbd-documents">
                <div className="fbd-documents-note"><LockKeyhole size={15} aria-hidden="true" /><span>These files are private and are only used to verify payout and tax information.</span></div>
                {documentRows.map((item) => {
                  const doc = documents.find((entry) => entry.type === item.type);
                  return (
                    <DocumentRow
                      key={item.type}
                      label={item.label}
                      hint={item.hint}
                      document={doc}
                      busy={busyDocument === item.type}
                      onPick={(file) => pickDocument(item.type, file)}
                      onOpen={doc ? () => openDocument(doc) : undefined}
                      onRemove={() => removeDocument(item.type)}
                    />
                  );
                })}
              </div>
            ) : null}

            {phase.id === 'review' ? (
              <div className="fbd-review">
                <div className="fbd-review-group">
                  <button type="button" onClick={() => goToPhase(0)}><span>01</span><strong>Bank &amp; payout</strong><ChevronRight size={15} aria-hidden="true" /></button>
                  <dl>
                    <div><dt>Account holder</dt><dd>{form.accountHolder || '—'}</dd></div>
                    <div><dt>Bank</dt><dd>{form.bankName || '—'}</dd></div>
                    <div><dt>Account</dt><dd>{maskSensitive(form.accountNumber, legal.accountLast4, 'Saved account')}</dd></div>
                    <div><dt>IFSC</dt><dd>{form.ifsc || '—'}</dd></div>
                  </dl>
                </div>
                <div className="fbd-review-group">
                  <button type="button" onClick={() => goToPhase(1)}><span>02</span><strong>PAN &amp; GST</strong><ChevronRight size={15} aria-hidden="true" /></button>
                  <dl>
                    <div><dt>Legal name</dt><dd>{form.legalName || '—'}</dd></div>
                    <div><dt>PAN</dt><dd>{maskSensitive(form.pan, legal.panLast4, 'Saved PAN')}</dd></div>
                    <div><dt>Hotel PAN</dt><dd>{form.hotelPan || 'Not provided'}</dd></div>
                    <div><dt>GST</dt><dd>{form.hasGst === 'yes' ? maskSensitive(form.gstin, legal.gstinLast4, 'Saved GSTIN') : 'Not registered'}</dd></div>
                    <div><dt>GST entity</dt><dd>{form.gstEntityName || '—'}</dd></div>
                  </dl>
                </div>
                <div className="fbd-review-group">
                  <button type="button" onClick={() => goToPhase(2)}><span>03</span><strong>Compliance</strong><ChevronRight size={15} aria-hidden="true" /></button>
                  <dl>
                    <div><dt>TAN</dt><dd>{form.hasTan === 'yes' ? form.tanNumber : 'Not provided'}</dd></div>
                    <div><dt>MSME</dt><dd>{form.msmeRegistered === 'yes' ? `${form.msmeCategory} · ${form.msmeNumber}` : 'Not registered'}</dd></div>
                    <div><dt>Company</dt><dd>{form.companyRegistered === 'yes' ? `${form.companyType} · ${form.companyRegistrationNumber}` : 'Not registered'}</dd></div>
                  </dl>
                </div>
                <label className={`fbd-declaration ${errors.declaration ? 'has-error' : ''}`}>
                  <input type="checkbox" checked={form.declaration} onChange={(event) => setField('declaration', event.target.checked)} />
                  <span>I confirm these details are correct and I am authorised to manage this property’s payouts and tax records.</span>
                </label>
                {errors.declaration ? <p className="fbd-field-error" role="alert">{errors.declaration}</p> : null}
              </div>
            ) : null}

            <div className="fbd-actions">
              <button type="button" className="fbd-btn is-light" onClick={() => goToPhase(Math.max(0, phaseIndex - 1))} disabled={phaseIndex === 0 || saving}><ArrowLeft size={14} aria-hidden="true" />Back</button>
              <button type="button" className="fbd-btn is-light" onClick={saveDraft} disabled={saving}><Save size={14} aria-hidden="true" />Save draft</button>
              <button
                type="button"
                className="fbd-btn is-primary"
                onClick={phase.id === 'documents' ? () => goToPhase(phaseIndex + 1) : savePhase}
                disabled={saving || Boolean(busyDocument)}
              >
                {saving ? 'Saving…' : phase.id === 'documents' ? 'Review details' : phaseIndex === FINANCIAL_PHASES.length - 1 ? 'Confirm details' : 'Save & continue'}
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </section>
        </main>

        <aside className="fbd-ledger" aria-label="Financial details verification ledger">
          <div className="fbd-ledger-head"><BadgeCheck size={17} aria-hidden="true" /><div><h3>Verification ledger</h3><p>Saved values stay masked for privacy.</p></div></div>

          <div className="fbd-ledger-section">
            <span>Completion</span>
            <div className="fbd-ledger-list">
              {FINANCIAL_PHASES.slice(0, 3).map((item, index) => (
                <button type="button" key={item.id} onClick={() => goToPhase(index)} className={completion[item.id] ? 'has-issue' : ''}>
                  <span>{completion[item.id] ? <CircleAlert size={13} aria-hidden="true" /> : <Check size={13} aria-hidden="true" />}</span>
                  <strong>{item.label}</strong>
                  <small>{completion[item.id] ? `${completion[item.id]} fields left` : 'Complete'}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="fbd-ledger-section">
            <span>Saved on file</span>
            <dl className="fbd-ledger-values">
              <div><dt>Account holder</dt><dd>{legal.accountHolder || 'Not provided'}</dd></div>
              <div><dt>Bank</dt><dd>{legal.bankName || 'Not provided'}</dd></div>
              <div><dt>Account</dt><dd>{maskedValue('', legal.accountLast4, 'Saved account')}</dd></div>
              <div><dt>PAN</dt><dd>{maskedValue('', legal.panLast4, 'Saved PAN')}</dd></div>
              <div><dt>GSTIN</dt><dd>{maskedValue('', legal.gstinLast4, 'Saved GSTIN')}</dd></div>
              <div><dt>IFSC</dt><dd>{legal.ifsc || 'Not provided'}</dd></div>
            </dl>
          </div>

          <div className="fbd-ledger-note"><LockKeyhole size={14} aria-hidden="true" /><span>New tax and compliance fields are kept in this browser session until matching API fields are available.</span></div>
        </aside>
      </div>
    </div>
  );
}
