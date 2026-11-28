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
  History,
  MailCheck,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  DOCUMENT_ACCEPT,
  IMAGE_MAX_BYTES,
  confirmFinance,
  deleteDocument,
  formErrors,
  getFinance,
  getFinanceActivity,
  loadFile,
  requestBankChangeCode,
  saveFinanceCompliance,
  saveFinancePayout,
  saveFinanceTax,
  uploadDocument,
  verifyFinanceBank,
} from '../../lib/api/properties.js';
import {
  DOCUMENT_TYPES,
  FIELD_LABELS,
  dirtyPhases,
  FINANCIAL_PHASES,
  MSME_CATEGORY_OPTIONS,
  VERIFICATION_LABELS,
  bankChangeTyped,
  companyTypesOf,
  describeActivity,
  compliancePayload,
  formFromView,
  labelOf,
  maskSensitive,
  maskedValue,
  mergePhase,
  payoutPayload,
  phaseCompletion,
  taxPayload,
  todayIso,
  validateFinancialPhase,
} from '../../lib/data/financialBankDetails.js';
import '../../styles/partner-financial-bank-details.css';

const PHASE_INDEX = Object.fromEntries(FINANCIAL_PHASES.map((item, index) => [item.id, index]));
const SAVE = { payout: saveFinancePayout, tax: saveFinanceTax, compliance: saveFinanceCompliance };
const PAYLOAD = { payout: payoutPayload, tax: taxPayload, compliance: compliancePayload };

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
  const [confirming, setConfirming] = useState(false);
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
      {confirming ? (
        <div className="fbd-inline-confirm" role="group" aria-label={`Remove ${label}?`}>
          <span>Remove?</span>
          <button type="button" className="fbd-btn is-danger" onClick={() => { setConfirming(false); onRemove(); }} disabled={busy}>Remove</button>
          <button type="button" className="fbd-btn is-light" onClick={() => setConfirming(false)}>Keep</button>
        </div>
      ) : (
        <>
          {document ? <button type="button" className="fbd-btn is-light" onClick={onOpen} disabled={busy}>Open</button> : null}
          <button type="button" className="fbd-btn is-light" onClick={() => inputRef.current?.click()} disabled={busy}>{document ? 'Replace' : 'Upload'}</button>
          {document ? (
            <button type="button" className="fbd-icon-btn is-danger" onClick={() => setConfirming(true)} disabled={busy} aria-label={`Remove ${label}`}><Trash2 size={14} aria-hidden="true" /></button>
          ) : null}
        </>
      )}
    </div>
  );
}

