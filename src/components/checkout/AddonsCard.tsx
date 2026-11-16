import {
  Baby,
  BedDouble,
  Car,
  Check,
  Coffee,
  Shirt,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { addonTotal, addons } from '../../data/addons'
import { cn } from '../../utils/cn'
import { formatCurrency } from '../../utils/pricing'

const iconMap: Record<string, LucideIcon> = {
  coffee: Coffee,
  car: Car,
  sparkles: Sparkles,
  shirt: Shirt,
  bed: BedDouble,
  baby: Baby,
  clock: Sparkles,
}

interface AddonsCardProps {
  selected: string[]
  nights: number
  guests: number
  onToggle: (id: string) => void
}

export function AddonsCard({ selected, nights, guests, onToggle }: AddonsCardProps) {
  const available = addons.filter((addon) => addon.inAddonList !== false)

  return (
    <section className="rounded-2xl border border-line bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-2xl text-ink">Add-ons</h2>
          <p className="mt-1.5 text-sm text-muted">
            Little extras that make the stay easier. Prices are for your full stay.
          </p>
        </div>
        <span className="text-[0.65rem] uppercase tracking-[0.14em] text-muted">Optional</span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {available.map((addon) => {
          const isSelected = selected.includes(addon.id)
          const Icon = iconMap[addon.icon] ?? Sparkles
          const price = addonTotal(addon, nights, guests)

          return (
            <label
              key={addon.id}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition',
                isSelected
                  ? 'border-brand bg-brand-soft/50 ring-1 ring-brand/15'
                  : 'border-line bg-white hover:border-ink/20',
              )}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(addon.id)}
                className="sr-only"
              />
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-full',
                  isSelected ? 'bg-brand text-white' : 'bg-canvas text-brand',
                )}
              >
                {isSelected ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : (
                  <Icon className="size-4" aria-hidden="true" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-ink">{addon.name}</span>
                  <span className="font-numeric shrink-0 text-xs font-semibold text-ink">
                    {formatCurrency(price)}
                  </span>
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                  {addon.description}
                </span>
              </span>
            </label>
          )
        })}
      </div>
    </section>
  )
}
