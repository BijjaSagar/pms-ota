import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  MailCheck,
  Plus,
  Power,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { Modal } from '../Layout.jsx';
import {
  createApiToken,
  deleteProperty,
  deactivateProperty,
  formErrors,
  getPropertySettings,
  reactivateProperty,
  requestSettingsCode,
  revokeApiToken,
  savePropertyPreferences,
  setVccPassword,
} from '../../lib/api/properties.js';
import { STATUS_INFO } from '../../lib/data/propertyStatus.js';
import {
  DEFAULT_PREFERENCES,
  FIELD_LABELS,
  PREFERENCE_ITEMS,
  channelManagerSummary,
  formatTimestamp,
  reasonError,
  tokenLabelError,
} from '../../lib/data/propertySettings.js';
import { isStrongPassword } from '../../lib/utils/password.js';
import { PARTNER_PATHS } from './paths.js';
import '../../styles/partner-property-settings.css';

const PASSWORD_HINT = 'Use 8-64 characters with a letter, number and special character, with no spaces.';

function PasswordField({ label, value, onChange, error, autoComplete }) {
  const [shown, setShown] = useState(false);
  return (
    <div className={`pset-field ${error ? 'has-error' : ''}`}>
      <span>{label}</span>
      <div className="pset-password-control">
        <input aria-label={label} type={shown ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} maxLength={64} />
        <button type="button" onClick={() => setShown((current) => !current)} aria-label={shown ? `Hide ${label}` : `Show ${label}`}>
          {shown ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
        </button>
      </div>
      {error ? <small className="pset-field-error" role="alert">{error}</small> : null}
    </div>
  );
}

function TextField({ label, value, onChange, error, placeholder, maxLength, inputMode, autoComplete, multiline }) {
  return (
    <label className={`pset-field ${error ? 'has-error' : ''}`}>
      <span>{label}</span>
      {multiline ? (
        <textarea className="pset-input" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} maxLength={maxLength} rows={3} />
      ) : (
        <input className="pset-input" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} maxLength={maxLength} inputMode={inputMode} autoComplete={autoComplete ?? 'off'} />
      )}
      {error ? <small className="pset-field-error" role="alert">{error}</small> : null}
    </label>
  );
}

/** Six digits only. */
const digits = (value) => value.replace(/\D/g, '').slice(0, 6);

