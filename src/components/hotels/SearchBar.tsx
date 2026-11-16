import {
  CalendarDays,
  ChevronDown,
  MapPin,
  Minus,
  Plus,
  Search,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { destinations } from '../../data/hotels'
import type { SearchParams } from '../../types'
import { cn } from '../../utils/cn'
import { addDays, toISODate, todayISO } from '../../utils/date'

interface SearchBarProps {
  initial: SearchParams
  onSearch: (params: SearchParams) => void
  variant?: 'hero' | 'compact'
  className?: string
}

const destinationOptions = Array.from(
  new Set([
    ...destinations.flatMap((destination) => [destination.city, destination.country]),
    'Goa',
    'Hyderabad',
    'Pune',
    'Mumbai',
    'gujrat',
    'Maldives',
  ]),
)

const labelClass = 'mb-1 block text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-slate-500'
const valueClass = 'w-full min-w-0 border-0 bg-transparent p-0 text-sm font-medium text-[#172b4d] placeholder:text-slate-400 focus:outline-none'
const tealIconClass = 'size-[1.15rem] shrink-0 text-[#0d9f91]'

function formatNumericDate(value: string) {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  return `${month}/${day}/${year}`
}

function FieldShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex min-h-[62px] items-center gap-3 px-4 py-2.5', className)}>
      {children}
    </div>
  )
}

