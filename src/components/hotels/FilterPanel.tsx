import { ChevronDown, Search } from 'lucide-react'
import { useState } from 'react'
import { amenityFilters, propertyTypeFilters } from '../../data/hotels'
import type { HotelFilters, PropertyType } from '../../types'
import { cn } from '../../utils/cn'
import { formatCurrency } from '../../utils/pricing'

interface FilterPanelProps {
  filters: HotelFilters
  onChange: (filters: HotelFilters) => void
  destination: string
  onDestinationChange: (value: string) => void
  className?: string
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted">{children}</h3>
  )
}

function SectionToggle({
  label,
  open,
  onToggle,
}: {
  label: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between text-left"
      aria-expanded={open}
    >
      <SectionTitle>{label}</SectionTitle>
      <ChevronDown
        className={cn('size-4 text-muted transition-transform', open && 'rotate-180')}
        aria-hidden="true"
      />
    </button>
  )
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1.5 text-sm text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-4 rounded border-line accent-brand focus:ring-brand"
      />
      <span className={cn('transition-colors', checked ? 'font-medium text-ink' : 'text-muted')}>
        {label}
      </span>
    </label>
  )
}

function ExpandableCheckRows({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[]
  selected: string[]
  onToggle: (option: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const visibleOptions = expanded ? options : options.slice(0, 5)
  const hiddenCount = options.length - 5

  return (
    <div>
      {visibleOptions.map((option) => (
        <CheckRow
          key={option}
          label={option}
          checked={selected.includes(option)}
          onChange={() => onToggle(option)}
        />
      ))}
      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="mt-1 text-xs font-semibold text-brand transition hover:text-ink"
        >
          {expanded ? 'Hide' : `Show ${hiddenCount} more`}
        </button>
      ) : null}
    </div>
  )
}

