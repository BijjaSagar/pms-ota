// Ported from pms-ota/src/components/profile/ResetPasswordSection.tsx (TriponX styling).
import { Check, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useCallback, useState } from 'react';
import { TextField } from '../Layout.jsx';
import { PortalModal as Modal } from './PortalModal.jsx';
import { SectionCard } from './SectionCard.jsx';

export function ResetPasswordSection({ registeredEmail }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [otpOpen, setOtpOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const next = {};
    if (!oldPassword) next.oldPassword = 'Enter your current password.';
    if (!newPassword) next.newPassword = 'Enter a new password.';
    else if (newPassword.length < 8) next.newPassword = 'Use at least 8 characters.';
    else if (newPassword === oldPassword) next.newPassword = 'Choose a password different from your current one.';
    setErrors(next);
    setSuccess('');
    if (Object.keys(next).length > 0) return;
    setOldPassword('');
    setNewPassword('');
    setSuccess('Your password has been updated.');
  };

  // Visual guide only; validation rules are pms-ota's (handleSubmit).
  const rules = [
    ['8+ characters', newPassword.length >= 8],
    ['Letters & numbers', /[a-z]/i.test(newPassword) && /\d/.test(newPassword)],
    ['Different from current', Boolean(newPassword) && newPassword !== oldPassword],
  ];
  const openOtp = () => { setOtp(''); setOtpError(''); setOtpOpen(true); };
  const closeOtp = useCallback(() => { setOtpOpen(false); setOtp(''); setOtpError(''); }, []);
  const handleOtpReset = () => {
    if (!/^\d{6}$/.test(otp)) { setOtpError('Enter the 6-digit OTP sent to your email.'); return; }
    closeOtp();
    setOldPassword('');
    setNewPassword('');
    setErrors({});
    setSuccess('Password reset successfully. You can now sign in with your new password.');
  };

  return (
    <>
      <SectionCard className="pw-wrap" title="Reset password" description="Choose a strong password you don't use anywhere else.">
        <form onSubmit={handleSubmit} noValidate className="pw-form">
          <TextField label="Old password" type="password" value={oldPassword}
            onChange={(e) => { setOldPassword(e.target.value); setErrors((c) => ({ ...c, oldPassword: undefined })); setSuccess(''); }}
            error={errors.oldPassword} autoComplete="current-password" placeholder="Enter your current password" />
          <div>
            <TextField label="New password" type="password" value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setErrors((c) => ({ ...c, newPassword: undefined })); setSuccess(''); }}
              error={errors.newPassword} hint="At least 8 characters, with a mix of letters and numbers."
              autoComplete="new-password" placeholder="Enter a new password" />
            <div className="pw-rules mt-12" aria-hidden="true">
              {rules.map(([label, ok]) => (
                <span key={label} className={`pw-rule ${ok ? 'ok' : ''}`}>{ok ? <Check size={12} /> : <span className="dev-dot" />}{label}</span>
              ))}
            </div>
          </div>
          <div>
            <button type="button" className="forgot-link" onClick={openOtp}><LockKeyhole size={14} aria-hidden="true" />Forgot password?</button>
          </div>
          {success ? <p className="ok-box" role="status"><Check size={16} aria-hidden="true" />{success}</p> : null}
          <div className="form-foot">
            <button type="button" className="btn btn-outline"
              onClick={() => { setOldPassword(''); setNewPassword(''); setErrors({}); setSuccess(''); }}>Cancel</button>
            <button type="submit" className="btn btn-primary">Reset password</button>
          </div>
        </form>
      </SectionCard>

      {otpOpen ? (
        <Modal title="Verify OTP" onClose={closeOtp}>
          <p className="modal-text">We have shared a one-time password to your registered email address.</p>
          <div className="col-gap-14">
            <div className="otp-to">
              <span className="round-icon"><Mail size={16} aria-hidden="true" /></span>
              <div>
                <p className="mini-label">OTP SENT TO</p>
                <p className="text-sm"><strong>{registeredEmail}</strong></p>
              </div>
            </div>
            <TextField label="One-time password" value={otp}
              onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError(''); }}
              error={otpError} inputMode="numeric" autoComplete="one-time-code" placeholder="Enter 6-digit OTP" maxLength={6} />
            <p className="muted-xs row-gap-8 center"><ShieldCheck size={14} aria-hidden="true" />The OTP is valid for 10 minutes.</p>
            <div className="form-foot">
              <button type="button" className="btn btn-outline" onClick={closeOtp}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleOtpReset} disabled={otp.length !== 6}>Reset password</button>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
