import { useId } from 'react'
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

const labelStyles = 'mb-2 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted'

const controlStyles =
  'w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink shadow-[0_1px_0_rgba(16,32,43,0.02)] transition placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 disabled:bg-canvas disabled:text-muted'

function ErrorText({ error }: { error?: string }) {
  if (!error) return null
  return (
    <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">
      {error}
    </p>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  hideLabel?: boolean
}

export function Input({ label, error, hint, hideLabel, className, id, ...props }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  return (
    <div>
      <label htmlFor={inputId} className={cn(labelStyles, hideLabel && 'sr-only')}>
        {label}
      </label>
      <input
        id={inputId}
        className={cn(controlStyles, error && 'border-red-400 focus:border-red-500 focus:ring-red-100', className)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {hint && !error ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
      <span id={`${inputId}-error`}>
        <ErrorText error={error} />
      </span>
    </div>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  hideLabel?: boolean
  children: React.ReactNode
}

export function Select({ label, error, hideLabel, className, id, children, ...props }: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  return (
    <div>
      <label htmlFor={selectId} className={cn(labelStyles, hideLabel && 'sr-only')}>
        {label}
      </label>
      <select
        id={selectId}
        className={cn(controlStyles, 'cursor-pointer', error && 'border-red-400', className)}
        aria-invalid={Boolean(error)}
        {...props}
      >
        {children}
      </select>
      <ErrorText error={error} />
    </div>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
}

export function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
  const generatedId = useId()
  const textareaId = id ?? generatedId
  return (
    <div>
      <label htmlFor={textareaId} className={labelStyles}>
        {label}
      </label>
      <textarea
        id={textareaId}
        className={cn(controlStyles, 'min-h-28 resize-y', error && 'border-red-400', className)}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {hint && !error ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
      <ErrorText error={error} />
    </div>
  )
}
