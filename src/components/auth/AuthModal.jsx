// Sign in / Sign up with a one-time code (TriponX API: /api/v1/auth/*).
//   Sign in:  email OR mobile -> code -> signed in            (the account must exist)
//   Sign up:  email -> code -> account created + signed in     (the email must be new)
//             -> optional: add a mobile number (its own code), or skip for now
// Rendered into document.body so page transforms can't trap it (same reason as PortalModal).
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Info } from 'lucide-react';
import { Modal } from '../Layout.jsx';
import { useAuth } from '../../lib/context/useAuth.js';
import { normalizeIdentifier } from '../../lib/context/AuthProvider.jsx';
import { OTP_LENGTH } from '../../lib/utils/otp.js';
import { OtpInput, emptyOtp } from './OtpInput.jsx';
import '../../styles/auth.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MOBILE_RE = /^[6-9]\d{9}$/; // Indian mobile numbers
const RESEND_SECONDS = 60;

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

// API error -> one line for the user. Field messages ("must be …") get a readable subject.
function apiMessage(error, subject) {
  // 404 / 409 come with a full sentence ("No account found with this email. Sign up to create one.").
  if ((error?.status === 404 || error?.status === 409) && error.message) return error.message;
  const fields = error?.fieldErrors ?? {};
  const first = fields.otp ?? fields.email ?? fields.mobile;
  if (fields.otp) return 'That code is wrong or has expired. Check it or ask for a new one.';
  if (first && !/^[A-Z]/.test(first)) return `${subject} ${first}.`.replace(/\.\.$/, '.');
  return error?.message || 'Something went wrong. Please try again.';
}

// The flow itself, usable inline on a page or inside the modal below.
// mode 'signin' | 'signup'; onModeChange lets the user switch. Steps: 'email' -> 'otp' -> 'phone' -> 'phoneOtp'.
// switchLabels (optional) overrides the bottom "Don't have an account? Sign up" wording per mode.
const DEFAULT_SWITCH_LABELS = {
  signin: ["Don't have an account?", 'Sign up'],
  signup: ['Already have an account?', 'Sign in'],
};