export function FilterPanel({
  filters,
  onChange,
  destination,
  onDestinationChange,
  className,
}: FilterPanelProps) {
  const [forYouOpen, setForYouOpen] = useState(false)
  const [nightlyRateOpen, setNightlyRateOpen] = useState(false)
  const [budgetOpen, setBudgetOpen] = useState(false)
  const [starCategoryOpen, setStarCategoryOpen] = useState(false)
  const [flexibleCheckInOutOpen, setFlexibleCheckInOutOpen] = useState(false)
  const [houseRulesOpen, setHouseRulesOpen] = useState(false)
  const [businessEssentialsOpen, setBusinessEssentialsOpen] = useState(false)
  const [propertyTypeOpen, setPropertyTypeOpen] = useState(false)
  const [guestRatingOpen, setGuestRatingOpen] = useState(false)
  const [amenitiesOpen, setAmenitiesOpen] = useState(false)
  const togglePropertyType = (type: PropertyType) => {
    const next = filters.propertyTypes.includes(type)
      ? filters.propertyTypes.filter((item) => item !== type)
      : [...filters.propertyTypes, type]
    onChange({ ...filters, propertyTypes: next })
  }

  const toggleAmenity = (amenity: string) => {
    const next = filters.amenities.includes(amenity)
      ? filters.amenities.filter((item) => item !== amenity)
      : [...filters.amenities, amenity]
    onChange({ ...filters, amenities: next })
  }

  const togglePreference = (preference: string) => {
    const next = filters.preferences.includes(preference)
      ? filters.preferences.filter((item) => item !== preference)
      : [...filters.preferences, preference]
    onChange({ ...filters, preferences: next })
  }

  const toggleStarCategory = (stars: number) => {
    const next = filters.starCategories.includes(stars)
      ? filters.starCategories.filter((item) => item !== stars)
      : [...filters.starCategories, stars]
    onChange({ ...filters, starCategories: next })
  }

  const toggleFlexibleCheckInOut = (option: string) => {
    const next = filters.flexibleCheckInOut.includes(option)
      ? filters.flexibleCheckInOut.filter((item) => item !== option)
      : [...filters.flexibleCheckInOut, option]
    onChange({ ...filters, flexibleCheckInOut: next })
  }

  const toggleHouseRule = (rule: string) => {
    const next = filters.houseRules.includes(rule)
      ? filters.houseRules.filter((item) => item !== rule)
      : [...filters.houseRules, rule]
    onChange({ ...filters, houseRules: next })
  }

  const toggleBusinessEssential = (essential: string) => {
    const next = filters.businessEssentials.includes(essential)
      ? filters.businessEssentials.filter((item) => item !== essential)
      : [...filters.businessEssentials, essential]
    onChange({ ...filters, businessEssentials: next })
  }

  const preferenceFilters = [
    'Rush deals',
    'Last-minute deal',
    'Beachfront',
    'Self check-in available',
    'Breakfast included',
    'Pool access',
  ]

  return (
    <aside className={cn('rounded-2xl border border-line bg-white p-5', className)}>
      <label className="relative mt-5 block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sky-500" aria-hidden="true" />
        <span className="sr-only">Search by locality or hotel name</span>
        <input
          type="search"
          value={destination}
          onChange={(event) => onDestinationChange(event.target.value)}
          placeholder="Search for locality / hotel name"
          className="!h-11 w-full rounded-md border border-line bg-white !pl-[35px] pr-3 !text-sm text-ink outline-none transition placeholder:text-muted focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      </label>

      <div className="mt-6 border-t border-line pt-5">
        <SectionToggle
          label="For you"
          open={forYouOpen}
          onToggle={() => setForYouOpen((open) => !open)}
        />
        {forYouOpen ? (
          <div className="mt-2">
            <ExpandableCheckRows
              options={preferenceFilters}
              selected={filters.preferences}
              onToggle={togglePreference}
            />
          </div>
        ) : null}
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <SectionToggle
          label="Your budget"
          open={budgetOpen}
          onToggle={() => setBudgetOpen((open) => !open)}
        />
        {budgetOpen ? (
          <div className="relative mt-4 h-14">
            <span
              className="absolute top-0 z-30 -translate-x-1/2 rounded bg-white px-1.5 text-xs font-bold leading-4 text-ink"
              style={{ left: `${((filters.maxPrice - 250) / 1750) * 100}%` }}
            >
              {formatCurrency(filters.maxPrice)}
            </span>
            <div className="absolute inset-x-0 top-7 h-1.5 rounded-full bg-line" />
            <div
              className="absolute top-7 h-1.5 rounded-full bg-brand"
              style={{
                left: 0,
                right: `${((2000 - filters.maxPrice) / 1750) * 100}%`,
              }}
            />
            <input
              type="range"
              min={250}
              max={2000}
              step={50}
              value={filters.maxPrice}
              onChange={(event) => onChange({ ...filters, maxPrice: Number(event.target.value) })}
              className="absolute inset-x-0 top-5 z-10 h-6 w-full appearance-none bg-transparent [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-brand [&::-moz-range-thumb]:shadow-[0_0_0_2px_rgba(14,43,59,0.2)] [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:shadow-[0_0_0_2px_rgba(14,43,59,0.2)]"
              aria-label="Maximum nightly budget"
            />
            <div className="absolute inset-x-0 top-11 flex justify-between text-[0.65rem] text-muted">
              <span>$250</span>
              <span>$2,000</span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <SectionToggle
          label="Star category"
          open={starCategoryOpen}
          onToggle={() => setStarCategoryOpen((open) => !open)}
        />
        {starCategoryOpen ? (
          <div className="mt-2">
            {[3, 4, 5].map((stars) => (
              <CheckRow
                key={stars}
                label={`${stars} star${stars === 1 ? '' : 's'}`}
                checked={filters.starCategories.includes(stars)}
                onChange={() => toggleStarCategory(stars)}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <SectionToggle
          label="Nightly rate"
          open={nightlyRateOpen}
          onToggle={() => setNightlyRateOpen((open) => !open)}
        />
        {nightlyRateOpen ? (
          <div>
            <p className="mt-2 text-right text-xs font-semibold text-ink">
              Up to {formatCurrency(filters.maxPrice)}
            </p>
            <input
              type="range"
              min={250}
              max={2000}
              step={50}
              value={filters.maxPrice}
              onChange={(event) => onChange({ ...filters, maxPrice: Number(event.target.value) })}
              className="mt-2 w-full accent-brand"
              aria-label="Maximum nightly rate"
            />
            <div className="mt-1 flex justify-between text-[0.65rem] text-muted">
              <span>$250</span>
              <span>$2,000</span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <SectionToggle
          label="Property type"
          open={propertyTypeOpen}
          onToggle={() => setPropertyTypeOpen((open) => !open)}
        />
        {propertyTypeOpen ? (
          <div className="mt-2">
            {propertyTypeFilters.map((type) => (
              <CheckRow
                key={type}
                label={type}
                checked={filters.propertyTypes.includes(type)}
                onChange={() => togglePropertyType(type)}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <SectionToggle
          label="Flexible check-in/out"
          open={flexibleCheckInOutOpen}
          onToggle={() => setFlexibleCheckInOutOpen((open) => !open)}
        />
        {flexibleCheckInOutOpen ? (
          <div className="mt-2">
            {['Guaranteed early check-in', 'Guaranteed late checkout'].map((option) => (
              <CheckRow
                key={option}
                label={option}
                checked={filters.flexibleCheckInOut.includes(option)}
                onChange={() => toggleFlexibleCheckInOut(option)}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <SectionToggle
          label="Guest rating"
          open={guestRatingOpen}
          onToggle={() => setGuestRatingOpen((open) => !open)}
        />
        {guestRatingOpen ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {[0, 4.5, 4.8, 4.9].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => onChange({ ...filters, minRating: rating })}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                  filters.minRating === rating
                    ? 'border-brand bg-brand text-white'
                    : 'border-line bg-white text-muted hover:border-ink/20 hover:text-ink',
                )}
              >
                {rating === 0 ? 'Any' : `${rating}+`}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <SectionToggle
          label="Amenities"
          open={amenitiesOpen}
          onToggle={() => setAmenitiesOpen((open) => !open)}
        />
        {amenitiesOpen ? (
          <div className="mt-2">
            <ExpandableCheckRows
              options={amenityFilters}
              selected={filters.amenities}
              onToggle={toggleAmenity}
            />
          </div>
        ) : null}
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <SectionToggle
          label="House rules"
          open={houseRulesOpen}
          onToggle={() => setHouseRulesOpen((open) => !open)}
        />
        {houseRulesOpen ? (
          <div className="mt-2">
            {[
              'Alcohol allowed',
              'Pets allowed',
              'Non-smoking',
              'All male guests allowed',
              'Unmarried guests allowed',
            ].map((rule) => (
              <CheckRow
                key={rule}
                label={rule}
                checked={filters.houseRules.includes(rule)}
                onChange={() => toggleHouseRule(rule)}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <SectionToggle
          label="Business essentials"
          open={businessEssentialsOpen}
          onToggle={() => setBusinessEssentialsOpen((open) => !open)}
        />
        {businessEssentialsOpen ? (
          <div className="mt-2">
            {[
              'WiFi',
              'Breakfast included',
              'All meals included',
              'Breakfast + lunch/dinner',
              'Pay at hotel',
            ].map((essential) => (
              <CheckRow
                key={essential}
                label={essential}
                checked={filters.businessEssentials.includes(essential)}
                onChange={() => toggleBusinessEssential(essential)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </aside>
  )
}
