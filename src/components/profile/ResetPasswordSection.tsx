import { Check, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Field'
import { Modal } from '../ui/Modal'
import { SectionCard } from './SectionCard'

interface PasswordErrors {
  oldPassword?: string
  newPassword?: string
}

interface ResetPasswordSectionProps {
  registeredEmail: string
}

export function ResetPasswordSection({ registeredEmail }: ResetPasswordSectionProps) {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [errors, setErrors] = useState<PasswordErrors>({})
  const [success, setSuccess] = useState('')
  const [otpOpen, setOtpOpen] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: PasswordErrors = {}
    if (!oldPassword) next.oldPassword = 'Enter your current password.'
    if (!newPassword) next.newPassword = 'Enter a new password.'
    else if (newPassword.length < 8) next.newPassword = 'Use at least 8 characters.'
    else if (newPassword === oldPassword) next.newPassword = 'Choose a password different from your current one.'

    setErrors(next)
    setSuccess('')
    if (Object.keys(next).length > 0) return

    setOldPassword('')
    setNewPassword('')
    setSuccess('Your password has been updated.')
  }

  const openOtp = () => {
    setOtp('')
    setOtpError('')
    setOtpOpen(true)
  }

  const closeOtp = () => {
    setOtpOpen(false)
    setOtp('')
    setOtpError('')
  }

  const handleOtpReset = () => {
    if (!/^\d{6}$/.test(otp)) {
      setOtpError('Enter the 6-digit OTP sent to your email.')
      return
    }
    closeOtp()
    setOldPassword('')
    setNewPassword('')
    setErrors({})
    setSuccess('Password reset successfully. You can now sign in with your new password.')
  }

  return (
    <>
      <SectionCard
        title="Reset password"
        description="Choose a strong password you don't use anywhere else."
      >
        <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
          <Input
            label="Old password"
            type="password"
            value={oldPassword}
            onChange={(event) => {
              setOldPassword(event.target.value)
              setErrors((current) => ({ ...current, oldPassword: undefined }))
              setSuccess('')
            }}
            error={errors.oldPassword}
            autoComplete="current-password"
            placeholder="Enter your current password"
          />

          <div>
            <Input
              label="New password"
              type="password"
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value)
                setErrors((current) => ({ ...current, newPassword: undefined }))
                setSuccess('')
              }}
              error={errors.newPassword}
              hint="At least 8 characters, with a mix of letters and numbers."
              autoComplete="new-password"
              placeholder="Enter a new password"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={openOtp}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent transition hover:text-brand"
              >
                <LockKeyhole className="size-3.5" aria-hidden="true" />
                Forgot password?
              </button>
            </div>
          </div>

          {success ? (
            <p
              className="flex items-start gap-2 rounded-xl border border-[#cfe4db] bg-[#e8f2ed] px-4 py-3 text-sm text-success"
              role="status"
            >
              <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {success}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setOldPassword('')
                setNewPassword('')
                setErrors({})
                setSuccess('')
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Reset password</Button>
          </div>
        </form>
      </SectionCard>

      <Modal
        open={otpOpen}
        onClose={closeOtp}
        title="Verify OTP"
        description="We have shared a one-time password to your registered email address."
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-line bg-canvas p-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-brand">
              <Mail className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">OTP sent to</p>
              <p className="mt-1 break-all text-sm font-medium text-ink">{registeredEmail}</p>
            </div>
          </div>

          <Input
            label="One-time password"
            value={otp}
            onChange={(event) => {
              setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
              setOtpError('')
            }}
            error={otpError}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Enter 6-digit OTP"
            maxLength={6}
          />

          <p className="flex items-center gap-1.5 text-xs text-muted">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            The OTP is valid for 10 minutes.
          </p>

          <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={closeOtp}>
              Cancel
            </Button>
            <Button type="button" onClick={handleOtpReset} disabled={otp.length !== 6}>
              Reset password
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
