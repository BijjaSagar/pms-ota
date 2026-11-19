// Partner Hub sign-in card (List your property).
//   Sign in:         email + password  -> OTP popup -> signed in
//   Create account:  name + email + password + confirm -> OTP popup (confirms email) -> account created
//   Forgot password: email -> OTP popup -> new password + confirm -> back to Sign in
// Demo OTP = today's date as DDMMYY (lib/utils/otp.js). Accounts are the same TriponX accounts as the main site.
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Check, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Modal } from '../Layout.jsx';
import { OtpInput, emptyOtp } from '../auth/OtpInput.jsx';
import { useAuth } from '../../lib/context/useAuth.js';
import { OTP_LENGTH, verifyOtp } from '../../lib/utils/otp.js';
import { PASSWORD_MIN, PASSWORD_RULES, checkPassword, hashPassword, isStrongPassword } from '../../lib/utils/password.js';
import '../../styles/auth.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RESEND_SECONDS = 30;
const SIGN_IN_ERROR = 'Incorrect email or password. Never set a password? Use “Forgot your password?”.';

// ---------- small pieces ----------
function PasswordField({ label, value, onChange, error, placeholder, autoComplete, hint, children }) {
  const [show, setShow] = useState(false);
  return (
    <label className={`form-field ${error ? 'has-error' : ''}`}>
      {label}
      <span className="pw-field">
        <input type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder}
          autoComplete={autoComplete} aria-invalid={Boolean(error)} />
        <button type="button" className="pw-toggle" onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}>
          {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </span>
      {hint && !error && <span className="muted-xs">{hint}</span>}
      {error && <span className="field-error" role="alert">{error}</span>}
      {children}
    </label>
  );
}

function PasswordChecklist({ password }) {
  if (!password) return null;
  return (
    <ul className="pw-rules" aria-label="Password requirements">
      {PASSWORD_RULES.map(([test, label]) => {
        const ok = test(password);
        return <li key={label} className={ok ? 'ok' : ''}><Check size={13} aria-hidden="true" />{label}</li>;
      })}
    </ul>
  );
}

function Field({ label, error, hint, ...props }) {
  return (
    <label className={`form-field ${error ? 'has-error' : ''}`}>
      {label}
      <input {...props} aria-invalid={Boolean(error)} />
      {hint && !error && <span className="muted-xs">{hint}</span>}
      {error && <span className="field-error" role="alert">{error}</span>}
    </label>
  );
}

// ---------- OTP popup ----------
const OTP_TITLES = { signin: 'Enter verification code', signup: 'Confirm your email', forgot: 'Verify it’s you' };

function OtpDialog({ purpose, email, onVerified, onClose }) {
  const [code, setCode] = useState(emptyOtp);
  const [error, setError] = useState('');
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const [otpKey, setOtpKey] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const submit = (e) => {
    e.preventDefault();
    const value = code.join('');
    if (value.length !== OTP_LENGTH) { setError(`Enter the ${OTP_LENGTH}-digit code.`); return; }
    if (!verifyOtp(value)) { setError('That code is not correct. Please try again.'); return; }
    onVerified();
  };

  const resend = () => { setCode(emptyOtp()); setError(''); setResendIn(RESEND_SECONDS); setOtpKey((k) => k + 1); };

  return createPortal(
    <Modal title={OTP_TITLES[purpose]} onClose={onClose}>
      <form className="auth auth-form" onSubmit={submit} noValidate>
        <p className="auth-sub">Enter the {OTP_LENGTH}-digit code sent to <strong>{email}</strong>.</p>
        <OtpInput key={otpKey} value={code} onChange={(next) => { setCode(next); setError(''); }} invalid={Boolean(error)} />
        {error && <p className="field-error auth-center" role="alert">{error}</p>}
        <button type="submit" className="btn btn-dark btn-block auth-cta">
          {purpose === 'signin' ? 'Verify & sign in' : 'Verify'}
        </button>
        <div className="auth-otp-links">
          {resendIn > 0
            ? <span className="muted-xs">Resend code in {resendIn}s</span>
            : <button type="button" className="auth-link" onClick={resend}>Resend code</button>}
        </div>
      </form>
    </Modal>,
    document.body,
  );
}