function BankVerification({ view, dirty, busy, onVerify }) {
  const [consent, setConsent] = useState(false);
  const verification = view?.payout?.verification ?? { status: 'NOT_STARTED' };
  const saved = Boolean(view?.payout?.accountLast4);
  const status = verification.status;
  const canVerify = saved && !dirty && (status === 'NOT_STARTED' || status === 'FAILED');
  return (
    <div className={`fbd-verify is-${status.toLowerCase().replace('_', '-')}`}>
      <div className="fbd-verify-head">
        <ShieldCheck size={17} aria-hidden="true" />
        <div>
          <strong>Bank account check</strong>
          <small>We send Rs 1 to the saved account and match the name the bank returns.</small>
        </div>
        <span className="fbd-verify-chip">{VERIFICATION_LABELS[status] ?? status}</span>
      </div>
      {status === 'VERIFIED' && verification.nameAtBank ? <p className="fbd-verify-line">Name at bank: <strong>{verification.nameAtBank}</strong></p> : null}
      {status === 'FAILED' && verification.failureReason ? <p className="fbd-verify-line is-error">{verification.failureReason}</p> : null}
      {status === 'PENDING' ? <p className="fbd-verify-line">The TriponX team is checking this account. This usually takes one working day.</p> : null}
      {!saved ? <p className="fbd-verify-line">Save the bank account first, then verify it.</p> : null}
      {saved && dirty ? <p className="fbd-verify-line">{status === 'VERIFIED' ? 'Saving a different account, IFSC or holder name needs a new bank check.' : 'Save your changes before verifying.'}</p> : null}
      {canVerify ? (
        <div className="fbd-verify-actions">
          <label className="fbd-verify-consent">
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            <span>I agree to a Rs 1 test deposit to the account ending {view.payout.accountLast4}.</span>
          </label>
          <button type="button" className="fbd-btn is-primary" disabled={!consent || busy} onClick={() => { onVerify(); setConsent(false); }}>
            {busy ? 'Verifying…' : status === 'FAILED' ? 'Try again' : 'Verify account'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function BankChangeCode({ step, code, error, busy, onCode, onSubmit, onResend, onCancel }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const wait = Math.max(0, Math.ceil((step.resendAt - now) / 1000));
  return (
    <div className="fbd-code" role="group" aria-label="Confirm the bank change">
      <div className="fbd-verify-head">
        <MailCheck size={17} aria-hidden="true" />
        <div>
          <strong>Confirm it is you</strong>
          <small>To protect your payouts, we sent a 6-digit code to {step.destination}. It is valid for 10 minutes.</small>
        </div>
      </div>
      <div className="fbd-code-row">
        <label className={`fbd-field ${error ? 'has-error' : ''}`}>
          <span>Code</span>
          <input
            value={code}
            onChange={(event) => onCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={(event) => { if (event.key === 'Enter' && code.length === 6) onSubmit(); }}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="6-digit code"
            autoFocus
          />
          {error ? <small className="fbd-field-error" role="alert">{error}</small> : null}
        </label>
        <button type="button" className="fbd-btn is-primary" onClick={onSubmit} disabled={busy || code.length !== 6}>{busy ? 'Saving…' : 'Verify & save'}</button>
      </div>
      <div className="fbd-code-links">
        <button type="button" className="fbd-link-btn" onClick={onResend} disabled={busy || wait > 0}>{wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}</button>
        <button type="button" className="fbd-link-btn" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </div>
  );
}

function ActivityList({ events, error, onRetry }) {
  const [all, setAll] = useState(false);
  if (error) return <p className="fbd-activity-empty">Activity could not be loaded. <button type="button" className="fbd-link-btn" onClick={onRetry}>Try again</button></p>;
  if (!events) return <p className="fbd-activity-empty">Loading…</p>;
  if (!events.length) return <p className="fbd-activity-empty">No changes yet.</p>;
  const list = all ? events : events.slice(0, 5);
  return (
    <>
      <ol className="fbd-activity">
        {list.map((event) => {
          const item = describeActivity(event);
          return (
            <li key={event.id} className={item.warn ? 'is-warn' : ''}>
              <strong>{item.title}</strong>
              <small>{item.when}{item.where ? ` · ${item.where}` : ''}</small>
              {item.changes.map((line) => <span key={line}>{line}</span>)}
              {item.alert ? <em>{item.alert}</em> : null}
            </li>
          );
        })}
      </ol>
      {events.length > 5 ? <button type="button" className="fbd-link-btn" onClick={() => setAll((value) => !value)}>{all ? 'Show less' : `Show all ${events.length}`}</button> : null}
    </>
  );
}

export default function FinancialBankDetailsWorkspace({ property, onPropertyChange }) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [loadKey, setLoadKey] = useState(0);
  const [view, setView] = useState(null);
  const [form, setForm] = useState(() => formFromView(null));
  const [savedForm, setSavedForm] = useState(() => formFromView(null));
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [busyDocument, setBusyDocument] = useState('');
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState('');
  const [codeStep, setCodeStep] = useState(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [activity, setActivity] = useState(null);
  const [activityError, setActivityError] = useState(false);

  const refreshActivity = () => {
    setActivityError(false);
    getFinanceActivity(property.id)
      .then((next) => setActivity(next.events))
      .catch(() => setActivityError(true));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(refreshActivity, [property.id]);

  useEffect(() => {
    let active = true;
    setDetailLoading(true);
    setDetailError('');
    getFinance(property.id)
      .then((next) => {
        if (!active) return;
        setView(next);
        setForm(formFromView(next));
        setSavedForm(formFromView(next));
      })
      .catch((problem) => { if (active) setDetailError(problem?.message || 'Saved details could not be loaded.'); })
      .finally(() => { if (active) setDetailLoading(false); });
    return () => { active = false; };
  }, [property.id, loadKey]);

  const phase = FINANCIAL_PHASES[phaseIndex];
  const completion = phaseCompletion(form, view);
  const companyTypes = companyTypesOf(view);
  const dirty = view ? dirtyPhases(form, savedForm) : [];
  const payoutDirty = dirty.includes('payout');
  const legal = { ...(view?.payout ?? {}), ...(view?.tax ?? {}) };
  const disabled = !view || detailLoading;

  // Typed but unsaved details: the browser asks before leaving the page.
  const hasUnsaved = dirty.length > 0;
  useEffect(() => {
    if (!hasUnsaved) return undefined;
    const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasUnsaved]);

  const setField = (key, value) => {
    // An emptied account number keeps the saved one, so its confirmation goes too.
    setForm((current) => ({ ...current, [key]: value, ...(key === 'accountNumber' && !value.trim() && { confirmAccount: '' }) }));
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

  const applyView = (next, phaseId) => {
    setView(next);
    setForm((current) => mergePhase(current, next, phaseId));
    setSavedForm((current) => mergePhase(current, next, phaseId));
  };

  const closeCode = () => { setCodeStep(null); setCode(''); setCodeError(''); };

  // Sends the code a bank change of a listed property needs, and opens the code step.
  const sendBankCode = async () => {
    setSaving(true);
    setCodeError('');
    try {
      const sent = await requestBankChangeCode(property.id);
      setCodeStep({ destination: sent.destination, resendAt: Date.now() + (sent.resendAfterSeconds ?? 60) * 1000 });
      setCode('');
      setStatus({ type: 'success', message: sent.message || 'We sent you a code.' });
      refreshActivity();
    } catch (problem) {
      setStatus({ type: 'error', message: problem?.message || 'Could not send the code. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const savePhase = async (otp) => {
    if (phase.id === 'review') return confirmDetails();
    const found = validateFinancialPhase(phase.id, form, view);
    if (Object.keys(found).length) {
      setErrors(found);
      setStatus({ type: 'error', message: 'Complete the highlighted fields before continuing.' });
      return;
    }
    setErrors({});
    // A listed property changes its bank account only with the e-mail code.
    if (phase.id === 'payout' && !otp && view?.payout?.changeNeedsCode && bankChangeTyped(form, savedForm)) {
      await sendBankCode();
      return;
    }
    setSaving(true);
    setStatus(null);
    let needCode = false;
    try {
      const body = PAYLOAD[phase.id](form);
      const next = await SAVE[phase.id](property.id, otp ? { ...body, otp } : body);
      applyView(next, phase.id);
      closeCode();
      refreshActivity();
      setStatus({ type: 'success', message: `${phase.title} saved.` });
      if (phase.id !== 'payout') goToPhase(phaseIndex + 1, false);
    } catch (problem) {
      const foundErrors = formErrors(problem, FIELD_LABELS);
      if (foundErrors.otp) {
        // Wrong or expired code, or a code the page did not expect to need.
        if (codeStep) setCodeError('The code is wrong or has expired. Check it or ask for a new one.');
        else needCode = true;
        refreshActivity();
      } else {
        if (Object.keys(foundErrors).length) setErrors(foundErrors);
        setStatus({ type: 'error', message: problem?.message || 'Could not save these details. Please try again.' });
      }
    } finally {
      setSaving(false);
    }
    if (needCode) await sendBankCode();
  };

  const confirmDetails = async () => {
    if (dirty.length) {
      goToPhase(PHASE_INDEX[dirty[0]], false);
      setStatus({ type: 'error', message: `You changed ${FIELD_LABELS[dirty[0]]} but did not save it. Save or undo the change before confirming.` });
      return;
    }
    const unsaved = ['payout', 'tax', 'compliance'].find((id) => completion[id]);
    if (unsaved) {
      goToPhase(PHASE_INDEX[unsaved], false);
      setErrors(validateFinancialPhase(unsaved, form, view));
      setStatus({ type: 'error', message: `Save ${FIELD_LABELS[unsaved]} before confirming.` });
      return;
    }
    if (completion.documents) {
      goToPhase(PHASE_INDEX.documents, false);
      setStatus({ type: 'error', message: 'Upload the required documents before confirming.' });
      return;
    }
    if (!form.declaration) {
      setErrors({ declaration: 'Accept the declaration to confirm.' });
      setStatus({ type: 'error', message: 'Accept the declaration to confirm.' });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const next = await confirmFinance(property.id);
      setView(next);
      setForm((current) => ({ ...current, declaration: next.confirmed }));
      setSavedForm((current) => ({ ...current, declaration: next.confirmed }));
      setStatus({ type: 'success', message: 'Financial & bank details confirmed.' });
      refreshActivity();
    } catch (problem) {
      const foundErrors = formErrors(problem, FIELD_LABELS);
      const first = Object.keys(foundErrors).find((key) => key in PHASE_INDEX);
      if (first) goToPhase(PHASE_INDEX[first], false);
      setStatus({ type: 'error', message: problem?.message || 'Could not confirm these details.' });
    } finally {
      setSaving(false);
    }
  };

  const continueFromPayout = () => {
    if (payoutDirty || completion.payout) return savePhase();
    goToPhase(phaseIndex + 1);
    return undefined;
  };

  const verifyBank = async () => {
    setVerifying(true);
    setStatus(null);
    try {
      const next = await verifyFinanceBank(property.id);
      setView(next);
      refreshActivity();
      const result = next.payout.verification.status;
      setStatus(result === 'FAILED'
        ? { type: 'error', message: next.payout.verification.failureReason || 'The bank account could not be verified.' }
        : { type: 'success', message: result === 'VERIFIED' ? 'Bank account verified.' : 'Bank account sent for verification.' });
    } catch (problem) {
      setStatus({ type: 'error', message: problem?.message || 'Could not verify the bank account.' });
    } finally {
      setVerifying(false);
    }
  };

  // The file was stored; reload the finance view (required documents, progress, confirmation).
  const afterDocumentChange = async (detail, message) => {
    if (detail && onPropertyChange) onPropertyChange(detail);
    refreshActivity();
    try {
      const next = await getFinance(property.id);
      setView(next);
      setForm((current) => ({ ...current, declaration: next.confirmed }));
      setSavedForm((current) => ({ ...current, declaration: next.confirmed }));
      setStatus({ type: 'success', message });
    } catch {
      setStatus({ type: 'error', message: `${message} Refresh the page to see the latest status.` });
    }
  };

  const pickDocument = async (type, file) => {
    if (file.size > IMAGE_MAX_BYTES) {
      setStatus({ type: 'error', message: 'The document must be 10 MB or smaller.' });
      return;
    }
    setBusyDocument(type);
    setStatus(null);
    try {
      const detail = await uploadDocument(property.id, type, file);
      await afterDocumentChange(detail, 'Document uploaded privately.');
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
      const detail = await deleteDocument(property.id, type);
      await afterDocumentChange(detail, 'Document removed.');
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

  // Shows the GST certificate as soon as GST is answered Yes, even before the tax phase is saved.
  const documentTypes = [...new Set([...(view?.requiredDocuments ?? ['OWNERSHIP', 'CANCELLED_CHEQUE']), ...(form.hasGst === 'yes' ? ['GST_CERTIFICATE'] : [])])];
  const documents = view?.documents ?? [];

  const phaseBadge = (item) => {
    if (!view) return '…';
    if (dirty.includes(item.id)) return 'Unsaved';
    if (item.id === 'documents') {
      const uploaded = documentTypes.filter((type) => documents.some((doc) => doc.type === type)).length;
      return `${uploaded}/${documentTypes.length}`;
    }
    if (item.id === 'review') return view?.confirmed ? 'Done' : '1 left';
    return completion[item.id] ? `${completion[item.id]} left` : 'Done';
  };

  const primaryAction = () => {
    if (phase.id === 'documents') return goToPhase(phaseIndex + 1);
    if (phase.id === 'payout') return continueFromPayout();
    return savePhase();
  };
  const primaryLabel = () => {
    if (saving) return 'Saving…';
    if (phase.id === 'documents') return 'Review details';
    if (phase.id === 'review') return view?.confirmed ? 'Confirmed' : 'Confirm details';
    if (phase.id === 'payout' && !payoutDirty && !completion.payout) return 'Continue';
    return 'Save & continue';
  };
  const verification = view?.payout?.verification?.status ?? 'NOT_STARTED';

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
      {detailError ? (
        <div className="fbd-status is-error fbd-status-retry" role="alert">
          <span>Saved bank details could not be loaded: {detailError}</span>
          <button type="button" className="fbd-btn is-light" onClick={() => setLoadKey((key) => key + 1)} disabled={detailLoading}>Try again</button>
        </div>
      ) : null}
      {status ? <div className={`fbd-status is-${status.type}`} role="status">{status.message}</div> : null}

      <div className="fbd-layout">
        <main className="fbd-main">
          <section className="fbd-card">
            <div className="fbd-card-head">
              <span className="fbd-card-icon"><Landmark size={18} aria-hidden="true" /></span>
              <div><h3>{phase.title}</h3><p>{phase.description}</p></div>
              <span className="fbd-step-count">Step {phaseIndex + 1} of {FINANCIAL_PHASES.length}</span>
            </div>

            {!view ? <p className="fbd-card-loading">{detailError ? 'These details could not be loaded.' : 'Loading saved details…'}</p> : null}

            {view && phase.id === 'payout' ? (
              <>
                <div className="fbd-form-grid">
                  <Field label={FIELD_LABELS.accountHolder} error={errors.accountHolder} hint="Exactly as on the bank account."><input value={form.accountHolder} onChange={(event) => setField('accountHolder', event.target.value)} maxLength={150} autoComplete="off" /></Field>
                  <Field label={FIELD_LABELS.bankName} error={errors.bankName}><input value={form.bankName} onChange={(event) => setField('bankName', event.target.value)} maxLength={100} autoComplete="off" /></Field>
                  <Field label={FIELD_LABELS.accountNumber} error={errors.accountNumber} hint={legal.accountLast4 ? `Saved account ends with ${legal.accountLast4}. Leave blank to keep it.` : ''}><input inputMode="numeric" value={form.accountNumber} onChange={(event) => setField('accountNumber', event.target.value.replace(/[^\d\s]/g, ''))} maxLength={22} autoComplete="off" placeholder={legal.accountLast4 ? `•••• ${legal.accountLast4}` : ''} /></Field>
                  <Field label={FIELD_LABELS.confirmAccount} error={errors.confirmAccount}><input inputMode="numeric" value={form.confirmAccount} onChange={(event) => setField('confirmAccount', event.target.value.replace(/[^\d\s]/g, ''))} maxLength={22} autoComplete="off" disabled={!form.accountNumber} onPaste={(event) => event.preventDefault()} /></Field>
                  <Field label={FIELD_LABELS.ifsc} error={errors.ifsc} full><input value={form.ifsc} onChange={(event) => setField('ifsc', event.target.value.toUpperCase())} maxLength={13} autoComplete="off" placeholder="HDFC0001234" /></Field>
                </div>
                {codeStep ? (
                  <BankChangeCode
                    step={codeStep}
                    code={code}
                    error={codeError}
                    busy={saving}
                    onCode={(value) => { setCode(value); setCodeError(''); }}
                    onSubmit={() => savePhase(code)}
                    onResend={sendBankCode}
                    onCancel={closeCode}
                  />
                ) : view.payout.changeNeedsCode && bankChangeTyped(form, savedForm) ? (
                  <p className="fbd-code-hint"><MailCheck size={14} aria-hidden="true" />Saving a new account, IFSC or holder name asks for a code sent to your sign-in e-mail.</p>
                ) : null}
                <BankVerification view={view} dirty={payoutDirty} busy={verifying} onVerify={verifyBank} />
              </>
            ) : null}

            {view && phase.id === 'tax' ? (
              <div className="fbd-form-grid">
                <Field label={FIELD_LABELS.legalName} error={errors.legalName} full><input value={form.legalName} onChange={(event) => setField('legalName', event.target.value)} maxLength={150} autoComplete="organization" /></Field>
                <Field label={FIELD_LABELS.pan} error={errors.pan} hint={legal.panLast4 ? `Saved PAN ends with ${legal.panLast4}. Leave blank to keep it.` : ''}><input value={form.pan} onChange={(event) => setField('pan', event.target.value.toUpperCase())} maxLength={12} autoComplete="off" placeholder={legal.panLast4 ? `•••••• ${legal.panLast4}` : 'AAPFU0939F'} /></Field>
                <Field
                  label={`${FIELD_LABELS.hotelPan} (optional)`}
                  error={errors.hotelPan}
                  hint={form.removeHotelPan ? 'The saved hotel PAN will be removed when you save.' : legal.hotelPanLast4 ? `Saved hotel PAN ends with ${legal.hotelPanLast4}.` : 'Only if the hotel has its own PAN.'}
                >
                  <input value={form.hotelPan} onChange={(event) => setField('hotelPan', event.target.value.toUpperCase())} maxLength={12} autoComplete="off" placeholder={legal.hotelPanLast4 ? `•••••• ${legal.hotelPanLast4}` : ''} disabled={form.removeHotelPan} />
                  {legal.hotelPanLast4 ? (
                    <button type="button" className="fbd-link-btn" onClick={(event) => { event.preventDefault(); setForm((current) => ({ ...current, hotelPan: '', removeHotelPan: !current.removeHotelPan })); }}>
                      {form.removeHotelPan ? 'Keep the saved hotel PAN' : 'Remove the saved hotel PAN'}
                    </button>
                  ) : null}
                </Field>
                <Field label={FIELD_LABELS.hasGst} error={errors.hasGst} full><YesNo value={form.hasGst} onChange={(value) => setField('hasGst', value)} /></Field>
                {form.hasGst === 'yes' ? (
                  <>
                    <Field label={FIELD_LABELS.gstin} error={errors.gstin} hint={legal.gstinLast4 ? `Saved GSTIN ends with ${legal.gstinLast4}. Leave blank to keep it.` : 'Characters 3 to 12 must be your PAN.'}><input value={form.gstin} onChange={(event) => setField('gstin', event.target.value.toUpperCase())} maxLength={18} autoComplete="off" placeholder={legal.gstinLast4 ? `••••••••••• ${legal.gstinLast4}` : '27AAPFU0939F1ZV'} /></Field>
                    <Field label={FIELD_LABELS.gstEntityName} error={errors.gstEntityName}><input value={form.gstEntityName} onChange={(event) => setField('gstEntityName', event.target.value)} maxLength={150} autoComplete="organization" /></Field>
                  </>
                ) : null}
              </div>
            ) : null}

            {view && phase.id === 'compliance' ? (
              <div className="fbd-form-grid">
                <Field label={FIELD_LABELS.hasTan} error={errors.hasTan}><YesNo value={form.hasTan} onChange={(value) => setField('hasTan', value)} /></Field>
                {form.hasTan === 'yes' ? <Field label={FIELD_LABELS.tanNumber} error={errors.tanNumber}><input value={form.tanNumber} onChange={(event) => setField('tanNumber', event.target.value.toUpperCase())} maxLength={12} autoComplete="off" placeholder="PNEL12345C" /></Field> : <span className="fbd-grid-gap" aria-hidden="true" />}
                <Field label={FIELD_LABELS.msmeRegistered} error={errors.msmeRegistered} full><YesNo value={form.msmeRegistered} onChange={(value) => setField('msmeRegistered', value)} /></Field>
                {form.msmeRegistered === 'yes' ? (
                  <>
                    <Field label={FIELD_LABELS.msmeCategory} error={errors.msmeCategory}><select value={form.msmeCategory} onChange={(event) => setField('msmeCategory', event.target.value)}><option value="">Select category</option>{MSME_CATEGORY_OPTIONS.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}</select></Field>
                    <Field label={FIELD_LABELS.msmeNumber} error={errors.msmeNumber}><input value={form.msmeNumber} onChange={(event) => setField('msmeNumber', event.target.value.toUpperCase())} maxLength={22} autoComplete="off" placeholder="UDYAM-MH-26-0012345" /></Field>
                  </>
                ) : null}
                <Field label={FIELD_LABELS.companyRegistered} error={errors.companyRegistered} full><YesNo value={form.companyRegistered} onChange={(value) => setField('companyRegistered', value)} /></Field>
                {form.companyRegistered === 'yes' ? (
                  <>
                    <Field label={FIELD_LABELS.companyType} error={errors.companyType}><select value={form.companyType} onChange={(event) => setField('companyType', event.target.value)}><option value="">Select entity type</option>{companyTypes.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}</select></Field>
                    <Field label={FIELD_LABELS.companyRegistrationNumber} error={errors.companyRegistrationNumber} hint="CIN, LLPIN or registration certificate number."><input value={form.companyRegistrationNumber} onChange={(event) => setField('companyRegistrationNumber', event.target.value.toUpperCase())} maxLength={30} autoComplete="off" /></Field>
                    <Field label={FIELD_LABELS.companyRegistrationName} error={errors.companyRegistrationName}><input value={form.companyRegistrationName} onChange={(event) => setField('companyRegistrationName', event.target.value)} maxLength={150} autoComplete="organization" /></Field>
                    <Field label={FIELD_LABELS.companyRegisteredOn} error={errors.companyRegisteredOn}><input type="date" value={form.companyRegisteredOn} min="1800-01-01" max={todayIso()} onChange={(event) => setField('companyRegisteredOn', event.target.value)} /></Field>
                  </>
                ) : null}
              </div>
            ) : null}

            {view && phase.id === 'documents' ? (
              <div className="fbd-documents">
                <div className="fbd-documents-note"><LockKeyhole size={15} aria-hidden="true" /><span>These files are private and are only used to verify payout and tax information.</span></div>
                {documentTypes.map((type) => {
                  const doc = documents.find((entry) => entry.type === type);
                  const meta = DOCUMENT_TYPES[type] ?? { label: type, hint: '' };
                  return (
                    <DocumentRow
                      key={type}
                      label={meta.label}
                      hint={meta.hint}
                      document={doc}
                      busy={busyDocument === type}
                      onPick={(file) => pickDocument(type, file)}
                      onOpen={doc ? () => openDocument(doc) : undefined}
                      onRemove={() => removeDocument(type)}
                    />
                  );
                })}
              </div>
            ) : null}

            {view && phase.id === 'review' ? (
              <div className="fbd-review">
                <div className="fbd-review-group">
                  <button type="button" onClick={() => goToPhase(0)}><span>01</span><strong>Bank &amp; payout</strong><ChevronRight size={15} aria-hidden="true" /></button>
                  <dl>
                    <div><dt>Account holder</dt><dd>{form.accountHolder || '—'}</dd></div>
                    <div><dt>Bank</dt><dd>{form.bankName || '—'}</dd></div>
                    <div><dt>Account</dt><dd>{maskSensitive(form.accountNumber, legal.accountLast4, 'Saved account')}</dd></div>
                    <div><dt>IFSC</dt><dd>{form.ifsc || '—'}</dd></div>
                    <div><dt>Bank check</dt><dd>{VERIFICATION_LABELS[verification]}</dd></div>
                  </dl>
                </div>
                <div className="fbd-review-group">
                  <button type="button" onClick={() => goToPhase(1)}><span>02</span><strong>PAN &amp; GST</strong><ChevronRight size={15} aria-hidden="true" /></button>
                  <dl>
                    <div><dt>Legal name</dt><dd>{form.legalName || '—'}</dd></div>
                    <div><dt>PAN</dt><dd>{maskSensitive(form.pan, legal.panLast4, 'Saved PAN')}</dd></div>
                    <div><dt>Hotel PAN</dt><dd>{form.removeHotelPan ? 'Not provided' : maskSensitive(form.hotelPan, legal.hotelPanLast4, 'Saved hotel PAN')}</dd></div>
                    <div><dt>GST</dt><dd>{form.hasGst === 'yes' ? maskSensitive(form.gstin, legal.gstinLast4, 'Saved GSTIN') : form.hasGst === 'no' ? 'Not registered' : '—'}</dd></div>
                    {form.hasGst === 'yes' ? <div><dt>GST entity</dt><dd>{form.gstEntityName || '—'}</dd></div> : null}
                  </dl>
                </div>
                <div className="fbd-review-group">
                  <button type="button" onClick={() => goToPhase(2)}><span>03</span><strong>Compliance</strong><ChevronRight size={15} aria-hidden="true" /></button>
                  <dl>
                    <div><dt>TAN</dt><dd>{form.hasTan === 'yes' ? form.tanNumber || '—' : form.hasTan === 'no' ? 'Not provided' : '—'}</dd></div>
                    <div><dt>MSME</dt><dd>{form.msmeRegistered === 'yes' ? `${labelOf(MSME_CATEGORY_OPTIONS, form.msmeCategory)} · ${form.msmeNumber}` : form.msmeRegistered === 'no' ? 'Not registered' : '—'}</dd></div>
                    <div><dt>Company</dt><dd>{form.companyRegistered === 'yes' ? `${labelOf(companyTypes, form.companyType)} · ${form.companyRegistrationNumber}` : form.companyRegistered === 'no' ? 'Not registered' : '—'}</dd></div>
                  </dl>
                </div>
                <div className="fbd-review-group">
                  <button type="button" onClick={() => goToPhase(3)}><span>04</span><strong>Documents</strong><ChevronRight size={15} aria-hidden="true" /></button>
                  <dl>
                    {documentTypes.map((type) => (
                      <div key={type}><dt>{DOCUMENT_TYPES[type]?.label ?? type}</dt><dd>{documents.some((doc) => doc.type === type) ? 'Uploaded' : 'Missing'}</dd></div>
                    ))}
                  </dl>
                </div>
                {view?.confirmed ? (
                  <div className="fbd-documents-note"><BadgeCheck size={15} aria-hidden="true" /><span>Confirmed on {new Date(view.declaredAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}. Changing any saved detail asks for the declaration again.</span></div>
                ) : (
                  <>
                    <label className={`fbd-declaration ${errors.declaration ? 'has-error' : ''}`}>
                      <input type="checkbox" checked={form.declaration} onChange={(event) => setField('declaration', event.target.checked)} />
                      <span>I confirm these details are correct and I am authorised to manage this property’s payouts and tax records.</span>
                    </label>
                    {errors.declaration ? <p className="fbd-field-error" role="alert">{errors.declaration}</p> : null}
                  </>
                )}
              </div>
            ) : null}

            <div className="fbd-actions">
              <button type="button" className="fbd-btn is-light" onClick={() => goToPhase(Math.max(0, phaseIndex - 1))} disabled={phaseIndex === 0 || saving}><ArrowLeft size={14} aria-hidden="true" />Back</button>
              <button
                type="button"
                className="fbd-btn is-primary"
                onClick={primaryAction}
                disabled={disabled || saving || Boolean(busyDocument) || (phase.id === 'review' && view?.confirmed)}
              >
                {primaryLabel()}
                {phase.id === 'review' && view?.confirmed ? <Check size={14} aria-hidden="true" /> : <ArrowRight size={14} aria-hidden="true" />}
              </button>
            </div>
          </section>
        </main>

        <aside className="fbd-ledger" aria-label="Financial details verification ledger">
          <div className="fbd-ledger-head"><BadgeCheck size={17} aria-hidden="true" /><div><h3>Verification ledger</h3><p>Saved values stay masked for privacy.</p></div></div>

          <div className="fbd-ledger-section">
            <span>Completion</span>
            <div className="fbd-ledger-list">
              {FINANCIAL_PHASES.slice(0, 4).map((item, index) => (
                <button type="button" key={item.id} onClick={() => goToPhase(index)} className={view && (completion[item.id] || dirty.includes(item.id)) ? 'has-issue' : ''}>
                  <span>{!view ? null : completion[item.id] || dirty.includes(item.id) ? <CircleAlert size={13} aria-hidden="true" /> : <Check size={13} aria-hidden="true" />}</span>
                  <strong>{item.label}</strong>
                  <small>{!view ? 'Loading…' : dirty.includes(item.id) ? 'Unsaved changes' : completion[item.id] ? `${completion[item.id]} ${item.id === 'documents' ? 'to upload' : 'left'}` : 'Complete'}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="fbd-ledger-section">
            <span>Saved on file</span>
            <dl className="fbd-ledger-values">
              <div><dt>Account holder</dt><dd>{legal.accountHolder || 'Not provided'}</dd></div>
              <div><dt>Bank</dt><dd>{legal.bankName || 'Not provided'}</dd></div>
              <div><dt>Account</dt><dd>{maskedValue(legal.accountLast4, 'Saved account')}</dd></div>
              <div><dt>Bank check</dt><dd>{VERIFICATION_LABELS[verification]}</dd></div>
              <div><dt>PAN</dt><dd>{maskedValue(legal.panLast4, 'Saved PAN')}</dd></div>
              <div><dt>GSTIN</dt><dd>{maskedValue(legal.gstinLast4, 'Saved GSTIN')}</dd></div>
              <div><dt>IFSC</dt><dd>{legal.ifsc || 'Not provided'}</dd></div>
            </dl>
          </div>

          <div className="fbd-ledger-section">
            <span><History size={12} aria-hidden="true" /> Recent activity</span>
            <ActivityList events={activity} error={activityError} onRetry={refreshActivity} />
          </div>

          <div className="fbd-ledger-note"><LockKeyhole size={14} aria-hidden="true" /><span>PAN, GSTIN and account numbers are stored encrypted. Only the last 4 characters are ever shown.</span></div>
        </aside>
      </div>
    </div>
  );
}
