// Sign in or sign up with email or mobile + one-time code.
// One flow for everyone: enter email/mobile -> verify OTP -> signed in (new accounts are created automatically).
// Rendered into document.body so page transforms can't trap it (same reason as PortalModal).
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Info } from 'lucide-react';
import { Modal } from '../Layout.jsx';
import { useAuth } from '../../lib/context/useAuth.js';
import { normalizeIdentifier } from '../../lib/context/AuthProvider.jsx';
import { OTP_LENGTH, verifyOtp } from '../../lib/utils/otp.js';
import '../../styles/auth.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RESEND_SECONDS = 30;
const emptyOtp = () => Array(OTP_LENGTH).fill('');

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

export function AuthModal({ message = '', onClose }) {
  const { findUser, register, login } = useAuth();
  const [method, setMethod] = useState('email'); // 'email' | 'phone'
  const [step, setStep] = useState('identify'); // 'identify' | 'otp'
  const [value, setValue] = useState('');
  const [otp, setOtp] = useState(emptyOtp);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    if (step === 'otp') otpRefs.current[0]?.focus();
  }, [step]);

  const isEmail = method === 'email';
  const display = isEmail ? normalizeIdentifier('email', value) : `+91 ${normalizeIdentifier('phone', value)}`;

  const toggleMethod = () => {
    setMethod(isEmail ? 'phone' : 'email');
    setValue('');
    setError('');
    setNote('');
  };

  const sendCode = (e) => {
    e.preventDefault();
    setNote('');
    if (isEmail && !EMAIL_RE.test(value.trim())) { setError('Enter a valid email address.'); return; }
    if (!isEmail && !/^[6-9]\d{9}$/.test(normalizeIdentifier('phone', value))) { setError('Enter a valid 10-digit mobile number.'); return; }
    setError('');
    setOtp(emptyOtp());
    setStep('otp');
    setResendIn(RESEND_SECONDS);
  };

  // ----- OTP boxes: type, backspace, arrows and paste -----
  const focusBox = (i) => otpRefs.current[Math.max(0, Math.min(OTP_LENGTH - 1, i))]?.focus();

  const fillFrom = (start, digits) => {
    const next = [...otp];
    let i = start;
    for (const d of digits) { if (i >= OTP_LENGTH) break; next[i] = d; i += 1; }
    setOtp(next);
    setError('');
    focusBox(i);
  };

  const onBoxChange = (i, e) => {
    const digits = e.target.value.replace(/\D/g, '');
    if (!digits) { const next = [...otp]; next[i] = ''; setOtp(next); return; }
    // Typing into a filled box appends to its old digit; keep only what was newly typed.
    const typed = otp[i] && digits.length > 1 && digits.startsWith(otp[i]) ? digits.slice(1) : digits;
    fillFrom(i, typed);
  };

  const onBoxKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      e.preventDefault();
      const next = [...otp]; next[i - 1] = ''; setOtp(next); focusBox(i - 1);
    } else if (e.key === 'ArrowLeft') { e.preventDefault(); focusBox(i - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); focusBox(i + 1); }
  };

  const onBoxPaste = (i, e) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!digits) return;
    e.preventDefault();
    fillFrom(i, digits);
  };

  const verify = (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) { setError(`Enter the ${OTP_LENGTH}-digit code.`); return; }
    if (!verifyOtp(code)) { setError('That code is not correct. Please try again.'); return; }
    // Existing user -> sign in; new user -> account created straight away (no name step).
    const existing = findUser(method, value);
    if (existing) login(existing);
    else register({ name: '', method, value });
    onClose();
  };

  const resend = () => {
    setResendIn(RESEND_SECONDS);
    setOtp(emptyOtp());
    setError('');
    focusBox(0);
  };

  const title = step === 'identify' ? 'Sign in or sign up' : 'Verify OTP';

  return createPortal(
    <Modal title={title} onClose={onClose}>
      <div className="auth">
        {step === 'identify' && (
          <>
            <p className="auth-sub">Enter your {isEmail ? 'email' : 'mobile number'} to continue with a one-time code.</p>
            {message && <p className="auth-message"><Info size={16} />{message}</p>}

            <form className="auth-form" onSubmit={sendCode} noValidate>
              {isEmail ? (
                <label className={`form-field ${error ? 'has-error' : ''}`}>
                  <span className="auth-label">Email address</span>
                  <input type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={value} autoFocus
                    aria-invalid={Boolean(error)} onChange={(e) => { setValue(e.target.value); setError(''); }} />
                  {error && <span className="field-error" role="alert">{error}</span>}
                </label>
              ) : (
                <label className={`form-field ${error ? 'has-error' : ''}`}>
                  <span className="auth-label">Mobile number</span>
                  <span className="auth-phone">
                    <span className="auth-phone-code" aria-hidden="true">+91</span>
                    <input type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210" maxLength={14} value={value} autoFocus
                      aria-invalid={Boolean(error)} onChange={(e) => { setValue(e.target.value.replace(/[^\d\s]/g, '')); setError(''); }} />
                  </span>
                  {error && <span className="field-error" role="alert">{error}</span>}
                </label>
              )}
              <button type="submit" className="btn btn-dark btn-block auth-cta">Continue</button>
            </form>

            <div className="auth-or" role="separator"><span>or</span></div>

            <button type="button" className="btn btn-outline btn-block auth-google" onClick={() => setNote('Google sign-in is coming soon. Please continue with email or mobile for now.')}>
              <GoogleMark />Continue with Google
            </button>
            {note && <p className="muted-xs auth-note" role="status">{note}</p>}

            <button type="button" className="auth-link auth-center" onClick={toggleMethod}>
              {isEmail ? 'Login or sign up with mobile' : 'Login or sign up with email'}
            </button>
          </>
        )}

        {step === 'otp' && (
          <form className="auth-form" onSubmit={verify} noValidate>
            <p className="auth-sub">Enter the {OTP_LENGTH}-digit code sent to <strong>{display}</strong>.</p>

            <div className={`auth-otp ${error ? 'has-error' : ''}`} role="group" aria-label="One-time code">
              {otp.map((digit, i) => (
                <input
                  // eslint-disable-next-line react/no-array-index-key
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text" inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'} maxLength={OTP_LENGTH}
                  aria-label={`Digit ${i + 1}`} value={digit}
                  onChange={(e) => onBoxChange(i, e)} onKeyDown={(e) => onBoxKeyDown(i, e)} onPaste={(e) => onBoxPaste(i, e)}
                  onFocus={(e) => e.target.select()}
                />
              ))}
            </div>
            {error && <p className="field-error auth-center" role="alert">{error}</p>}

            <button type="submit" className="btn btn-dark btn-block auth-cta">Continue</button>

            <div className="auth-otp-links">
              {resendIn > 0
                ? <span className="muted-xs">Resend code in {resendIn}s</span>
                : <button type="button" className="auth-link" onClick={resend}>Resend code</button>}
              <button type="button" className="auth-back" onClick={() => { setStep('identify'); setError(''); }}>
                <ArrowLeft size={15} />Change {isEmail ? 'email' : 'number'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>,
    document.body,
  );
}
