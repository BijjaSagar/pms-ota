import {
  Baby,
  Ban,
  Clock,
  CreditCard,
  Info,
  PawPrint,
  ShieldCheck,
} from 'lucide-react'
import { useState } from 'react'
import type { Hotel } from '../../types'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

export function ImportantInfoCard({ hotel }: { hotel: Hotel }) {
  const [open, setOpen] = useState(false)

  const highlights = [
    { icon: Clock, label: 'Check-in', value: hotel.policies.checkIn },
    { icon: Clock, label: 'Check-out', value: hotel.policies.checkOut },
    { icon: ShieldCheck, label: 'Cancellation', value: hotel.policies.cancellation },
    { icon: CreditCard, label: 'Payment', value: 'Pay now online or settle at the property.' },
  ]

  return (
    <section className="rounded-2xl border border-line bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Info className="size-4.5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-2xl text-ink">Important information</h2>
            <p className="mt-1 text-sm text-muted">
              Everything you need to know before you arrive at {hotel.name}.
            </p>
          </div>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
          View more
        </Button>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        {highlights.map((item) => (
          <div key={item.label} className="rounded-xl bg-canvas p-3.5">
            <dt className="flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted">
              <item.icon className="size-3.5 text-accent" aria-hidden="true" />
              {item.label}
            </dt>
            <dd className="mt-1 text-xs leading-relaxed text-ink">{item.value}</dd>
          </div>
        ))}
      </dl>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`${hotel.name} — good to know`}
        description="Policies, house rules and the practical details for your stay."
      >
        <div className="space-y-5 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: Clock, label: 'Check-in', value: hotel.policies.checkIn },
              { icon: Clock, label: 'Check-out', value: hotel.policies.checkOut },
              { icon: ShieldCheck, label: 'Cancellation', value: hotel.policies.cancellation },
              { icon: Baby, label: 'Children', value: hotel.policies.children },
              { icon: PawPrint, label: 'Pets', value: hotel.policies.pets },
              {
                icon: CreditCard,
                label: 'Payment',
                value: 'Major cards and PayPal accepted. No card is charged in this demo.',
              },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-canvas p-3.5">
                <p className="flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted">
                  <item.icon className="size-3.5 text-accent" aria-hidden="true" />
                  {item.label}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink">{item.value}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted">
              <Ban className="size-3.5 text-accent" aria-hidden="true" />
              House rules
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {hotel.policies.houseRules.map((rule) => (
                <li
                  key={rule}
                  className="rounded-full bg-canvas px-3 py-1 text-xs font-medium text-ink"
                >
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-line bg-white p-4">
            <p className="text-xs font-semibold text-ink">About the property</p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">{hotel.description}</p>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Check-in is {hotel.policies.checkIn.toLowerCase()} and check-out is{' '}
              {hotel.policies.checkOut.toLowerCase()}. Photo ID and a valid payment method may be
              requested at arrival.
            </p>
          </div>
        </div>
      </Modal>
    </section>
  )
}
