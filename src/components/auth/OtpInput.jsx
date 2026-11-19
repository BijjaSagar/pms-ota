// Six one-digit boxes for a one-time code: type, backspace, arrow keys and paste.
// Controlled: `value` is an array of OTP_LENGTH strings; `onChange` receives the next array.
// Remount it (change its `key`) to clear focus state after a resend.
import { useEffect, useRef } from 'react';
import { OTP_LENGTH } from '../../lib/utils/otp.js';

export const emptyOtp = () => Array(OTP_LENGTH).fill('');

export function OtpInput({ value, onChange, invalid = false, autoFocus = true, label = 'One-time code' }) {
  const refs = useRef([]);

  // Next frame: a parent Modal focuses its own box in an effect that runs after ours.
  useEffect(() => {
    if (!autoFocus) return undefined;
    const t = requestAnimationFrame(() => refs.current[0]?.focus());
    return () => cancelAnimationFrame(t);
  }, [autoFocus]);

  const focusBox = (i) => refs.current[Math.max(0, Math.min(OTP_LENGTH - 1, i))]?.focus();

  const fillFrom = (start, digits) => {
    const next = [...value];
    let i = start;
    for (const d of digits) { if (i >= OTP_LENGTH) break; next[i] = d; i += 1; }
    onChange(next);
    focusBox(i);
  };

  const onBoxChange = (i, e) => {
    const digits = e.target.value.replace(/\D/g, '');
    if (!digits) { const next = [...value]; next[i] = ''; onChange(next); return; }
    // Typing into a filled box appends to its old digit; keep only what was newly typed.
    const typed = value[i] && digits.length > 1 && digits.startsWith(value[i]) ? digits.slice(1) : digits;
    fillFrom(i, typed);
  };

  const onBoxKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      e.preventDefault();
      const next = [...value]; next[i - 1] = ''; onChange(next); focusBox(i - 1);
    } else if (e.key === 'ArrowLeft') { e.preventDefault(); focusBox(i - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); focusBox(i + 1); }
  };

  const onBoxPaste = (i, e) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!digits) return;
    e.preventDefault();
    fillFrom(i, digits);
  };

  return (
    <div className={`auth-otp ${invalid ? 'has-error' : ''}`} role="group" aria-label={label}>
      {value.map((digit, i) => (
        <input
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text" inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'} maxLength={OTP_LENGTH}
          aria-label={`Digit ${i + 1}`} value={digit}
          onChange={(e) => onBoxChange(i, e)} onKeyDown={(e) => onBoxKeyDown(i, e)} onPaste={(e) => onBoxPaste(i, e)}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