export function AuthFlow({
  message = '', onDone, onStepChange, autoFocus = true, mode = 'signin', onModeChange, switchLabels = DEFAULT_SWITCH_LABELS,
}) {
  const { traveller } = useAuth();
  const isSignUp = mode === 'signup';
  const [step, setStep] = useState('email');
  // How the user identifies on the first step. Sign up always starts with email; sign in can use either.
  const [method, setMethod] = useState('email'); // 'email' | 'phone'
  const usePhone = !isSignUp && method === 'phone';
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(emptyOtp);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [sentTo, setSentTo] = useState(''); // masked address from the API ("r***@example.com")
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [otpKey, setOtpKey] = useState(0); // bump to remount OtpInput (refocus first box after a resend)
  const phoneRef = useRef(null);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // Mode can change from our own link or from the parent page: start clean either way
  // (the typed email is kept on purpose).
  useEffect(() => {
    setError('');
    setNote('');
    setMethod('email');
  }, [mode]);

  useEffect(() => {
    onStepChange?.(step);
    if (step === 'phone') phoneRef.current?.focus(); // OtpInput focuses itself on mount
  }, [step, onStepChange]);

  const normalisedEmail = normalizeIdentifier('email', email);
  const normalisedPhone = normalizeIdentifier('phone', phone);
  const contact = usePhone ? { mobile: normalisedPhone } : { email: normalisedEmail };

  const toggleMethod = () => {
    setMethod(usePhone ? 'email' : 'phone');
    setError('');
    setNote('');
  };

  const codeSent = (res, fallback) => {
    setSentTo(res?.destination || fallback);
    setResendIn(res?.resendAfterSeconds || RESEND_SECONDS);
    setOtp(emptyOtp());
    setOtpKey((k) => k + 1);
  };

  // ----- Step 1: email (or mobile, when signing in) -> send a code -----
  const sendCode = async (e) => {
    e?.preventDefault();
    if (busy) return;
    setNote('');
    if (usePhone ? !MOBILE_RE.test(normalisedPhone) : !EMAIL_RE.test(email.trim())) {
      setError(usePhone ? 'Enter a valid 10-digit mobile number.' : 'Enter a valid email address.');
      return;
    }
    setBusy(true);
    try {
      const res = await traveller.requestOtp(isSignUp ? 'signup' : 'signin', contact);
      setError('');
      codeSent(res, usePhone ? `+91 ${normalisedPhone}` : normalisedEmail);
      setStep('otp');
    } catch (err) {
      setError(apiMessage(err, usePhone ? 'Mobile number' : 'Email'));
      if (err.status === 429 && err.retryAfterSeconds) setResendIn(err.retryAfterSeconds);
    } finally {
      setBusy(false);
    }
  };

  // ----- Step 2: the code -----
  const onOtpChange = (next) => { setOtp(next); setError(''); };

  const verify = async (e) => {
    e.preventDefault();
    if (busy) return;
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) { setError(`Enter the ${OTP_LENGTH}-digit code.`); return; }
    setBusy(true);
    try {
      if (isSignUp) {
        await traveller.verifySignup(normalisedEmail, code);
        setError('');
        setPhone('');
        setStep('phone'); // signed in; a mobile number is optional
      } else {
        await traveller.verifySignin(contact, code);
        onDone?.();
      }
    } catch (err) {
      setError(apiMessage(err, 'Code'));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = step === 'phoneOtp'
        ? await traveller.requestContactOtp({ mobile: normalisedPhone })
        : await traveller.requestOtp(isSignUp ? 'signup' : 'signin', contact);
      setError('');
      codeSent(res, sentTo);
    } catch (err) {
      setError(apiMessage(err, 'Code'));
      if (err.status === 429 && err.retryAfterSeconds) setResendIn(err.retryAfterSeconds);
    } finally {
      setBusy(false);
    }
  };

  // ----- Step 3 (sign up, optional): mobile number -> its own code -----
  const sendPhoneCode = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!MOBILE_RE.test(normalisedPhone)) { setError('Enter a valid 10-digit mobile number.'); return; }
    setBusy(true);
    try {
      const res = await traveller.requestContactOtp({ mobile: normalisedPhone });
      setError('');
      codeSent(res, `+91 ${normalisedPhone}`);
      setStep('phoneOtp');
    } catch (err) {
      setError(apiMessage(err, 'Mobile number'));
    } finally {
      setBusy(false);
    }
  };

  const verifyPhone = async (e) => {
    e.preventDefault();
    if (busy) return;
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) { setError(`Enter the ${OTP_LENGTH}-digit code.`); return; }
    setBusy(true);
    try {
      await traveller.verifyContactOtp({ mobile: normalisedPhone }, code);
      onDone?.();
    } catch (err) {
      setError(apiMessage(err, 'Code'));
    } finally {
      setBusy(false);
    }
  };

  // Errors/method are reset by the [mode] effect above.
  const switchMode = () => onModeChange?.(isSignUp ? 'signin' : 'signup');
  const [switchPrompt, switchAction] = switchLabels[isSignUp ? 'signup' : 'signin'];

  const startOver = () => { setStep('email'); setOtp(emptyOtp()); setError(''); };
  const changeNumber = () => { setStep('phone'); setOtp(emptyOtp()); setError(''); };

  const otpStep = (onSubmit, cta, back) => (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <p className="auth-sub">Enter the {OTP_LENGTH}-digit code sent to <strong>{sentTo}</strong>.</p>

      <OtpInput key={otpKey} value={otp} onChange={onOtpChange} invalid={Boolean(error)} />
      {error && <p className="field-error auth-center" role="alert">{error}</p>}

      <button type="submit" className="btn btn-dark btn-block auth-cta" disabled={busy} aria-busy={busy}>{busy ? 'Checking…' : cta}</button>

      <div className="auth-otp-links">
        {resendIn > 0
          ? <span className="muted-xs">Resend code in {resendIn}s</span>
          : <button type="button" className="auth-link" onClick={resend} disabled={busy}>Resend code</button>}
        {back}
      </div>
    </form>
  );

  return (
    <div className="auth">
      {step === 'email' && (
        <>
          <p className="auth-sub">
            {isSignUp
              ? 'Create your account with your email and a one-time code.'
              : `Enter your ${usePhone ? 'mobile number' : 'email'} to sign in with a one-time code.`}
          </p>
          {message && <p className="auth-message"><Info size={16} />{message}</p>}

          <form className="auth-form" onSubmit={sendCode} noValidate>
            {usePhone ? (
              <label className={`form-field ${error ? 'has-error' : ''}`}>
                <span className="auth-label">Mobile number</span>
                <span className="auth-phone">
                  <span className="auth-phone-code" aria-hidden="true">+91</span>
                  <input type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210" maxLength={14} value={phone}
                    autoFocus={autoFocus} aria-invalid={Boolean(error)}
                    onChange={(e) => { setPhone(e.target.value.replace(/[^\d\s]/g, '')); setError(''); }} />
                </span>
                {error && <span className="field-error" role="alert">{error}</span>}
              </label>
            ) : (
              <label className={`form-field ${error ? 'has-error' : ''}`}>
                <span className="auth-label">Email address</span>
                <input type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={email}
                  autoFocus={autoFocus} aria-invalid={Boolean(error)} onChange={(e) => { setEmail(e.target.value); setError(''); }} />
                {error && <span className="field-error" role="alert">{error}</span>}
              </label>
            )}
            <button type="submit" className="btn btn-dark btn-block auth-cta" disabled={busy} aria-busy={busy}>{busy ? 'Sending code…' : 'Continue'}</button>
          </form>

          <div className="auth-or" role="separator"><span>or</span></div>

          <button type="button" className="btn btn-outline btn-block auth-google" onClick={() => setNote('Google sign-in is coming soon. Please continue with email for now.')}>
            <GoogleMark />Continue with Google
          </button>
          {note && <p className="muted-xs auth-note" role="status">{note}</p>}

          {!isSignUp && (
            <button type="button" className="auth-link auth-center" onClick={toggleMethod}>
              {usePhone ? 'Sign in with email instead' : 'Sign in with mobile instead'}
            </button>
          )}

          {onModeChange && (
            <p className="auth-switch">
              {switchPrompt}
              <button type="button" className="auth-link" onClick={switchMode}>{switchAction}</button>
            </p>
          )}
        </>
      )}

      {step === 'otp' && otpStep(verify, isSignUp ? 'Verify email' : 'Sign in', (
        <button type="button" className="auth-back" onClick={startOver}>
          <ArrowLeft size={15} />Change {usePhone ? 'number' : 'email'}
        </button>
      ))}

      {step === 'phone' && (
        <form className="auth-form" onSubmit={sendPhoneCode} noValidate>
          <p className="auth-sub">
            Your account is ready and <strong>{normalisedEmail}</strong> is verified. Add your mobile number for booking updates — or skip this for now.
          </p>
          <label className={`form-field ${error ? 'has-error' : ''}`}>
            <span className="auth-label">Mobile number</span>
            <span className="auth-phone">
              <span className="auth-phone-code" aria-hidden="true">+91</span>
              <input ref={phoneRef} type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210" maxLength={14}
                value={phone} aria-invalid={Boolean(error)}
                onChange={(e) => { setPhone(e.target.value.replace(/[^\d\s]/g, '')); setError(''); }} />
            </span>
            {error && <span className="field-error" role="alert">{error}</span>}
          </label>
          <button type="submit" className="btn btn-dark btn-block auth-cta" disabled={busy} aria-busy={busy}>{busy ? 'Sending code…' : 'Send code'}</button>
          <button type="button" className="auth-link auth-center" onClick={() => onDone?.()}>Skip for now</button>
        </form>
      )}

      {step === 'phoneOtp' && otpStep(verifyPhone, 'Verify mobile', (
        <>
          <button type="button" className="auth-back" onClick={changeNumber}><ArrowLeft size={15} />Change number</button>
          <button type="button" className="auth-link" onClick={() => onDone?.()}>Skip for now</button>
        </>
      ))}
    </div>
  );
}

const TITLES = {
  signin: { email: 'Sign in', otp: 'Verify OTP' },
  signup: { email: 'Sign up', otp: 'Verify your email', phone: 'Add your mobile number', phoneOtp: 'Verify your mobile' },
};

// initialMode: 'signin' (default) or 'signup'. The user can switch inside the popup.
export function AuthModal({ message = '', initialMode = 'signin', onClose }) {
  const [step, setStep] = useState('email');
  const [mode, setMode] = useState(initialMode);
  return createPortal(
    <Modal title={TITLES[mode][step] ?? 'Sign in'} onClose={onClose}>
      {/* Same AuthFlow instance across modes, so a typed email carries over when switching */}
      <AuthFlow message={message} mode={mode} onModeChange={setMode} onDone={onClose} onStepChange={setStep} />
    </Modal>,
    document.body,
  );
}
