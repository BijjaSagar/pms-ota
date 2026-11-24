// Last wizard step: tax and bank details, documents, then "Submit for review".
// PAN, GSTIN and account number are never sent back by the API (last 4 only): an empty box keeps the saved one.
import { useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, FileText, Landmark, Send, Trash2 } from 'lucide-react';
import { TextField } from '../Layout.jsx';
import {
  DOCUMENT_ACCEPT, IMAGE_MAX_BYTES, deleteDocument, formErrors, loadFile, saveLegal, submitProperty, uploadDocument,
} from '../../lib/api/properties.js';
import { revealFirstError } from '../../lib/utils/revealError.js';

const LABELS = {
  legalName: 'Legal name', pan: 'PAN', gstin: 'GSTIN', accountHolder: 'Account holder name', bankName: 'Bank name',
  accountNumber: 'Account number', ifsc: 'IFSC code', declaration: 'Declaration',
};
const compact = (v) => String(v ?? '').replace(/\s/g, '').toUpperCase();

function validate(form, saved) {
  const errors = {};
  const pan = compact(form.pan);
  const gstin = compact(form.gstin);
  if (form.legalName.trim().length < 2) errors.legalName = 'Enter the legal or business name.';
  if (pan ? !/^[A-Z]{3}[ABCFGHJLPT][A-Z]\d{4}[A-Z]$/.test(pan) : !saved) errors.pan = 'Enter a valid PAN, e.g. AAPFU0939F.';
  if (form.hasGst !== 'yes' && form.hasGst !== 'no') errors.hasGst = 'Tell us whether you are registered for GST.';
  if (form.hasGst === 'yes') {
    if (gstin ? !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin) : !saved?.hasGst) errors.gstin = 'Enter a valid 15-character GSTIN.';
    else if (pan && gstin && gstin.slice(2, 12) !== pan) errors.gstin = 'This GSTIN belongs to a different PAN.';
  }
  if (form.accountHolder.trim().length < 2) errors.accountHolder = 'Enter the account holder name.';
  if (form.bankName.trim().length < 2) errors.bankName = 'Enter the bank name.';
  const account = compact(form.accountNumber);
  if (account ? !/^\d{9,18}$/.test(account) : !saved) errors.accountNumber = 'Enter a valid account number (9 to 18 digits).';
  if (account && compact(form.confirmAccount) !== account) errors.confirmAccount = 'Account numbers do not match.';
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(compact(form.ifsc))) errors.ifsc = 'Enter a valid IFSC code, e.g. HDFC0001234.';
  if (!form.declaration) errors.declaration = 'Accept the declaration to continue.';
  return errors;
}

const formFrom = (legal) => ({
  legalName: legal?.legalName ?? '', pan: '', hasGst: legal ? (legal.hasGst ? 'yes' : 'no') : '', gstin: '',
  accountHolder: legal?.accountHolder ?? '', bankName: legal?.bankName ?? '', accountNumber: '', confirmAccount: '',
  ifsc: legal?.ifsc ?? '', declaration: Boolean(legal),
});

