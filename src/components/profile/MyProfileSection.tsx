import { Check, FileText, Upload, UserRound } from 'lucide-react'
import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import {
  countryOptions,
  documentTypeOptions,
  genderOptions,
  maritalStatusOptions,
  nationalityOptions,
} from '../../data/profile'
import type { Gender, MaritalStatus, ProfileDocument, UserProfile } from '../../types'
import { Button } from '../ui/Button'
import { Input, Select } from '../ui/Field'
import { SectionCard } from './SectionCard'

const dialCodes = Array.from(new Set(countryOptions.map((country) => country.code)))

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'AM'
}

interface MyProfileSectionProps {
  profile: UserProfile
  onChange: <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => void
  onDocumentChange: <K extends keyof ProfileDocument>(key: K, value: string) => void
  onPhotoChange: (file: File) => void
}

export function MyProfileSection({
  profile,
  onChange,
  onDocumentChange,
  onPhotoChange,
}: MyProfileSectionProps) {
  const photoInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const [saved, setSaved] = useState(false)

  const handlePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onPhotoChange(file)
      setSaved(false)
    }
    event.target.value = ''
  }

  const handleDocument = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onDocumentChange('fileName', file.name)
      setSaved(false)
    }
    event.target.value = ''
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaved(true)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <SectionCard
        title="Profile photo"
        description="Upload a clear photo so hosts can recognise you on arrival."
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative">
            {profile.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt="Profile photo"
                className="size-24 rounded-2xl border border-line object-cover"
              />
            ) : (
              <span className="flex size-24 items-center justify-center rounded-2xl bg-brand-soft font-display text-3xl text-brand">
                {initials(profile.firstName, profile.lastName)}
              </span>
            )}
            <span className="absolute -bottom-2 -right-2 flex size-8 items-center justify-center rounded-full border border-line bg-white text-brand">
              <UserRound className="size-4" aria-hidden="true" />
            </span>
          </div>
          <div>
            <p className="font-display text-2xl leading-tight text-ink">
              {profile.firstName} {profile.lastName}
            </p>
            <p className="mt-1 text-sm text-muted">{profile.email}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button type="button" variant="secondary" size="sm" onClick={() => photoInputRef.current?.click()}>
                Browse photo
              </Button>
              <span className="text-xs text-muted">JPG or PNG, up to 5 MB.</span>
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handlePhoto}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="General information" description="Keep this exactly as it appears on your ID.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            label="First name"
            value={profile.firstName}
            onChange={(event) => onChange('firstName', event.target.value)}
            autoComplete="given-name"
            placeholder="Alex"
          />
          <Input
            label="Middle name"
            value={profile.middleName}
            onChange={(event) => onChange('middleName', event.target.value)}
            autoComplete="additional-name"
            placeholder="Jordan"
          />
          <Input
            label="Last name"
            value={profile.lastName}
            onChange={(event) => onChange('lastName', event.target.value)}
            autoComplete="family-name"
            placeholder="Morgan"
          />
          <Select
            label="Gender"
            value={profile.gender}
            onChange={(event) => onChange('gender', event.target.value as Gender)}
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
            value={profile.dob}
            onChange={(event) => onChange('dob', event.target.value)}
            autoComplete="bday"
          />
          <Select
            label="Nationality"
            value={profile.nationality}
            onChange={(event) => onChange('nationality', event.target.value)}
          >
            {nationalityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          <Select
            label="Marital status"
            value={profile.maritalStatus}
            onChange={(event) => onChange('maritalStatus', event.target.value as MaritalStatus)}
          >
            {maritalStatusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          <Input
            label="City of residence"
            value={profile.cityOfResidence}
            onChange={(event) => onChange('cityOfResidence', event.target.value)}
            autoComplete="address-level2"
            placeholder="Mumbai"
          />
          <Input
            label="State"
            value={profile.state}
            onChange={(event) => onChange('state', event.target.value)}
            autoComplete="address-level1"
            placeholder="Maharashtra"
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Contact details"
        description="We will use these to send booking confirmations and updates."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid grid-cols-[7rem_1fr] gap-3">
            <Select
              label="Code"
              value={profile.mobileCountryCode}
              onChange={(event) => onChange('mobileCountryCode', event.target.value)}
            >
              {dialCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </Select>
            <Input
              label="Mobile number"
              type="tel"
              value={profile.mobile}
              onChange={(event) => onChange('mobile', event.target.value)}
              autoComplete="tel"
              placeholder="98765 43210"
            />
          </div>
          <Input
            label="Email address"
            type="email"
            value={profile.email}
            onChange={(event) => onChange('email', event.target.value)}
            autoComplete="email"
            placeholder="alex@example.com"
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Document details"
        description="Add a valid travel document for faster check-in."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Document type"
            value={profile.document.type}
            onChange={(event) => onDocumentChange('type', event.target.value)}
          >
            {documentTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          <Input
            label="Document number"
            value={profile.document.number}
            onChange={(event) => onDocumentChange('number', event.target.value.toUpperCase())}
            autoComplete="off"
            placeholder="M1234567"
          />
          <Input
            label="Expiry date"
            type="date"
            value={profile.document.expiry}
            onChange={(event) => onDocumentChange('expiry', event.target.value)}
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-dashed border-line bg-canvas px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-brand">
              <FileText className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-medium text-ink">
                {profile.document.fileName || 'No document uploaded'}
              </p>
              <p className="text-xs text-muted">PDF, JPG or PNG up to 10 MB.</p>
            </div>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => documentInputRef.current?.click()}>
            <Upload className="size-4" aria-hidden="true" />
            Upload document
          </Button>
          <input
            ref={documentInputRef}
            type="file"
            accept="image/*,.pdf"
            className="sr-only"
            onChange={handleDocument}
          />
        </div>
      </SectionCard>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {saved ? (
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-success" role="status">
            <Check className="size-4" aria-hidden="true" />
            Profile updated
          </p>
        ) : null}
        <Button type="submit">Save changes</Button>
      </div>
    </form>
  )
}
