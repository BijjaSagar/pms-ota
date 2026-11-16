import { CalendarClock, Check, CreditCard, ShieldCheck } from 'lucide-react'
import type { PaymentMode } from '../../types'
import { cn } from '../../utils/cn'

interface PaymentOptionsCardProps {
  mode: PaymentMode
  onChange: (mode: PaymentMode) => void
  total: string
}

export function PaymentOptionsCard({ mode, onChange, total }: PaymentOptionsCardProps) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 sm:p-7">
      <h2 className="font-display text-2xl text-ink">Payment options</h2>
      <p className="mt-1.5 text-sm text-muted">Choose how you would like to settle this stay.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment option">
        <button
          type="button"
          role="radio"
          aria-checked={mode === 'now'}
          onClick={() => onChange('now')}
          className={cn(
            'relative flex items-start gap-3 rounded-xl border p-4 text-left transition',
            mode === 'now'
              ? 'border-brand bg-brand-soft/50 ring-1 ring-brand/15'
              : 'border-line bg-white hover:border-ink/20',
          )}
        >
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-full',
              mode === 'now' ? 'bg-brand text-white' : 'bg-canvas text-brand',
            )}
          >
            <CreditCard className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-ink">Pay now</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-muted">
              Continue to secure payment. Card details are taken on the next step.
            </span>
            <span className="font-numeric mt-2 block text-sm font-semibold text-ink">{total}</span>
          </span>
          {mode === 'now' ? (
            <Check className="absolute right-3 top-3 size-4 text-brand" aria-hidden="true" />
          ) : null}
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={mode === 'later'}
          onClick={() => onChange('later')}
          className={cn(
            'relative flex items-start gap-3 rounded-xl border p-4 text-left transition',
            mode === 'later'
              ? 'border-brand bg-brand-soft/50 ring-1 ring-brand/15'
              : 'border-line bg-white hover:border-ink/20',
          )}
        >
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-full',
              mode === 'later' ? 'bg-brand text-white' : 'bg-canvas text-brand',
            )}
          >
            <CalendarClock className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-ink">Pay later</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-muted">
              Confirm now and settle the balance directly at the property.
            </span>
            <span className="font-numeric mt-2 block text-sm font-semibold text-ink">
              {total} due at property
            </span>
          </span>
          {mode === 'later' ? (
            <Check className="absolute right-3 top-3 size-4 text-brand" aria-hidden="true" />
          ) : null}
        </button>
      </div>

      <p className="mt-3 flex items-start gap-2 text-[0.7rem] leading-relaxed text-muted">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden="true" />
        {mode === 'now'
          ? 'You will be taken to our secure payment page. No card is charged in this demo.'
          : 'Your room is held and the amount is payable on arrival. This is a demo booking.'}
      </p>
    </section>
  )
}