function TokenList({ tokens, busy, onRevoke }) {
  const [confirming, setConfirming] = useState('');
  if (!tokens.length) return <p className="pset-muted">No access tokens yet.</p>;
  return (
    <ul className="pset-token-list">
      {tokens.map((token) => (
        <li key={token.id}>
          <div>
            <strong>{token.label || 'Token'}</strong>
            <code>tpx_••••••••{token.last4}</code>
            <small>Created {formatTimestamp(token.createdAt)} · Last used {formatTimestamp(token.lastUsedAt)}</small>
          </div>
          {confirming === token.id ? (
            <div className="pset-inline-confirm" role="group" aria-label={`Revoke ${token.label}?`}>
              <span>Revoke? Anything using it stops working.</span>
              <button type="button" className="pset-btn is-danger" disabled={busy} onClick={() => { setConfirming(''); onRevoke(token.id); }}>Revoke</button>
              <button type="button" className="pset-btn is-light" onClick={() => setConfirming('')}>Keep</button>
            </div>
          ) : (
            <button type="button" className="pset-btn is-danger-outline" disabled={busy} onClick={() => setConfirming(token.id)}>
              <Trash2 size={14} aria-hidden="true" />Revoke
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function PropertySettingsWorkspace({ property, onReload }) {
  const navigate = useNavigate();
  const [view, setView] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [loadKey, setLoadKey] = useState(0);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState('');
  const [copied, setCopied] = useState('');

  // Access token creation: name -> code -> token shown once.
  const [tokenStep, setTokenStep] = useState(null); // null | 'name' | 'code'
  const [tokenLabel, setTokenLabel] = useState('');
  const [tokenCode, setTokenCode] = useState('');
  const [tokenErrors, setTokenErrors] = useState({});
  const [tokenSentTo, setTokenSentTo] = useState('');
  const [newToken, setNewToken] = useState('');

  // VCC password.
  const [vcc, setVcc] = useState({ currentPassword: '', newPassword: '', confirmPassword: '', otp: '' });
  const [vccErrors, setVccErrors] = useState({});
  const [vccReset, setVccReset] = useState(''); // '' or the masked e-mail the reset code went to

  // Deactivate / delete confirmation.
  const [confirmAction, setConfirmAction] = useState('');
  const [reason, setReason] = useState('');
  const [reasonErr, setReasonErr] = useState('');
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadError('');
    getPropertySettings(property.id)
      .then((next) => { if (active) setView(next); })
      .catch((problem) => { if (active) setLoadError(problem?.message || 'Settings could not be loaded.'); });
    return () => { active = false; };
  }, [property.id, loadKey]);

  // A new token is on screen: ask before leaving, it can not be shown again.
  useEffect(() => {
    if (!newToken) return undefined;
    const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [newToken]);

  const run = async (key, action, success) => {
    setBusy(key);
    setStatus(null);
    try {
      const result = await action();
      if (success) setStatus({ type: 'success', message: success });
      return result;
    } catch (problem) {
      setStatus({ type: 'error', message: problem?.message || 'Something went wrong. Please try again.' });
      throw problem;
    } finally {
      setBusy('');
    }
  };

  const copyValue = async (label, value) => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(label);
      window.setTimeout(() => setCopied(''), 1500);
    } catch {
      setStatus({ type: 'error', message: 'Copy is not available in this browser. Select the text and copy it.' });
    }
  };

  // ---------------------------------------------------------------- preferences
  const savePreferences = async (next) => {
    const previous = view.preferences;
    setView((current) => ({ ...current, preferences: next }));
    try {
      const saved = await run('preferences', () => savePropertyPreferences(property.id, next), 'Preferences saved.');
      setView(saved);
    } catch {
      setView((current) => ({ ...current, preferences: previous }));
    }
  };

  // ------------------------------------------------------------- access tokens
  const startToken = () => {
    setTokenStep('name');
    setTokenLabel('');
    setTokenCode('');
    setTokenErrors({});
    setNewToken('');
    setStatus(null);
  };

  const sendTokenCode = async () => {
    const labelProblem = tokenLabelError(tokenLabel);
    if (labelProblem) { setTokenErrors({ label: labelProblem }); return; }
    try {
      const sent = await run('token', () => requestSettingsCode(property.id, 'api-token'));
      setTokenSentTo(sent.destination);
      setTokenStep('code');
      setTokenCode('');
      setStatus({ type: 'success', message: sent.message });
    } catch { /* message shown */ }
  };

  const confirmToken = async () => {
    if (tokenCode.length !== 6) { setTokenErrors({ otp: 'Enter the 6-digit code.' }); return; }
    try {
      const result = await run('token', () => createApiToken(property.id, { label: tokenLabel.trim(), otp: tokenCode }));
      setView(result.settings);
      setNewToken(result.token);
      setTokenStep(null);
      setStatus({ type: 'success', message: 'Access token created. Copy it now: it will not be shown again.' });
    } catch (problem) {
      const found = formErrors(problem, FIELD_LABELS);
      if (found.otp) setTokenErrors({ otp: 'The code is wrong or has expired. Check it or send a new one.' });
      else if (found.label) { setTokenErrors({ label: found.label }); setTokenStep('name'); }
    }
  };

  const revoke = async (tokenId) => {
    try {
      setView(await run('revoke', () => revokeApiToken(property.id, tokenId), 'Token revoked.'));
    } catch { /* message shown */ }
  };

  // -------------------------------------------------------------- VCC password
  const setVccField = (key, value) => {
    setVcc((current) => ({ ...current, [key]: value }));
    setVccErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const sendVccReset = async () => {
    try {
      const sent = await run('vcc', () => requestSettingsCode(property.id, 'vcc-reset'));
      setVccReset(sent.destination);
      setVccField('otp', '');
      setStatus({ type: 'success', message: sent.message });
    } catch { /* message shown */ }
  };

  const submitVcc = async () => {
    const isSet = view.vcc.isSet;
    const found = {};
    if (isSet && !vccReset && !vcc.currentPassword) found.currentPassword = 'Enter the current VCC password.';
    if (isSet && vccReset && vcc.otp.length !== 6) found.otp = 'Enter the 6-digit code.';
    if (!isStrongPassword(vcc.newPassword)) found.newPassword = PASSWORD_HINT;
    if (vcc.confirmPassword !== vcc.newPassword) found.confirmPassword = 'Passwords do not match.';
    if (isSet && !vccReset && vcc.currentPassword && vcc.currentPassword === vcc.newPassword) found.newPassword = 'Choose a password different from the current one.';
    setVccErrors(found);
    if (Object.keys(found).length) {
      setStatus({ type: 'error', message: 'Check the highlighted VCC password fields.' });
      return;
    }
    const body = { newPassword: vcc.newPassword, confirmPassword: vcc.confirmPassword };
    if (isSet && vccReset) body.otp = vcc.otp;
    else if (isSet) body.currentPassword = vcc.currentPassword;
    try {
      const saved = await run('vcc', () => setVccPassword(property.id, body), isSet ? 'VCC password changed.' : 'VCC password set.');
      setView(saved);
      setVcc({ currentPassword: '', newPassword: '', confirmPassword: '', otp: '' });
      setVccReset('');
    } catch (problem) {
      const fieldErrors = formErrors(problem, FIELD_LABELS);
      if (fieldErrors.otp) fieldErrors.otp = 'The code is wrong or has expired. Check it or send a new one.';
      if (fieldErrors.currentPassword && /wrong/.test(fieldErrors.currentPassword)) fieldErrors.currentPassword = 'The current VCC password is wrong.';
      setVccErrors(fieldErrors);
    }
  };

  // -------------------------------------------------------------------- status
  const openConfirm = (action) => {
    setConfirmAction(action);
    setReason('');
    setReasonErr('');
    setDeleteConfirmed(false);
  };

  const confirmDeactivate = async () => {
    const problem = reasonError(reason);
    if (problem) { setReasonErr(problem); return; }
    try {
      const saved = await run('status', () => deactivateProperty(property.id, reason.trim()), 'Property deactivated. Guests can no longer find or book it.');
      setView(saved);
      setConfirmAction('');
      onReload?.();
    } catch (failure) {
      const found = formErrors(failure, FIELD_LABELS);
      if (found.reason) setReasonErr(found.reason);
      else setConfirmAction('');
    }
  };

  const reactivate = async () => {
    try {
      const saved = await run('status', () => reactivateProperty(property.id), 'Property reactivated. Guests can book it again.');
      setView(saved);
      onReload?.();
    } catch { /* message shown */ }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmed) return;
    try {
      await run('status', () => deleteProperty(property.id));
      navigate(PARTNER_PATHS.properties);
    } catch {
      setConfirmAction('');
    }
  };

  if (!view) {
    return (
      <div className="pset-workspace">
        {loadError ? (
          <div className="pset-status-bar is-error pset-retry" role="alert">
            <span>Settings could not be loaded: {loadError}</span>
            <button type="button" className="pset-btn is-light" onClick={() => setLoadKey((key) => key + 1)}><RefreshCw size={14} aria-hidden="true" />Try again</button>
          </div>
        ) : <div className="pset-status-bar" role="status">Loading settings…</div>}
      </div>
    );
  }

  const statusInfo = STATUS_INFO[view.status] ?? STATUS_INFO.DRAFT;
  const prefs = view.preferences;
  const tokensFull = view.apiTokens.length >= view.maxApiTokens;

  return (
    <div className="pset-workspace">
      <header className="pset-head">
        <div>
          <span className="pset-eyebrow"><ShieldCheck size={13} aria-hidden="true" />Property controls</span>
          <h2>Settings</h2>
          <p>Manage channel manager access, property status, alerts and VCC password protection.</p>
        </div>
        <span className={`pset-status is-${statusInfo.tone}`} title={statusInfo.hint}>{statusInfo.label}</span>
      </header>

      {status ? <div className={`pset-status-bar is-${status.type}`} role="status">{status.message}</div> : null}

      <div className="pset-grid">
        <section className="pset-card is-wide">
          <div className="pset-card-head">
            <span className="pset-card-icon"><KeyRound size={18} aria-hidden="true" /></span>
            <div><h3>Channel manager</h3><p>Connection details your channel manager uses to update rates and availability.</p></div>
          </div>
          <div className="pset-detail-grid">
            <div>
              <span>Hotel code</span>
              <strong className="pset-copyable">
                {view.hotelCode}
                <button type="button" className="pset-icon-btn" onClick={() => copyValue('code', view.hotelCode)} aria-label="Copy hotel code">
                  {copied === 'code' ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
                </button>
              </strong>
            </div>
            <div><span>Channel manager</span><strong>{channelManagerSummary(view)}</strong></div>
            <div><span>Status</span><strong>{statusInfo.label}</strong></div>
            <div><span>Created by</span><strong>{view.createdBy.name}</strong><small>{view.createdBy.email} · {formatTimestamp(view.createdAt)}</small></div>
          </div>

          <div className="pset-subhead">
            <h4>Access tokens</h4>
            <small>{view.apiTokens.length} of {view.maxApiTokens} active</small>
          </div>

          {newToken ? (
            <div className="pset-token-row is-new" role="group" aria-label="New access token">
              <div>
                <span>New access token — copy it now, it will not be shown again</span>
                <code>{newToken}</code>
              </div>
              <button type="button" className="pset-btn is-primary" onClick={() => copyValue('token', newToken)}>
                {copied === 'token' ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                {copied === 'token' ? 'Copied' : 'Copy'}
              </button>
              <button type="button" className="pset-btn is-light" onClick={() => setNewToken('')}>Done</button>
            </div>
          ) : null}

          <div className="pset-token-body">
            <TokenList tokens={view.apiTokens} busy={busy === 'revoke'} onRevoke={revoke} />

            {!view.actions.canCreateApiToken ? (
              <p className="pset-muted">Access tokens are available once the property is listed.</p>
            ) : tokenStep ? (
              <div className="pset-token-form">
                {tokenStep === 'name' ? (
                  <>
                    <TextField label={FIELD_LABELS.label} value={tokenLabel} onChange={(value) => { setTokenLabel(value); setTokenErrors({}); }} error={tokenErrors.label} placeholder="e.g. eZee channel manager" maxLength={40} />
                    <p className="pset-muted"><MailCheck size={13} aria-hidden="true" /> We will send a code to your sign-in e-mail to confirm it is you.</p>
                    <div className="pset-actions is-inline">
                      <button type="button" className="pset-btn is-light" onClick={() => setTokenStep(null)} disabled={busy === 'token'}>Cancel</button>
                      <button type="button" className="pset-btn is-primary" onClick={sendTokenCode} disabled={busy === 'token'}>{busy === 'token' ? 'Sending…' : 'Send code'}</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="pset-muted"><MailCheck size={13} aria-hidden="true" /> Enter the 6-digit code we sent to {tokenSentTo}. It is valid for 10 minutes.</p>
                    <TextField label={FIELD_LABELS.otp} value={tokenCode} onChange={(value) => { setTokenCode(digits(value)); setTokenErrors({}); }} error={tokenErrors.otp} placeholder="6-digit code" maxLength={6} inputMode="numeric" autoComplete="one-time-code" />
                    <div className="pset-actions is-inline">
                      <button type="button" className="pset-btn is-light" onClick={() => setTokenStep(null)} disabled={busy === 'token'}>Cancel</button>
                      <button type="button" className="pset-btn is-light" onClick={sendTokenCode} disabled={busy === 'token'}>Send a new code</button>
                      <button type="button" className="pset-btn is-primary" onClick={confirmToken} disabled={busy === 'token' || tokenCode.length !== 6}>{busy === 'token' ? 'Creating…' : 'Create token'}</button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="pset-actions is-inline">
                <button type="button" className="pset-btn is-light" onClick={startToken} disabled={tokensFull} title={tokensFull ? 'Revoke a token first' : undefined}>
                  <Plus size={14} aria-hidden="true" />{tokensFull ? `Limit of ${view.maxApiTokens} reached` : 'Create access token'}
                </button>
              </div>
            )}
          </div>

          <div className="pset-actions">
            {view.actions.canReactivate ? (
              <button type="button" className="pset-btn is-primary" onClick={reactivate} disabled={busy === 'status'}>
                <Power size={14} aria-hidden="true" />{busy === 'status' ? 'Working…' : 'Reactivate property'}
              </button>
            ) : null}
            {view.actions.canDeactivate ? (
              <button type="button" className="pset-btn is-danger-outline" onClick={() => openConfirm('deactivate')} disabled={busy === 'status'}>
                <Power size={14} aria-hidden="true" />Deactivate
              </button>
            ) : null}
            {view.actions.canDelete ? (
              <button type="button" className="pset-btn is-danger" onClick={() => openConfirm('delete')} disabled={busy === 'status'}>
                <Trash2 size={14} aria-hidden="true" />Delete property
              </button>
            ) : (
              <p className="pset-muted pset-delete-note">A listed property can not be deleted, because its bookings and payouts stay on record. Deactivate it instead.</p>
            )}
          </div>
        </section>

        <section className="pset-card">
          <div className="pset-card-head">
            <span className="pset-card-icon"><RotateCcw size={18} aria-hidden="true" /></span>
            <div><h3>Preferences</h3><p>Alerts and booking controls for this property.</p></div>
          </div>
          <div className="pset-preferences">
            {PREFERENCE_ITEMS.map(([key, label, detail]) => (
              <label className="pset-preference-row" key={key}>
                <input
                  type="checkbox"
                  checked={Boolean(prefs[key])}
                  disabled={busy === 'preferences'}
                  onChange={(event) => savePreferences({ ...prefs, [key]: event.target.checked })}
                />
                <span><strong>{label}</strong><small>{detail}</small></span>
              </label>
            ))}
          </div>
          {!prefs.onlineBookings ? <p className="pset-warning"><TriangleAlert size={14} aria-hidden="true" />Guests can not book this property online right now.</p> : null}
          <div className="pset-actions">
            <button
              type="button"
              className="pset-btn is-light"
              onClick={() => savePreferences(DEFAULT_PREFERENCES)}
              disabled={busy === 'preferences' || Object.entries(DEFAULT_PREFERENCES).every(([key, value]) => prefs[key] === value)}
            >
              Reset to defaults
            </button>
          </div>
        </section>

        <section className="pset-card">
          <div className="pset-card-head">
            <span className="pset-card-icon"><LockKeyhole size={18} aria-hidden="true" /></span>
            <div><h3>VCC password</h3><p>Protects the virtual credit card details of your bookings.</p></div>
          </div>
          <div className="pset-vcc-status">
            <ShieldCheck size={15} aria-hidden="true" />
            <span>{view.vcc.isSet ? `Password set · ${formatTimestamp(view.vcc.updatedAt)}` : 'No VCC password set yet.'}</span>
          </div>
          <div className="pset-vcc-form">
            {view.vcc.isSet && !vccReset ? (
              <>
                <PasswordField label={FIELD_LABELS.currentPassword} value={vcc.currentPassword} onChange={(value) => setVccField('currentPassword', value)} error={vccErrors.currentPassword} autoComplete="current-password" />
                <button type="button" className="pset-link-btn" onClick={sendVccReset} disabled={busy === 'vcc'}>Forgot it? Reset with an e-mail code</button>
              </>
            ) : null}
            {view.vcc.isSet && vccReset ? (
              <>
                <TextField label={`Code sent to ${vccReset}`} value={vcc.otp} onChange={(value) => setVccField('otp', digits(value))} error={vccErrors.otp} placeholder="6-digit code" maxLength={6} inputMode="numeric" autoComplete="one-time-code" />
                <button type="button" className="pset-link-btn" onClick={() => { setVccReset(''); setVccField('otp', ''); }} disabled={busy === 'vcc'}>Use the current password instead</button>
              </>
            ) : null}
            <PasswordField label={FIELD_LABELS.newPassword} value={vcc.newPassword} onChange={(value) => setVccField('newPassword', value)} error={vccErrors.newPassword} autoComplete="new-password" />
            <PasswordField label={FIELD_LABELS.confirmPassword} value={vcc.confirmPassword} onChange={(value) => setVccField('confirmPassword', value)} error={vccErrors.confirmPassword} autoComplete="new-password" />
            <small className="pset-muted">{PASSWORD_HINT}</small>
          </div>
          <div className="pset-actions">
            <button type="button" className="pset-btn is-primary" onClick={submitVcc} disabled={busy === 'vcc'}>
              {busy === 'vcc' ? 'Saving…' : view.vcc.isSet ? 'Change password' : 'Set password'}
            </button>
          </div>
        </section>
      </div>

      {confirmAction ? (
        <Modal title={confirmAction === 'delete' ? 'Delete this property?' : 'Deactivate this property?'} onClose={() => { if (busy !== 'status') setConfirmAction(''); }}>
          <div className="pset-modal">
            <div className="pset-modal-icon"><TriangleAlert size={20} aria-hidden="true" /></div>
            {confirmAction === 'delete' ? (
              <>
                <p>This removes the draft and its photos and documents from your account. This can not be undone.</p>
                <label className="pset-confirm-check">
                  <input type="checkbox" checked={deleteConfirmed} onChange={(event) => setDeleteConfirmed(event.target.checked)} />
                  <span>I understand this property will be permanently deleted.</span>
                </label>
              </>
            ) : (
              <>
                <p>Guests will no longer find or book this property. You can reactivate it any time.</p>
                {view.upcomingBookings ? (
                  <p className="pset-warning"><TriangleAlert size={14} aria-hidden="true" />{view.upcomingBookings} upcoming {view.upcomingBookings === 1 ? 'booking stays' : 'bookings stay'} confirmed: you still have to honour {view.upcomingBookings === 1 ? 'it' : 'them'}.</p>
                ) : null}
                <TextField label={`${FIELD_LABELS.reason} (optional)`} value={reason} onChange={(value) => { setReason(value); setReasonErr(''); }} error={reasonErr} placeholder="e.g. Closed for renovation until March" maxLength={300} multiline />
              </>
            )}
            <div className="pset-modal-actions">
              <button type="button" className="pset-btn is-light" onClick={() => setConfirmAction('')} disabled={busy === 'status'}>Cancel</button>
              <button
                type="button"
                className="pset-btn is-danger"
                onClick={confirmAction === 'delete' ? confirmDelete : confirmDeactivate}
                disabled={busy === 'status' || (confirmAction === 'delete' && !deleteConfirmed)}
              >
                {busy === 'status' ? 'Working…' : confirmAction === 'delete' ? 'Delete property' : 'Deactivate'}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
