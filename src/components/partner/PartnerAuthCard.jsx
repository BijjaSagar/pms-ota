// Partner Hub sign-in card (List your property), backed by /api/v1/partner/auth/*.
//   Sign in:         email + password  -> code popup -> signed in
//   Create account:  name + email + password + confirm -> code popup (confirms email) -> account created + signed in
//   Forgot password: email -> code popup -> new password + confirm -> back to Sign in
// Partner accounts are separate from main-site guest accounts.
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Check, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Modal } from '../Layout.jsx';
import { OtpInput, emptyOtp } from '../auth/OtpInput.jsx';
import { useAuth } from '../../lib/context/useAuth.js';
import { OTP_LENGTH } from '../../lib/utils/otp.js';
import { PASSWORD_MAX, PASSWORD_MIN, PASSWORD_RULES, isStrongPassword } from '../../lib/utils/password.js';
import { revealFirstError } from '../../lib/utils/revealError.js';
import '../../styles/auth.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RESEND_SECONDS = 60;
const PASSWORD_HINT = `Use ${PASSWORD_MIN}-${PASSWORD_MAX} characters with a letter, a number and a special character, and no spaces.`;

// API field names -> this form's field names.
const FIELD_MAP = { fullName: 'name', email: 'email', password: 'newPassword', confirmPassword: 'confirm' };
const LABELS = { name: 'Name', email: 'Email', newPassword: 'Password', confirm: 'Confirm password' };

// An API error -> { field: message } for this form (falls back to a form-level message).
function formErrors(error, { passwordField = 'newPassword' } = {}) {
  const out = {};
  for (const [apiField, msg] of Object.entries(error?.fieldErrors ?? {})) {
    const field = apiField === 'password' ? passwordField : FIELD_MAP[apiField];
    if (!field) continue;
    out[field] = /^[A-Z]/.test(msg) ? msg : `${LABELS[field] ?? 'This'} ${msg}.`.replace(/\.\.$/, '.');
  }
  if (!Object.keys(out).length) out.form = error?.message || 'Something went wrong. Please try again.';
  return out;
}

// ---------- small pieces ----------
function PasswordField({ label, value, onChange, error, placeholder, autoComplete, hint, children }) {
  const [show, setShow] = useState(false);
  return (
    <label className={`form-field ${error ? 'has-error' : ''}`}>
      {label}
      <span className="pw-field">
        <input type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder}
          autoComplete={autoComplete} maxLength={PASSWORD_MAX + 16} aria-invalid={Boolean(error)} />
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

// ---------- code popup ----------
const OTP_TITLES = { signin: 'Enter verification code', signup: 'Confirm your email', forgot: 'Verify it’s you' };

// onVerify(code) / onResend() return promises; a rejected onVerify shows its message here.
function OtpDialog({ purpose, destination, resendAfter, onVerify, onResend, onClose }) {
  const [code, setCode] = useState(emptyOtp);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(resendAfter || RESEND_SECONDS);
  const [otpKey, setOtpKey] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const value = code.join('');
    if (value.length !== OTP_LENGTH) { setError(`Enter the ${OTP_LENGTH}-digit code.`); return; }
    setBusy(true);
    try {
      await onVerify(value);
    } catch (err) {
      setError(err?.fieldErrors?.otp ? 'That code is wrong or has expired. Check it or ask for a new one.' : (err?.message || 'That code didn’t work. Please try again.'));
      setBusy(false);
    }
  };

  const resend = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await onResend();
      setCode(emptyOtp()); setError(''); setOtpKey((k) => k + 1);
      setResendIn(res?.resendAfterSeconds || RESEND_SECONDS);
    } catch (err) {
      setError(err?.message || 'Could not send a new code. Please try again.');
      if (err?.retryAfterSeconds) setResendIn(err.retryAfterSeconds);
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <Modal title={OTP_TITLES[purpose]} onClose={onClose}>
      <form className="auth auth-form" onSubmit={submit} noValidate>
        <p className="auth-sub">Enter the {OTP_LENGTH}-digit code sent to <strong>{destination}</strong>.</p>
        <OtpInput key={otpKey} value={code} onChange={(next) => { setCode(next); setError(''); }} invalid={Boolean(error)} />
        {error && <p className="field-error auth-center" role="alert">{error}</p>}
        <button type="submit" className="btn btn-dark btn-block auth-cta" disabled={busy} aria-busy={busy}>
          {busy ? 'Checking…' : purpose === 'signin' ? 'Verify & sign in' : 'Verify'}
        </button>
        <div className="auth-otp-links">
          {resendIn > 0
            ? <span className="muted-xs">Resend code in {resendIn}s</span>
            : <button type="button" className="auth-link" onClick={resend} disabled={busy}>Resend code</button>}
        </div>
      </form>
    </Modal>,
    document.body,
  );
}

