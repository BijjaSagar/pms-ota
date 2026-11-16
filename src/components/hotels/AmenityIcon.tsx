import {
  BellRing,
  Car,
  Coffee,
  Dumbbell,
  Flower2,
  Leaf,
  Mountain,
  PawPrint,
  Plane,
  Snowflake,
  Sparkles,
  Sun,
  Umbrella,
  UtensilsCrossed,
  Waves,
  Wifi,
  Wine,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { HighlightIcon } from '../../types'

const icons: Record<string, LucideIcon> = {
  'Free WiFi': Wifi,
  'Infinity pool': Waves,
  'Sea-water pool': Waves,
  Spa: Sparkles,
  Restaurant: UtensilsCrossed,
  Bar: Wine,
  'Fitness center': Dumbbell,
  Parking: Car,
  'Beach access': Umbrella,
  'Airport transfer': Plane,
  'Pet friendly': PawPrint,
  'Breakfast included': Coffee,
  'Air conditioning': Snowflake,
  Concierge: BellRing,
  Garden: Flower2,
  Laundry: Sparkles,
  sparkles: Sparkles,
  waves: Waves,
  leaf: Leaf,
  utensils: UtensilsCrossed,
  mountain: Mountain,
  sun: Sun,
  wine: Wine,
  flower: Flower2,
}

export function AmenityIcon({ name, className }: { name: string | HighlightIcon; className?: string }) {
  const Icon = icons[name] ?? Sparkles
  return <Icon className={className} aria-hidden="true" />
}
