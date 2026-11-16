import { Mail, MapPin, Pencil, Phone, Plus, Trash2, UserRound } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  countryOptions,
  genderOptions,
  mealPreferenceOptions,
  nationalityOptions,
  relationshipOptions,
} from '../../data/profile'
import type { CoTraveller, Gender } from '../../types'
import { formatDate } from '../../utils/date'
import { isValidEmail, isValidPhone } from '../../utils/validation'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Input, Select } from '../ui/Field'
import { Modal } from '../ui/Modal'
import { SectionCard } from './SectionCard'

function fullName(traveller: CoTraveller) {
  return [traveller.firstName, traveller.middleName, traveller.lastName].filter(Boolean).join(' ')
}

function initials(traveller: CoTraveller) {
  return `${traveller.firstName.charAt(0)}${traveller.lastName.charAt(0)}`.toUpperCase() || 'CT'
}

function createEmptyCoTraveller(): CoTraveller {
  return {
    id: crypto.randomUUID(),
    firstName: '',
    middleName: '',
    lastName: '',
    gender: 'Female',
    dob: '',
    nationality: 'Indian',
    relationship: 'Spouse',
    mealPreference: 'No preference',
    countryName: 'India',
    countryCode: '+91',
    mobile: '',
    email: '',
  }
}

type FormErrors = Partial<Record<keyof CoTraveller, string>>

interface CoTravellersSectionProps {
  travellers: CoTraveller[]
  onSave: (traveller: CoTraveller) => void
  onRemove: (id: string) => void
}