// ---------- card ----------
export function PartnerAuthCard() {
  const { findUser, register, updateUser, login } = useAuth();
  const [view, setView] = useState('signin'); // 'signin' | 'signup' | 'forgot' | 'reset'
  const [form, setForm] = useState({ identifier: '', password: '', name: '', email: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [otp, setOtp] = useState(null); // { purpose, email, onVerified }
  const [resetUserId, setResetUserId] = useState(null);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => (er[key] || er.form ? { ...er, [key]: undefined, form: undefined } : er));
  };
  const go = (next) => { setView(next); setErrors({}); setNotice(''); };
  const closeOtp = useCallback(() => setOtp(null), []); // stable: Modal re-focuses when onClose changes

  // ----- Sign in: password check, then OTP -----
  const signIn = async (e) => {
    e.preventDefault();
    const er = {};
    if (!form.identifier.trim()) er.identifier = 'Enter your username or email address.';
    if (!form.password) er.password = 'Enter your password.';
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    const user = form.identifier.includes('@') ? findUser('email', form.identifier) : null; // no usernames yet
    const ok = await checkPassword(user, form.password);
    setBusy(false);
    // Same message for unknown email and wrong password, so accounts can't be probed.
    if (!ok) { setErrors({ form: SIGN_IN_ERROR }); return; }
    setOtp({
      purpose: 'signin',
      email: user.email,
      onVerified: () => { login(findUser('email', user.email) ?? user); setOtp(null); },
    });
  };

  // ----- Create account: validate, hash, then OTP to confirm the email -----
  const signUp = async (e) => {
    e.preventDefault();
    const er = {};
    const name = form.name.trim().replace(/\s+/g, ' ');
    if (name.length < 2 || !/[A-Za-z]/.test(name)) er.name = 'Enter your first and last name.';
    if (!EMAIL_RE.test(form.email.trim())) er.email = 'Enter a valid email address.';
    else if (findUser('email', form.email)) er.email = 'An account with this email already exists. Sign in instead.';
    if (!isStrongPassword(form.newPassword)) er.newPassword = `Use at least ${PASSWORD_MIN} characters with letters, numbers and special characters.`;
    if (!form.confirm) er.confirm = 'Confirm your password.';
    else if (form.confirm !== form.newPassword) er.confirm = 'Passwords do not match.';
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    const passwordHash = await hashPassword(form.email, form.newPassword);
    setBusy(false);
    const email = form.email.trim().toLowerCase();
    setOtp({
      purpose: 'signup',
      email,
      onVerified: () => {
        const existing = findUser('email', email); // another tab may have registered it meanwhile
        if (existing) { setOtp(null); setErrors({ email: 'An account with this email already exists. Sign in instead.' }); return; }
        register({ name, email, passwordHash }); // also signs in
        setOtp(null);
      },
    });
  };

  // ----- Forgot password: OTP proves the email, then set a new password -----
  const forgot = (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(form.email.trim())) { setErrors({ email: 'Enter a valid email address.' }); return; }
    const email = form.email.trim().toLowerCase();
    setOtp({
      purpose: 'forgot',
      email,
      onVerified: () => {
        setOtp(null);
        const user = findUser('email', email);
        // Only revealed after the code proves the person controls this inbox.
        if (!user) { setErrors({ email: 'No TriponX account uses this email. Create an account instead.' }); return; }
        setResetUserId(user.id);
        setForm((f) => ({ ...f, newPassword: '', confirm: '' }));
        go('reset');
      },
    });
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    const er = {};
    if (!isStrongPassword(form.newPassword)) er.newPassword = `Use at least ${PASSWORD_MIN} characters with letters, numbers and special characters.`;
    if (!form.confirm) er.confirm = 'Confirm your password.';
    else if (form.confirm !== form.newPassword) er.confirm = 'Passwords do not match.';
    setErrors(er);
    if (Object.keys(er).length) return;
    const email = form.email.trim().toLowerCase();
    setBusy(true);
    const passwordHash = await hashPassword(email, form.newPassword);
    setBusy(false);
    updateUser(resetUserId, { passwordHash });
    setForm((f) => ({ ...f, identifier: email, password: '', newPassword: '', confirm: '' }));
    go('signin');
    setNotice('Password updated. Sign in with your new password.');
  };

  const title = {
    signin: 'Sign in to manage your property',
    signup: 'Create your partner account',
    forgot: 'Forgot your password?',
    reset: 'Set a new password',
  }[view];
  const sub = {
    signin: 'Welcome back! Please enter your details.',
    signup: 'List your property on TriponX in a few minutes.',
    forgot: 'Enter the email you signed up with. We’ll send a code to reset your password.',
    reset: `Choose a new password for ${form.email.trim().toLowerCase()}.`,
  }[view];

  return (
    <div className="partner-auth">
      <h2 className="lp-panel-title">{title}</h2>
      <p className="muted-sm lp-panel-sub">{sub}</p>
      {notice && <p className="lp-notice" role="status"><CheckCircle2 size={16} aria-hidden="true" />{notice}</p>}

      {view === 'signin' && (
        <form className="auth-form" onSubmit={signIn} noValidate>
          <Field label="Username/Email address" placeholder="Enter your username or email address" autoComplete="username"
            value={form.identifier} onChange={set('identifier')} error={errors.identifier} />
          <PasswordField label="Password" placeholder="Enter your password" autoComplete="current-password"
            value={form.password} onChange={set('password')} error={errors.password} />
          <button type="button" className="auth-link lp-forgot" onClick={() => { setForm((f) => ({ ...f, email: f.identifier.includes('@') ? f.identifier : f.email })); go('forgot'); }}>
            Forgot your password?
          </button>
          {errors.form && <p className="field-error" role="alert">{errors.form}</p>}
          <button type="submit" className="btn btn-dark btn-block auth-cta" disabled={busy}>Sign in</button>
          <p className="auth-switch">New to TriponX?<button type="button" className="auth-link" onClick={() => go('signup')}>Create an account</button></p>
        </form>
      )}

      {view === 'signup' && (
        <form className="auth-form" onSubmit={signUp} noValidate>
          <Field label="Your name" placeholder="First and last name" autoComplete="name"
            value={form.name} onChange={set('name')} error={errors.name} />
          <Field label="Email address" type="email" inputMode="email" placeholder="Enter your email address" autoComplete="email"
            value={form.email} onChange={set('email')} error={errors.email} hint="We will send a confirmation code to your email." />
          <PasswordField label="Password" placeholder={`Enter at least ${PASSWORD_MIN} characters`} autoComplete="new-password"
            value={form.newPassword} onChange={set('newPassword')} error={errors.newPassword}
            hint="Use letters, numbers, and special characters.">
            <PasswordChecklist password={form.newPassword} />
          </PasswordField>
          <PasswordField label="Confirm new password" placeholder="Re-enter your password" autoComplete="new-password"
            value={form.confirm} onChange={set('confirm')} error={errors.confirm} />
          <button type="submit" className="btn btn-dark btn-block auth-cta" disabled={busy}>Create account</button>
          <p className="auth-switch">Already have an account?<button type="button" className="auth-link" onClick={() => go('signin')}>Sign in</button></p>
        </form>
      )}

      {view === 'forgot' && (
        <form className="auth-form" onSubmit={forgot} noValidate>
          <Field label="Email address" type="email" inputMode="email" placeholder="Enter your email address" autoComplete="email"
            value={form.email} onChange={set('email')} error={errors.email} />
          <button type="submit" className="btn btn-dark btn-block auth-cta">Send code</button>
          <button type="button" className="auth-back auth-center" onClick={() => go('signin')}><ArrowLeft size={15} />Back to sign in</button>
        </form>
      )}

      {view === 'reset' && (
        <form className="auth-form" onSubmit={resetPassword} noValidate>
          <PasswordField label="New password" placeholder={`Enter at least ${PASSWORD_MIN} characters`} autoComplete="new-password"
            value={form.newPassword} onChange={set('newPassword')} error={errors.newPassword}
            hint="Use letters, numbers, and special characters.">
            <PasswordChecklist password={form.newPassword} />
          </PasswordField>
          <PasswordField label="Confirm new password" placeholder="Re-enter your password" autoComplete="new-password"
            value={form.confirm} onChange={set('confirm')} error={errors.confirm} />
          <button type="submit" className="btn btn-dark btn-block auth-cta" disabled={busy}>Update password</button>
        </form>
      )}

      {otp && <OtpDialog purpose={otp.purpose} email={otp.email} onVerified={otp.onVerified} onClose={closeOtp} />}
    </div>
  );
}