// ---------- card ----------
export function PartnerAuthCard() {
  const { partner } = useAuth();
  const [view, setView] = useState('signin'); // 'signin' | 'signup' | 'forgot' | 'reset'
  const [form, setForm] = useState({ identifier: '', password: '', name: '', email: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [otp, setOtp] = useState(null); // { purpose, destination, resendAfter, onVerify, onResend }
  const [resetToken, setResetToken] = useState(null);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => (er[key] || er.form ? { ...er, [key]: undefined, form: undefined } : er));
  };
  const go = (next) => { setView(next); setErrors({}); setNotice(''); };
  const closeOtp = useCallback(() => setOtp(null), []); // stable: Modal re-focuses when onClose changes
  const fail = (er) => { setErrors(er); revealFirstError(); };

  // ----- Sign in: email + password, then a code -----
  const signIn = async (e) => {
    e.preventDefault();
    if (busy) return;
    const er = {};
    if (!EMAIL_RE.test(form.identifier.trim())) er.identifier = 'Enter the email address you signed up with.';
    if (!form.password) er.password = 'Enter your password.';
    if (Object.keys(er).length) { fail(er); return; }
    setBusy(true);
    try {
      const email = form.identifier.trim().toLowerCase();
      const challenge = await partner.login(email, form.password);
      setErrors({});
      setOtp({
        purpose: 'signin',
        destination: challenge.destination,
        resendAfter: challenge.resendAfterSeconds,
        onVerify: (code) => partner.verifyLogin(challenge.challengeId, code), // signs in -> page redirects
        onResend: () => partner.resendOtp('login', { challengeId: challenge.challengeId }),
      });
    } catch (err) {
      // Same message for unknown email and wrong password (the API does the same), so accounts can't be probed.
      fail(err.status === 401 || err.status === 400 ? { form: err.message || 'Incorrect email or password.' } : { form: err.message });
    } finally {
      setBusy(false);
    }
  };

  // ----- Create account: details, then a code to confirm the email -----
  const signUp = async (e) => {
    e.preventDefault();
    if (busy) return;
    const er = {};
    const fullName = form.name.trim().replace(/\s+/g, ' ');
    if (fullName.length < 2 || !/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u.test(fullName)) er.name = 'Enter your full name (letters only).';
    if (!EMAIL_RE.test(form.email.trim())) er.email = 'Enter a valid email address.';
    if (!isStrongPassword(form.newPassword)) er.newPassword = PASSWORD_HINT;
    if (!form.confirm) er.confirm = 'Confirm your password.';
    else if (form.confirm !== form.newPassword) er.confirm = 'Passwords do not match.';
    if (Object.keys(er).length) { fail(er); return; }
    setBusy(true);
    const email = form.email.trim().toLowerCase();
    try {
      const sent = await partner.signup({ fullName, email, password: form.newPassword, confirmPassword: form.confirm });
      setErrors({});
      setOtp({
        purpose: 'signup',
        destination: sent.destination || email,
        resendAfter: sent.resendAfterSeconds,
        onVerify: (code) => partner.verifySignup(email, code), // account created + signed in
        onResend: () => partner.resendOtp('signup', { email }),
      });
    } catch (err) {
      fail(formErrors(err));
    } finally {
      setBusy(false);
    }
  };

  // ----- Forgot password: the code proves the email, then set a new password -----
  const forgot = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!EMAIL_RE.test(form.email.trim())) { fail({ email: 'Enter a valid email address.' }); return; }
    const email = form.email.trim().toLowerCase();
    setBusy(true);
    try {
      const sent = await partner.forgotPassword(email);
      setErrors({});
      setOtp({
        purpose: 'forgot',
        destination: sent?.destination || email,
        resendAfter: sent?.resendAfterSeconds,
        onVerify: async (code) => {
          const res = await partner.verifyResetOtp(email, code);
          setResetToken(res.resetToken);
          setOtp(null);
          setForm((f) => ({ ...f, newPassword: '', confirm: '' }));
          go('reset');
        },
        onResend: () => partner.forgotPassword(email),
      });
    } catch (err) {
      fail(formErrors(err));
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (busy) return;
    const er = {};
    if (!isStrongPassword(form.newPassword)) er.newPassword = PASSWORD_HINT;
    if (!form.confirm) er.confirm = 'Confirm your password.';
    else if (form.confirm !== form.newPassword) er.confirm = 'Passwords do not match.';
    if (Object.keys(er).length) { fail(er); return; }
    setBusy(true);
    try {
      await partner.resetPassword(resetToken, form.newPassword, form.confirm);
      const email = form.email.trim().toLowerCase();
      setResetToken(null);
      setForm((f) => ({ ...f, identifier: email, password: '', newPassword: '', confirm: '' }));
      go('signin');
      setNotice('Password updated. Sign in with your new password.');
    } catch (err) {
      if (err.status === 400 && err.fieldErrors?.resetToken) {
        go('forgot');
        setErrors({ email: 'That reset link has expired. Ask for a new code.' });
      } else {
        fail(formErrors(err));
      }
    } finally {
      setBusy(false);
    }
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
          <Field label="Email address" type="email" inputMode="email" placeholder="Enter your email address" autoComplete="username"
            value={form.identifier} onChange={set('identifier')} error={errors.identifier} />
          <PasswordField label="Password" placeholder="Enter your password" autoComplete="current-password"
            value={form.password} onChange={set('password')} error={errors.password} />
          <button type="button" className="auth-link lp-forgot" onClick={() => { setForm((f) => ({ ...f, email: f.identifier.includes('@') ? f.identifier : f.email })); go('forgot'); }}>
            Forgot your password?
          </button>
          {errors.form && <p className="field-error" role="alert">{errors.form}</p>}
          <button type="submit" className="btn btn-dark btn-block auth-cta" disabled={busy} aria-busy={busy}>{busy ? 'Checking…' : 'Sign in'}</button>
          <p className="auth-switch">New to TriponX?<button type="button" className="auth-link" onClick={() => go('signup')}>Create an account</button></p>
        </form>
      )}

      {view === 'signup' && (
        <form className="auth-form" onSubmit={signUp} noValidate>
          <Field label="Your name" placeholder="First and last name" autoComplete="name" maxLength={100}
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
          {errors.form && <p className="field-error" role="alert">{errors.form}</p>}
          <button type="submit" className="btn btn-dark btn-block auth-cta" disabled={busy} aria-busy={busy}>{busy ? 'Creating…' : 'Create account'}</button>
          <p className="auth-switch">Already have an account?<button type="button" className="auth-link" onClick={() => go('signin')}>Sign in</button></p>
        </form>
      )}

      {view === 'forgot' && (
        <form className="auth-form" onSubmit={forgot} noValidate>
          <Field label="Email address" type="email" inputMode="email" placeholder="Enter your email address" autoComplete="email"
            value={form.email} onChange={set('email')} error={errors.email} />
          {errors.form && <p className="field-error" role="alert">{errors.form}</p>}
          <button type="submit" className="btn btn-dark btn-block auth-cta" disabled={busy} aria-busy={busy}>{busy ? 'Sending…' : 'Send code'}</button>
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
          {errors.form && <p className="field-error" role="alert">{errors.form}</p>}
          <button type="submit" className="btn btn-dark btn-block auth-cta" disabled={busy} aria-busy={busy}>{busy ? 'Saving…' : 'Update password'}</button>
        </form>
      )}

      {otp && (
        <OtpDialog purpose={otp.purpose} destination={otp.destination} resendAfter={otp.resendAfter}
          onVerify={otp.onVerify} onResend={otp.onResend} onClose={closeOtp} />
      )}
    </div>
  );
}
