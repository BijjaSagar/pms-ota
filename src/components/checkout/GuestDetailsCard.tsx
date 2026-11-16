import { Plus, Trash2, UserRound, Users } from 'lucide-react'
import type { AdditionalGuest, GuestDetails } from '../../types'
import { cn } from '../../utils/cn'
import { Button } from '../ui/Button'
import { Input, Select } from '../ui/Field'

export type GuestErrors = Partial<Record<keyof GuestDetails, string>>

const titles = ['Mr', 'Ms', 'Mrs', 'Dr', 'Mx']

interface GuestDetailsCardProps {
  form: GuestDetails
  errors: GuestErrors
  onChange: <K extends keyof GuestDetails>(key: K, value: GuestDetails[K]) => void
  onAddGuest: () => void
  onRemoveGuest: (id: string) => void
  onChangeGuest: (id: string, patch: Partial<AdditionalGuest>) => void
  maxGuests?: number
}

function GuestTypeOption({
  active,
  onClick,
  title,
  description,
  icon: Icon,
}: {
  active: boolean
  onClick: () => void
  title: string
  description: string
  icon: typeof UserRound
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex items-start gap-3 rounded-xl border p-4 text-left transition',
        active
          ? 'border-brand bg-brand-soft/50 ring-1 ring-brand/15'
          : 'border-line bg-white hover:border-ink/20',
      )}
    >
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full',
          active ? 'bg-brand text-white' : 'bg-canvas text-brand',
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-sm font-medium text-ink">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted">{description}</span>
      </span>
    </button>
  )
}

export function GuestDetailsCard({
  form,
  errors,
  onChange,
  onAddGuest,
  onRemoveGuest,
  onChangeGuest,
  maxGuests = 6,
}: GuestDetailsCardProps) {
  const canAddGuest = form.additionalGuests.length < Math.max(0, maxGuests - 1)

  return (
    <section className="rounded-2xl border border-line bg-white p-5 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-ink">Guest details</h2>
        <span className="text-[0.65rem] uppercase tracking-[0.14em] text-muted">
          Required fields
        </span>
      </div>
      <p className="mt-1.5 text-sm text-muted">
        Please enter the details exactly as they appear on the guest ID.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <GuestTypeOption
          active={form.guestType === 'self'}
          onClick={() => onChange('guestType', 'self')}
          title="I am the guest"
          description="The lead guest staying at the property."
          icon={UserRound}
        />
        <GuestTypeOption
          active={form.guestType === 'someone'}
          onClick={() => onChange('guestType', 'someone')}
          title="Booking for someone else"
          description="Someone else will check in with this booking."
          icon={Users}
        />
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Select
          label="Title"
          value={form.title}
          onChange={(event) => onChange('title', event.target.value)}
        >
          {titles.map((title) => (
            <option key={title} value={title}>
              {title}
            </option>
          ))}
        </Select>
        <div className="hidden sm:block" />
        <Input
          label="First name"
          value={form.firstName}
          onChange={(event) => onChange('firstName', event.target.value)}
          error={errors.firstName}
          autoComplete="given-name"
          placeholder="Alex"
        />
        <Input
          label="Last name"
          value={form.lastName}
          onChange={(event) => onChange('lastName', event.target.value)}
          error={errors.lastName}
          autoComplete="family-name"
          placeholder="Morgan"
        />
        <Input
          label={form.guestType === 'self' ? 'Email address' : 'Guest email address'}
          type="email"
          value={form.email}
          onChange={(event) => onChange('email', event.target.value)}
          error={errors.email}
          autoComplete="email"
          placeholder="alex@example.com"
          hint="The confirmation will be sent here."
        />
        <Input
          label={form.guestType === 'self' ? 'Mobile number' : 'Guest mobile number'}
          type="tel"
          value={form.phone}
          onChange={(event) => onChange('phone', event.target.value)}
          error={errors.phone}
          autoComplete="tel"
          placeholder="+1 555 000 0000"
          hint="We will only contact you about this stay."
        />
      </div>

      <div className="mt-5 rounded-xl bg-canvas p-4">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
          GST details <span className="normal-case tracking-normal">(optional)</span>
        </p>
        <p className="mt-1 text-xs text-muted">
          Add your GSTIN if you need a tax invoice for business.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Input
            label="GSTIN"
            value={form.gstNumber}
            onChange={(event) => onChange('gstNumber', event.target.value.toUpperCase())}
            error={errors.gstNumber}
            placeholder="22AAAAA0000A1Z5"
            maxLength={15}
            autoComplete="off"
          />
          <Input
            label="Business name"
            value={form.gstBusinessName}
            onChange={(event) => onChange('gstBusinessName', event.target.value)}
            placeholder="Aurelia Travels Pvt Ltd"
            autoComplete="organization"
          />
        </div>
      </div>

      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-ink">Additional guests</h3>
            <p className="mt-0.5 text-xs text-muted">
              Add everyone staying in the room, up to {maxGuests} guests.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onAddGuest}
            disabled={!canAddGuest}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add guest
          </Button>
        </div>

        {errors.additionalGuests ? (
          <p className="mt-3 text-xs font-medium text-red-600" role="alert">
            {errors.additionalGuests}
          </p>
        ) : null}

        {form.additionalGuests.length > 0 ? (
          <div className="mt-4 space-y-3">
            {form.additionalGuests.map((additionalGuest, index) => (
              <div
                key={additionalGuest.id}
                className="rounded-xl border border-line bg-white p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Guest {index + 2}
                  </p>
                  <button
                    type="button"
                    onClick={() => onRemoveGuest(additionalGuest.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-muted transition hover:text-red-600"
                    aria-label={`Remove guest ${index + 2}`}
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    Remove
                  </button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[6rem_1fr_1fr]">
                  <Select
                    label="Title"
                    value={additionalGuest.title}
                    onChange={(event) =>
                      onChangeGuest(additionalGuest.id, { title: event.target.value })
                    }
                  >
                    {titles.map((title) => (
                      <option key={title} value={title}>
                        {title}
                      </option>
                    ))}
                  </Select>
                  <Input
                    label="First name"
                    value={additionalGuest.firstName}
                    onChange={(event) =>
                      onChangeGuest(additionalGuest.id, { firstName: event.target.value })
                    }
                    placeholder="Jordan"
                  />
                  <Input
                    label="Last name"
                    value={additionalGuest.lastName}
                    onChange={(event) =>
                      onChangeGuest(additionalGuest.id, { lastName: event.target.value })
                    }
                    placeholder="Morgan"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-xl border border-dashed border-line bg-canvas px-4 py-3 text-xs text-muted">
            No additional guests yet. Add them here if more people are staying.
          </p>
        )}
      </div>
    </section>
  )
}