function Counter({
  label,
  value,
  min,
  onChange,
}: {
  label: string
  value: number
  min: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm font-medium text-[#172b4d]">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex size-7 items-center justify-center rounded-full border border-line text-muted transition hover:border-[#0d9f91] hover:text-[#0d9f91] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="w-5 text-center text-sm font-semibold text-[#172b4d]">{value}</span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(value + 1)}
          className="flex size-7 items-center justify-center rounded-full border border-line text-muted transition hover:border-[#0d9f91] hover:text-[#0d9f91]"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

export function SearchBar({ initial, onSearch, variant = 'hero', className }: SearchBarProps) {
  const [search, setSearch] = useState<SearchParams>(initial)
  const [error, setError] = useState('')
  const [guestMenuOpen, setGuestMenuOpen] = useState(false)
  const [childAges, setChildAges] = useState<number[]>(
    Array.from({ length: initial.kids }, () => 5),
  )

  const setField = <K extends keyof SearchParams>(key: K, value: SearchParams[K]) => {
    setSearch((current) => {
      if (key === 'checkIn') {
        const checkIn = value as string
        const checkOut =
          current.checkOut <= checkIn
            ? toISODate(addDays(new Date(`${checkIn}T00:00:00`), 1))
            : current.checkOut
        return { ...current, checkIn, checkOut }
      }
      return { ...current, [key]: value }
    })
    setError('')
  }

  const updateAdults = (nextAdults: number) => {
    setSearch((current) => ({
      ...current,
      adults: nextAdults,
      guests: nextAdults + current.kids,
    }))
    setError('')
  }

  const updateChildren = (nextChildren: number) => {
    setSearch((current) => ({
      ...current,
      kids: nextChildren,
      guests: current.adults + nextChildren,
    }))
    setChildAges((current) =>
      Array.from({ length: nextChildren }, (_, index) => current[index] ?? 5),
    )
    setError('')
  }

  const applyGuests = () => {
    setGuestMenuOpen(false)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (search.checkOut <= search.checkIn) {
      setError('Your check-out date must be after your check-in date.')
      return
    }
    onSearch(search)
  }

  const today = todayISO()
  const guestsLabel = `${search.rooms} ${search.rooms === 1 ? 'Room' : 'Rooms'}, ${search.guests} ${
    search.guests === 1 ? 'Guest' : 'Guests'
  }`

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'w-full rounded-[1.1rem] bg-white p-2 shadow-[0_12px_35px_-28px_rgba(14,43,59,0.35)]',
        className,
      )}
    >
      <div
        className={cn(
          'grid items-stretch',
          variant === 'hero'
            ? 'lg:grid-cols-[1.1fr_2.1fr_1.1fr_10.2rem]'
            : 'xl:grid-cols-[1.1fr_2.1fr_1.1fr_10.2rem]',
        )}
      >
        <FieldShell>
          <MapPin className={tealIconClass} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <label htmlFor={`${variant}-destination`} className={labelClass}>
              Where are you going?
            </label>
            <input
              id={`${variant}-destination`}
              list="aurelia-destinations"
              value={search.destination}
              onChange={(event) => setField('destination', event.target.value)}
              placeholder="Where to?"
              className={valueClass}
              autoComplete="off"
            />
            <datalist id="aurelia-destinations">
              {destinationOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>
        </FieldShell>

        <FieldShell className="border-t border-[#dce3ea] lg:border-l lg:border-t-0">
          <CalendarDays className={tealIconClass} aria-hidden="true" />
          <div className="grid min-w-0 flex-1 grid-cols-2">
            <div className="relative min-w-0 pr-3">
              <label htmlFor={`${variant}-check-in`} className={labelClass}>
                Check-in
              </label>
              <span className="pointer-events-none absolute inset-x-0 bottom-0 text-sm font-medium text-[#172b4d]">
                {formatNumericDate(search.checkIn)}
              </span>
              <input
                id={`${variant}-check-in`}
                type="date"
                min={today}
                value={search.checkIn}
                onChange={(event) => setField('checkIn', event.target.value)}
                aria-label="Check-in date"
                className={cn(valueClass, 'relative cursor-pointer text-transparent caret-transparent')}
              />
            </div>
            <div className="relative min-w-0 border-l border-[#dce3ea] pl-3">
              <label htmlFor={`${variant}-check-out`} className={labelClass}>
                Check-out
              </label>
              <span className="pointer-events-none absolute inset-x-0 bottom-0 text-sm font-medium text-[#172b4d]">
                {formatNumericDate(search.checkOut)}
              </span>
              <input
                id={`${variant}-check-out`}
                type="date"
                min={search.checkIn || today}
                value={search.checkOut}
                onChange={(event) => setField('checkOut', event.target.value)}
                aria-label="Check-out date"
                className={cn(valueClass, 'relative cursor-pointer text-transparent caret-transparent')}
              />
            </div>
          </div>
        </FieldShell>

        <div className="relative border-t border-[#dce3ea] lg:border-l lg:border-t-0">
          <button
            type="button"
            aria-expanded={guestMenuOpen}
            onClick={() => setGuestMenuOpen((open) => !open)}
            className="flex min-h-[62px] w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-canvas"
          >
            <Users className={tealIconClass} aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className={labelClass}>Guests &amp; rooms</span>
              <span className="block truncate text-sm font-medium text-[#172b4d]">{guestsLabel}</span>
            </span>
            <ChevronDown className={cn('size-4 shrink-0 text-[#172b4d] transition-transform', guestMenuOpen && 'rotate-180')} />
          </button>

          {guestMenuOpen ? (
            <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-xl border border-line bg-white p-4 shadow-[0_20px_45px_-25px_rgba(14,43,59,0.45)] lg:min-w-[17rem]">
              <Counter
                label="Rooms"
                value={search.rooms}
                min={1}
                onChange={(value) => setField('rooms', Math.min(3, value))}
              />
              <Counter label="Adults" value={search.adults} min={1} onChange={updateAdults} />
              <Counter label="Children" value={search.kids} min={0} onChange={updateChildren} />
              {childAges.map((age, index) => (
                <label key={index} className="flex items-center justify-between border-t border-line pt-2 text-xs text-muted">
                  Child {index + 1} age
                  <select
                    value={age}
                    onChange={(event) => {
                      const nextAges = [...childAges]
                      nextAges[index] = Number(event.target.value)
                      setChildAges(nextAges)
                    }}
                    className="rounded-md border border-line px-2 py-1 text-sm text-ink"
                  >
                    {Array.from({ length: 13 }, (_, ageValue) => (
                      <option key={ageValue} value={ageValue}>
                        {ageValue}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <button
                type="button"
                onClick={applyGuests}
                className="mt-4 w-full rounded-lg bg-[#0d9f91] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0b887d]"
              >
                Apply
              </button>
            </div>
          ) : null}
        </div>

        <div className="border-t border-[#dce3ea] p-1 lg:border-l lg:border-t-0">
          <button
            type="submit"
            aria-label="Search hotels"
            className="flex min-h-[62px] w-full items-center justify-center gap-2 rounded-[0.7rem] bg-[#0d9f91] px-5 text-sm font-semibold text-white transition hover:bg-[#0b887d]"
          >
            <Search className="size-[1.1rem]" aria-hidden="true" />
            <span>Search hotels</span>
          </button>
        </div>
      </div>
      {error ? (
        <p className="px-4 pb-1 pt-2 text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}
