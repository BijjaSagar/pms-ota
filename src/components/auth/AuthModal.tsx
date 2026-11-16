import { ArrowLeft } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ClipboardEvent, FormEvent, KeyboardEvent } from 'react'
import { cn } from '../../utils/cn'
import { isValidEmail, isValidPhone } from '../../utils/validation'
import { Button } from '../ui/Button'
import { buttonStyles } from '../ui/buttonStyles'
import { Input } from '../ui/Field'
import { Modal } from '../ui/Modal'

type Step = 'identifier' | 'otp'
type Mode = 'email' | 'phone'

const OTP_LENGTH = 6

function emptyOtp(): string[] {
  return Array<string>(OTP_LENGTH).fill('')
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4.5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  )
}

interface AuthModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [step, setStep] = useState<Step>('identifier')
  const [mode, setMode] = useState<Mode>('email')
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [otp, setOtp] = useState<string[]>(emptyOtp)
  const otpRefs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (step !== 'otp') return
    const timer = window.setTimeout(() => otpRefs.current[0]?.focus(), 60)
    return () => window.clearTimeout(timer)
  }, [step])

  useEffect(() => {
    if (step !== 'identifier') return
    const timer = window.setTimeout(() => {
      document.getElementById('auth-identifier-input')?.focus()
    }, 60)
    return () => window.clearTimeout(timer)
  }, [step, mode])

  const isEmail = mode === 'email'

  const title = step === 'otp' ? 'Verify OTP' : isEmail ? 'Sign in or sign up' : 'Sign in with mobile'
  const description =
    step === 'otp'
      ? `Enter the ${OTP_LENGTH}-digit code sent to ${value}.`
      : isEmail
        ? 'Enter your email to continue with a one-time code.'
        : 'Enter your mobile number to receive a one-time code.'

  const switchMode = () => {
    setMode((current) => (current === 'email' ? 'phone' : 'email'))
    setValue('')
    setError(null)
    setNotice(null)
  }

  const handleIdentifierSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) {
      setError(isEmail ? 'Please enter your email address.' : 'Please enter your mobile number.')
      return
    }
    if (isEmail && !isValidEmail(trimmed)) {
      setError('Please enter a valid email address.')
      return
    }
    if (!isEmail && !isValidPhone(trimmed)) {
      setError('Please enter a valid mobile number.')
      return
    }
    setValue(trimmed)
    setError(null)
    setNotice(null)
    setOtp(emptyOtp())
    setStep('otp')
  }

  const handleOtpChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1)
    setOtp((current) => {
      const next = [...current]
      next[index] = digit
      return next
    })
    setError(null)
    setNotice(null)
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault()
      if (otp[index]) {
        setOtp((current) => {
          const next = [...current]
          next[index] = ''
          return next
        })
        return
      }
      if (index > 0) {
        const previous = index - 1
        setOtp((current) => {
          const next = [...current]
          next[previous] = ''
          return next
        })
        otpRefs.current[previous]?.focus()
      }
      return
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      otpRefs.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      event.preventDefault()
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!digits) return
    event.preventDefault()
    const next = emptyOtp()
    digits.split('').forEach((digit, index) => {
      next[index] = digit
    })
    setOtp(next)
    setError(null)
    setNotice(null)
    otpRefs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus()
  }

  const handleOtpSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (otp.some((digit) => !digit)) {
      setError(`Please enter the ${OTP_LENGTH}-digit code.`)
      return
    }
    onSuccess()
  }

  const handleResend = () => {
    setOtp(emptyOtp())
    setError(null)
    setNotice('A new code has been sent.')
    window.setTimeout(() => otpRefs.current[0]?.focus(), 0)
  }

  const handleChangeIdentifier = () => {
    setStep('identifier')
    setOtp(emptyOtp())
    setError(null)
    setNotice(null)
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      description={description}
      centered
      className="max-w-md"
    >
      {step === 'identifier' ? (
        <form onSubmit={handleIdentifierSubmit} className="space-y-5" noValidate>
          <Input
            key={mode}
            id="auth-identifier-input"
            label={isEmail ? 'Email address' : 'Mobile number'}
            type={isEmail ? 'email' : 'tel'}
            inputMode={isEmail ? 'email' : 'tel'}
            autoComplete={isEmail ? 'email' : 'tel'}
            placeholder={isEmail ? 'you@example.com' : '+91 98765 43210'}
            value={value}
            onChange={(event) => {
              setValue(event.target.value)
              setError(null)
            }}
            error={error ?? undefined}
          />

          <Button type="submit" size="lg" fullWidth>
            {isEmail ? 'Continue' : 'Send OTP'}
          </Button>

          {isEmail ? (
            <>
              <div className="flex items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted">
                <span className="h-px flex-1 bg-line" aria-hidden="true" />
                or
                <span className="h-px flex-1 bg-line" aria-hidden="true" />
              </div>
              <button
                type="button"
                onClick={onSuccess}
                className={cn(buttonStyles('secondary', 'lg', true), 'gap-3')}
              >
                <GoogleIcon />
                Continue with Google
              </button>
            </>
          ) : null}

          <div className="text-center">
            <button
              type="button"
              onClick={switchMode}
              className="text-sm font-medium text-accent transition hover:underline"
            >
              {isEmail ? 'Login or sign up with mobile' : 'Login or sign up with email'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className="space-y-5" noValidate>
          <div
            className="flex justify-center gap-1.5 sm:gap-2.5"
            role="group"
            aria-label="One-time password"
            onPaste={handleOtpPaste}
          >
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  otpRefs.current[index] = element
                }}
                value={digit}
                onChange={(event) => handleOtpChange(index, event.target.value)}
                onKeyDown={(event) => handleOtpKeyDown(index, event)}
                onFocus={(event) => event.target.select()}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
                aria-invalid={Boolean(error)}
                className={cn(
                  'h-12 w-10 rounded-xl border border-line bg-white text-center text-lg font-semibold text-ink shadow-[0_1px_0_rgba(16,32,43,0.02)] outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10 sm:w-12',
                  error && 'border-red-400 focus:border-red-500 focus:ring-red-100',
                )}
              />
            ))}
          </div>

          {error ? (
            <p className="-mt-1 text-center text-xs font-medium text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          {notice && !error ? (
            <p className="-mt-1 text-center text-xs font-medium text-success" role="status">
              {notice}
            </p>
          ) : null}

          <Button type="submit" size="lg" fullWidth>
            Continue
          </Button>

          <div className="flex flex-col items-center gap-2.5 text-sm text-muted">
            <button
              type="button"
              onClick={handleResend}
              className="font-medium text-accent transition hover:underline"
            >
              Resend code
            </button>
            <button
              type="button"
              onClick={handleChangeIdentifier}
              className="inline-flex items-center gap-1.5 transition hover:text-ink"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Change {isEmail ? 'email' : 'mobile number'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