function DocumentRow({ label, hint, document, disabled, onPick, onRemove, onOpen }) {
  const inputRef = useRef(null);
  return (
    <div className="pi-video-row">
      <span className="pi-video-icon"><FileText size={18} aria-hidden="true" /></span>
      <div className="pi-video-meta">
        <strong>{label}</strong>
        <small>{document ? document.name : hint}</small>
      </div>
      <input ref={inputRef} type="file" accept={DOCUMENT_ACCEPT} className="sr-only" aria-label={`Choose ${label}`} tabIndex={-1}
        onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) onPick(file); }} />
      {document && <button type="button" className="btn btn-light" onClick={onOpen}>Open</button>}
      <button type="button" className="btn btn-light" disabled={disabled} onClick={() => inputRef.current?.click()}>{document ? 'Replace' : 'Upload'}</button>
      {document && (
        <button type="button" className="pi-photo-remove pi-doc-remove" disabled={disabled} onClick={onRemove} aria-label={`Remove ${label}`}>
          <Trash2 size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function PropertyLegalForm({ property, SectionCard, allOtherComplete, onSaved, onSubmitted, onBack, notify, noticeMarkup }) {
  const saved = property.legal;
  const formRef = useRef(null);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState('');
  const [form, setForm] = useState(() => formFrom(saved));
  const [dirty, setDirty] = useState(!saved);
  const [errors, setErrors] = useState({});
  const complete = property.completedSections.includes('legal') && !dirty;

  const setValue = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors(({ [key]: _removed, ...rest }) => rest);
    setDirty(true);
    notify(null);
  };
  const field = (key) => ({ value: form[key], onChange: (event) => setValue(key, event.target.value), error: errors[key] });

  // One request at a time: a second click while one runs is ignored.
  const run = async (name, work) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(name);
    notify(null);
    try {
      await work();
    } catch (error) {
      const found = formErrors(error, LABELS);
      setErrors((current) => ({ ...current, ...found }));
      notify({ kind: 'error', text: error.message });
      if (Object.keys(found).length) revealFirstError(formRef.current);
    } finally {
      busyRef.current = false;
      setBusy('');
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const found = validate(form, saved);
    setErrors(found);
    if (Object.keys(found).length) { revealFirstError(formRef.current); return; }
    run('save', async () => {
      const next = await saveLegal(property.id, form);
      onSaved(next);
      setForm(formFrom(next.legal));
      setDirty(false);
      notify({
        kind: 'success',
        text: next.completedSections.includes('legal') ? 'Financial & legal details saved.' : 'Details saved. Now upload the documents below.',
      });
    });
  };

  const pick = (type) => (file) => {
    if (file.size > IMAGE_MAX_BYTES) { notify({ kind: 'error', text: 'The document must be 10 MB or smaller.' }); return; }
    run(type, async () => { onSaved(await uploadDocument(property.id, type, file)); });
  };
  const remove = (type) => () => run(type, async () => { onSaved(await deleteDocument(property.id, type)); });
  const openDocument = (document) => () => run(document.type, async () => {
    const url = URL.createObjectURL(await loadFile(document.url));
    const link = window.document.createElement('a');
    link.href = url;
    link.download = document.name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  });
  const submit = () => run('submit', async () => { onSubmitted(await submitProperty(property.id)); });

  const documents = [
    ['OWNERSHIP', 'Ownership, registration or lease document', 'PDF or photo, up to 10 MB'],
    ['CANCELLED_CHEQUE', 'Cancelled cheque', 'Or the first page of the passbook'],
    ...(form.hasGst === 'yes' ? [['GST_CERTIFICATE', 'GST certificate', 'PDF or photo, up to 10 MB']] : []),
  ];

  return (
    <>
      {noticeMarkup}
      <form ref={formRef} noValidate onSubmit={onSubmit}>
        <SectionCard icon={Landmark} title="Tax & bank details" subtitle="Used for payouts and invoices. Never shown to guests.">
          <div className="pi-grid">
            <TextField full label="Legal / business name" {...field('legalName')} maxLength={150} autoComplete="organization" />
            <TextField label="PAN" {...field('pan')} maxLength={12} autoComplete="off" placeholder={saved ? `Saved · ends with ${saved.panLast4}` : 'e.g. AAPFU0939F'} />
            <fieldset className={`pi-field ${errors.hasGst ? 'has-error' : ''}`}>
              <legend className="pi-label">Are you registered for GST?</legend>
              <div className="pi-segments">
                {[['yes', 'Yes'], ['no', 'No']].map(([value, label]) => (
                  <label key={value} className={`pi-segment ${form.hasGst === value ? 'is-on' : ''}`}>
                    <input type="radio" name="pi-has-gst" value={value} checked={form.hasGst === value} onChange={() => setValue('hasGst', value)} className="sr-only" />
                    {label}
                  </label>
                ))}
              </div>
              {errors.hasGst && <span className="field-error" role="alert">{errors.hasGst}</span>}
            </fieldset>
            {form.hasGst === 'yes' && (
              <TextField full label="GSTIN" {...field('gstin')} maxLength={18} autoComplete="off" placeholder={saved?.hasGst ? `Saved · ends with ${saved.gstinLast4}` : '15 characters'} />
            )}
            <TextField label="Account holder name" {...field('accountHolder')} maxLength={150} autoComplete="off" />
            <TextField label="Bank name" {...field('bankName')} maxLength={100} autoComplete="off" />
            <TextField label="Account number" {...field('accountNumber')} inputMode="numeric" maxLength={24} autoComplete="off" placeholder={saved ? `Saved · ends with ${saved.accountLast4}` : '9 to 18 digits'} />
            <TextField label="Confirm account number" {...field('confirmAccount')} inputMode="numeric" maxLength={24} autoComplete="off" placeholder={saved ? 'Only when you change it' : ''} />
            <TextField label="IFSC code" {...field('ifsc')} maxLength={13} autoComplete="off" placeholder="e.g. HDFC0001234" />
          </div>
          <label className={`pi-consent ${errors.declaration ? 'has-error' : ''}`}>
            <input type="checkbox" checked={form.declaration} onChange={(event) => setValue('declaration', event.target.checked)} />
            <span>I confirm these details are correct and that I am authorised to list this property.</span>
          </label>
          {errors.declaration && <p className="field-error" role="alert">{errors.declaration}</p>}
          <div className="pi-legal-save">
            <button type="submit" className="btn btn-primary" disabled={Boolean(busy)}>
              {busy === 'save' ? 'Saving…' : 'Save details'}<CheckCircle2 size={16} aria-hidden="true" />
            </button>
          </div>
        </SectionCard>
      </form>

      <SectionCard icon={FileText} title="Documents" subtitle="Private. Only you and our review team can see them.">
        <div className="pi-video-list">
          {documents.map(([type, label, hint]) => {
            const document = property.documents.find((item) => item.type === type);
            return (
              <DocumentRow key={type} label={label} hint={busy === type ? 'Uploading…' : hint} document={document} disabled={Boolean(busy)}
                onPick={pick(type)} onRemove={remove(type)} onOpen={document && openDocument(document)} />
            );
          })}
        </div>
      </SectionCard>

      <div className="pi-actions pi-amenity-actions">
        <button type="button" className="btn btn-light" onClick={onBack}>Back to Policies</button>
        <button type="button" className="btn btn-primary" disabled={Boolean(busy) || !complete || !allOtherComplete} onClick={submit}>
          {busy === 'submit' ? 'Submitting…' : 'Submit for review'}
          {complete ? <Send size={16} aria-hidden="true" /> : <ArrowRight size={16} aria-hidden="true" />}
        </button>
      </div>
    </>
  );
}