export function CoTravellersSection({ travellers, onSave, onRemove }: CoTravellersSectionProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [draft, setDraft] = useState<CoTraveller | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [removeTarget, setRemoveTarget] = useState<CoTraveller | null>(null)

  const openAdd = () => {
    setDraft(createEmptyCoTraveller())
    setErrors({})
    setFormOpen(true)
  }

  const openEdit = (traveller: CoTraveller) => {
    setDraft({ ...traveller })
    setErrors({})
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setDraft(null)
    setErrors({})
  }

  const setField = <K extends keyof CoTraveller>(key: K, value: CoTraveller[K]) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const handleCountry = (name: string) => {
    const country = countryOptions.find((option) => option.name === name)
    if (!country) return
    setDraft((current) =>
      current ? { ...current, countryName: country.name, countryCode: country.code } : current,
    )
  }

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft) return

    const next: FormErrors = {}
    if (!draft.firstName.trim()) next.firstName = 'First name is required.'
    if (!draft.lastName.trim()) next.lastName = 'Last name is required.'
    if (!draft.email.trim()) next.email = 'Email address is required.'
    else if (!isValidEmail(draft.email)) next.email = 'Enter a valid email address.'
    if (!draft.mobile.trim()) next.mobile = 'Mobile number is required.'
    else if (!isValidPhone(draft.mobile)) next.mobile = 'Enter a valid mobile number.'

    setErrors(next)
    if (Object.keys(next).length > 0) return

    onSave({
      ...draft,
      firstName: draft.firstName.trim(),
      middleName: draft.middleName.trim(),
      lastName: draft.lastName.trim(),
      email: draft.email.trim(),
      mobile: draft.mobile.trim(),
    })
    closeForm()
  }

  const confirmRemove = () => {
    if (!removeTarget) return
    onRemove(removeTarget.id)
    setRemoveTarget(null)
  }

  return (
    <div className="space-y-5">
      <SectionCard
        title="Co-travellers"
        description="Save the people you travel with so checkout is faster next time."
        action={
          <Button type="button" size="sm" onClick={openAdd}>
            <Plus className="size-4" aria-hidden="true" />
            Add co-traveller
          </Button>
        }
      >
        {travellers.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {travellers.map((traveller) => (
              <article key={traveller.id} className="flex flex-col rounded-2xl border border-line bg-canvas/60 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-soft font-display text-lg text-brand">
                      {initials(traveller)}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-xl leading-tight text-ink">{fullName(traveller)}</h3>
                      <p className="text-xs text-muted">{traveller.gender}</p>
                    </div>
                  </div>
                  <Badge tone="accent">{traveller.relationship}</Badge>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-[0.6rem] uppercase tracking-[0.14em] text-muted">Date of birth</dt>
                    <dd className="mt-0.5 font-medium text-ink">{formatDate(traveller.dob)}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.6rem] uppercase tracking-[0.14em] text-muted">Nationality</dt>
                    <dd className="mt-0.5 font-medium text-ink">{traveller.nationality}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-[0.6rem] uppercase tracking-[0.14em] text-muted">Meal preference</dt>
                    <dd className="mt-0.5 font-medium text-ink">{traveller.mealPreference}</dd>
                  </div>
                </dl>

                <div className="mt-4 space-y-2 rounded-xl bg-white p-3 text-sm">
                  <p className="flex items-center gap-2 text-ink">
                    <Phone className="size-4 shrink-0 text-accent" aria-hidden="true" />
                    <span className="font-numeric">
                      {traveller.countryCode} {traveller.mobile}
                    </span>
                  </p>
                  <p className="flex items-center gap-2 break-all text-ink">
                    <Mail className="size-4 shrink-0 text-accent" aria-hidden="true" />
                    {traveller.email}
                  </p>
                  <p className="flex items-center gap-2 text-ink">
                    <MapPin className="size-4 shrink-0 text-accent" aria-hidden="true" />
                    {traveller.countryName}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-4 pt-1">
                  <button
                    type="button"
                    onClick={() => openEdit(traveller)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-ink"
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setRemoveTarget(traveller)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-red-600"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-line bg-canvas px-6 py-10 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-white text-brand">
              <UserRound className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-4 font-display text-2xl text-ink">No co-travellers yet</p>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
              Add the people you usually travel with and their details will be ready at checkout.
            </p>
            <Button type="button" variant="secondary" size="sm" className="mt-5" onClick={openAdd}>
              <Plus className="size-4" aria-hidden="true" />
              Add co-traveller
            </Button>
          </div>
        )}
      </SectionCard>

      <Modal
        open={formOpen && draft !== null}
        onClose={closeForm}
        title={draft && travellers.some((item) => item.id === draft.id) ? 'Edit co-traveller' : 'Add co-traveller'}
        description="Tell us who is travelling so we can share their booking updates too."
        className="max-w-2xl"
      >
        {draft ? (
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-ink">General information</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Input
                  label="First name"
                  value={draft.firstName}
                  onChange={(event) => setField('firstName', event.target.value)}
                  error={errors.firstName}
                  autoComplete="given-name"
                  placeholder="Priya"
                />
                <Input
                  label="Middle name"
                  value={draft.middleName}
                  onChange={(event) => setField('middleName', event.target.value)}
                  autoComplete="additional-name"
                  placeholder="Anita"
                />
                <Input
                  label="Last name"
                  value={draft.lastName}
                  onChange={(event) => setField('lastName', event.target.value)}
                  error={errors.lastName}
                  autoComplete="family-name"
                  placeholder="Morgan"
                />
                <Select
                  label="Gender"
                  value={draft.gender}
                  onChange={(event) => setField('gender', event.target.value as Gender)}
                >
                  {genderOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Date of birth"
                  type="date"
                  value={draft.dob}
                  onChange={(event) => setField('dob', event.target.value)}
                  autoComplete="bday"
                />
                <Select
                  label="Nationality"
                  value={draft.nationality}
                  onChange={(event) => setField('nationality', event.target.value)}
                >
                  {nationalityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Relationship with traveller"
                  value={draft.relationship}
                  onChange={(event) => setField('relationship', event.target.value)}
                >
                  {relationshipOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Meal preference"
                  value={draft.mealPreference}
                  onChange={(event) => setField('mealPreference', event.target.value)}
                >
                  {mealPreferenceOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="border-t border-line pt-5">
              <h3 className="text-sm font-semibold text-ink">Contact details to receive bookings</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Select
                  label="Country"
                  value={draft.countryName}
                  onChange={(event) => handleCountry(event.target.value)}
                >
                  {countryOptions.map((option) => (
                    <option key={option.name} value={option.name}>
                      {option.name} ({option.code})
                    </option>
                  ))}
                </Select>
                <Input
                  label="Mobile number"
                  type="tel"
                  value={draft.mobile}
                  onChange={(event) => setField('mobile', event.target.value)}
                  error={errors.mobile}
                  hint={`Country code ${draft.countryCode}`}
                  autoComplete="tel"
                  placeholder="98111 22334"
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Email address"
                    type="email"
                    value={draft.email}
                    onChange={(event) => setField('email', event.target.value)}
                    error={errors.email}
                    autoComplete="email"
                    placeholder="priya@example.com"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={closeForm}>
                Cancel
              </Button>
              <Button type="submit">{travellers.some((item) => item.id === draft.id) ? 'Save changes' : 'Add co-traveller'}</Button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        title="Remove co-traveller?"
        description={
          removeTarget
            ? `Are you sure you want to remove ${fullName(removeTarget)} from your saved co-travellers?`
            : undefined
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => setRemoveTarget(null)}>
            Cancel
          </Button>
          <button
            type="button"
            onClick={confirmRemove}
            className="inline-flex items-center justify-center rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Remove
          </button>
        </div>
      </Modal>
    </div>
  )
}
