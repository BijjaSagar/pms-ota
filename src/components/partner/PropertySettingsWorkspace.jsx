import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Power,
  RotateCcw,
  ShieldCheck,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { Modal } from '../Layout.jsx';
import { deleteProperty } from '../../lib/api/properties.js';
import { useAuth } from '../../lib/context/useAuth.js';
import { STATUS_INFO } from '../../lib/data/propertyStatus.js';
import {
  channelManagerSummary,
  createDemoAccessToken,
  createdByUser,
  effectiveStatus,
  formatTimestamp,
  hotelCode,
  loadPropertySettings,
  maskAccessToken,
  savePropertySettings,
} from '../../lib/data/propertySettings.js';
import { isStrongPassword } from '../../lib/utils/password.js';
import { PARTNER_PATHS } from './paths.js';
import '../../styles/partner-property-settings.css';

const SETTINGS_CATEGORIES = [
  { id: 'channel-manager', label: 'Channel manager', description: 'Connection details, status and preferences.', icon: KeyRound },
  { id: 'vcc', label: 'VCC', description: 'Password for viewing card details.', icon: LockKeyhole },
];

function PasswordField({ label, value, onChange, error, shown, onToggle, autoComplete }) {
  return (
    <div className={`pset-field ${error ? 'has-error' : ''}`}>
      <span>{label}</span>
      <div className="pset-password-control">
        <input aria-label={label} type={shown ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} />
        <button type="button" onClick={onToggle} aria-label={shown ? `Hide ${label}` : `Show ${label}`}>
          {shown ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
        </button>
      </div>
      {error ? <small className="pset-field-error" role="alert">{error}</small> : null}
    </div>
  );
}

export default function PropertySettingsWorkspace({ property }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [settings, setSettings] = useState(() => loadPropertySettings(property.id));
  const [copied, setCopied] = useState('');
  const [revealToken, setRevealToken] = useState(false);
  const [confirmAction, setConfirmAction] = useState('');
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [vcc, setVcc] = useState({ setPassword: '', newPassword: '', confirmPassword: '' });
  const [showVcc, setShowVcc] = useState({ setPassword: false, newPassword: false, confirmPassword: false });
  const [vccErrors, setVccErrors] = useState({});
  const [activeCategory, setActiveCategory] = useState('channel-manager');

  const accessToken = useMemo(() => createDemoAccessToken(property), [property.id, property.reference]);
  const statusInfo = STATUS_INFO[effectiveStatus(property, settings)] ?? STATUS_INFO.DRAFT;
  const activeCategoryInfo = SETTINGS_CATEGORIES.find((item) => item.id === activeCategory) ?? SETTINGS_CATEGORIES[0];

  const updateSettings = (patch) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      savePropertySettings(property.id, next);
      return next;
    });
  };

  const copyValue = async (label, value) => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(label);
      window.setTimeout(() => setCopied(''), 1500);
    } catch {
      setStatus({ type: 'error', message: 'Copy is not available in this browser.' });
    }
  };

  const confirmDeactivate = () => {
    updateSettings({ deactivated: true });
    setConfirmAction('');
    setStatus({ type: 'success', message: 'Property deactivated in this browser session.' });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmed) return;
    setBusy(true);
    setStatus(null);
    try {
      await deleteProperty(property.id);
      navigate(PARTNER_PATHS.properties);
    } catch (problem) {
      setStatus({ type: 'error', message: problem?.message || 'Could not delete this property.' });
      setConfirmAction('');
      setDeleteConfirmed(false);
    } finally {
      setBusy(false);
    }
  };

  const setVccField = (key, value) => {
    setVcc((current) => ({ ...current, [key]: value }));
    setVccErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setStatus(null);
  };

  const submitVcc = () => {
    const found = {};
    if (!isStrongPassword(vcc.setPassword)) found.setPassword = 'Enter a strong VCC password.';
    if (!isStrongPassword(vcc.newPassword)) found.newPassword = 'Use 8-64 characters with a letter, number and special character, with no spaces.';
    if (vcc.confirmPassword !== vcc.newPassword) found.confirmPassword = 'Passwords do not match.';
    setVccErrors(found);
    if (Object.keys(found).length) {
      setStatus({ type: 'error', message: 'Check the highlighted VCC password fields.' });
      return;
    }
    updateSettings({ vccPasswordSet: true, vccUpdatedAt: new Date().toISOString() });
    setVcc({ setPassword: '', newPassword: '', confirmPassword: '' });
    setStatus({ type: 'success', message: 'VCC password submitted.' });
  };

  const preferenceItems = [
    ['onlineBookings', 'Accept online bookings', 'Allow guests to book this property on TriponX.'],
    ['emailAlerts', 'Email notifications', 'Receive booking and payment alerts by email.'],
    ['smsAlerts', 'SMS alerts', 'Receive urgent booking alerts by SMS.'],
    ['priceAlerts', 'Rate change alerts', 'Get notified when market rates shift significantly.'],
  ];

  const resetPreferences = () => {
    updateSettings({
      onlineBookings: true,
      emailAlerts: true,
      smsAlerts: false,
      priceAlerts: true,
    });
    setStatus({ type: 'success', message: 'Preferences reset to defaults.' });
  };

  return (
    <div className="pset-workspace">
      <header className="pset-head">
        <div>
          <span className="pset-eyebrow"><ShieldCheck size={13} aria-hidden="true" />Property controls</span>
          <h2>Settings</h2>
          <p>Manage channel manager access, property status and VCC password protection.</p>
        </div>
        <span className={`pset-status is-${statusInfo.tone}`}>{statusInfo.label}</span>
      </header>

      {status ? <div className={`pset-status-bar is-${status.type}`} role="status">{status.message}</div> : null}

      <div className="pset-layout">
        <aside className="pset-sidebar" role="tablist" aria-label="Settings categories">
          {SETTINGS_CATEGORIES.map((item) => {
            const Icon = item.icon;
            const selected = activeCategory === item.id;
            return (
              <button
                type="button"
                key={item.id}
                id={`pset-tab-${item.id}`}
                role="tab"
                aria-selected={selected}
                aria-controls="pset-panel"
                className={`pset-category ${selected ? 'is-active' : ''}`}
                onClick={() => setActiveCategory(item.id)}
              >
                <span className="pset-category-icon"><Icon size={17} aria-hidden="true" /></span>
                <span className="pset-category-copy">
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
              </button>
            );
          })}
        </aside>

        <div className="pset-content" id="pset-panel" role="tabpanel" aria-labelledby={`pset-tab-${activeCategoryInfo.id}`}>
          {activeCategory === 'channel-manager' ? (
            <>
              <section className="pset-card">
                <div className="pset-card-head">
                  <span className="pset-card-icon"><KeyRound size={18} aria-hidden="true" /></span>
                  <div><h3>Channel manager</h3><p>Private connection details used to identify this property.</p></div>
                </div>
                <div className="pset-detail-grid">
                  <div><span>Hotel code</span><strong>{hotelCode(property)}</strong></div>
                  <div><span>Channel manager</span><strong>{channelManagerSummary(property)}</strong></div>
                  <div><span>Status</span><strong>{statusInfo.label}</strong></div>
                  <div><span>Created by</span><strong>{createdByUser(property, user)}</strong></div>
                </div>
                <div className="pset-token-row">
                  <div>
                    <span>Access token</span>
                    <code>{revealToken ? accessToken : maskAccessToken(accessToken)}</code>
                  </div>
                  <button type="button" className="pset-btn is-light" onClick={() => setRevealToken((current) => !current)}>
                    {revealToken ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
                    {revealToken ? 'Hide' : 'Reveal'}
                  </button>
                  <button type="button" className="pset-btn is-light" onClick={() => copyValue('token', accessToken)}>
                    {copied === 'token' ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                    {copied === 'token' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="pset-actions">
                  <button
                    type="button"
                    className="pset-btn is-danger-outline"
                    onClick={() => { setDeleteConfirmed(false); setConfirmAction('deactivate'); }}
                    disabled={settings.deactivated}
                  >
                    <Power size={14} aria-hidden="true" />{settings.deactivated ? 'Deactivated' : 'Deactivate'}
                  </button>
                  <button type="button" className="pset-btn is-danger" onClick={() => { setDeleteConfirmed(false); setConfirmAction('delete'); }}>
                    <Trash2 size={14} aria-hidden="true" />Delete property
                  </button>
                </div>
              </section>

              <section className="pset-card">
                <div className="pset-card-head">
                  <span className="pset-card-icon"><RotateCcw size={18} aria-hidden="true" /></span>
                  <div><h3>Preferences</h3><p>Alerts and booking controls for this property.</p></div>
                </div>
                <div className="pset-preferences">
                  {preferenceItems.map(([key, label, detail]) => (
                    <label className="pset-preference-row" key={key}>
                      <input
                        type="checkbox"
                        checked={Boolean(settings[key])}
                        onChange={(event) => updateSettings({ [key]: event.target.checked })}
                      />
                      <span><strong>{label}</strong><small>{detail}</small></span>
                    </label>
                  ))}
                </div>
                <div className="pset-actions"><button type="button" className="pset-btn is-light" onClick={resetPreferences}>Reset to defaults</button></div>
              </section>
            </>
          ) : (
            <section className="pset-card">
              <div className="pset-card-head">
                <span className="pset-card-icon"><LockKeyhole size={18} aria-hidden="true" /></span>
                <div><h3>VCC password</h3><p>Set password for checking visual credit card details.</p></div>
              </div>
              <div className="pset-vcc-status">
                <ShieldCheck size={15} aria-hidden="true" />
                <span>{settings.vccPasswordSet ? `Password set · ${formatTimestamp(settings.vccUpdatedAt)}` : 'No VCC password set yet.'}</span>
              </div>
              <div className="pset-vcc-form">
                <PasswordField
                  label="Set password for VCC"
                  value={vcc.setPassword}
                  onChange={(value) => setVccField('setPassword', value)}
                  error={vccErrors.setPassword}
                  shown={showVcc.setPassword}
                  onToggle={() => setShowVcc((current) => ({ ...current, setPassword: !current.setPassword }))}
                  autoComplete="new-password"
                />
                <PasswordField
                  label="New password"
                  value={vcc.newPassword}
                  onChange={(value) => setVccField('newPassword', value)}
                  error={vccErrors.newPassword}
                  shown={showVcc.newPassword}
                  onToggle={() => setShowVcc((current) => ({ ...current, newPassword: !current.newPassword }))}
                  autoComplete="new-password"
                />
                <PasswordField
                  label="Confirm password"
                  value={vcc.confirmPassword}
                  onChange={(value) => setVccField('confirmPassword', value)}
                  error={vccErrors.confirmPassword}
                  shown={showVcc.confirmPassword}
                  onToggle={() => setShowVcc((current) => ({ ...current, confirmPassword: !current.confirmPassword }))}
                  autoComplete="new-password"
                />
              </div>
              <div className="pset-actions"><button type="button" className="pset-btn is-primary" onClick={submitVcc}>Submit password</button></div>
            </section>
          )}
        </div>
      </div>

      {confirmAction ? (
        <Modal title={confirmAction === 'delete' ? 'Delete this property?' : 'Deactivate this property?'} onClose={() => setConfirmAction('')}>
          <div className="pset-modal">
            <div className="pset-modal-icon"><TriangleAlert size={20} aria-hidden="true" /></div>
            <p>{confirmAction === 'delete'
              ? 'This removes the property from your account. This cannot be undone.'
              : 'The property status will change to Suspended in this browser session.'}</p>
            {confirmAction === 'delete' ? (
              <label className="pset-confirm-check">
                <input type="checkbox" checked={deleteConfirmed} onChange={(event) => setDeleteConfirmed(event.target.checked)} />
                <span>I understand this property will be permanently deleted.</span>
              </label>
            ) : null}
            <div className="pset-modal-actions">
              <button type="button" className="pset-btn is-light" onClick={() => setConfirmAction('')}>Cancel</button>
              <button
                type="button"
                className="pset-btn is-danger"
                onClick={confirmAction === 'delete' ? confirmDelete : confirmDeactivate}
                disabled={busy || (confirmAction === 'delete' && !deleteConfirmed)}
              >
                {busy ? 'Working…' : confirmAction === 'delete' ? 'Delete property' : 'Deactivate'}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
