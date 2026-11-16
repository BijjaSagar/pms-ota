import { cn } from '../../utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'outline-inverse'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-all duration-300 disabled:pointer-events-none disabled:opacity-50'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white shadow-sm hover:bg-[#0a2331] hover:shadow-md',
  secondary: 'border border-line bg-white text-ink hover:border-ink/25 hover:bg-canvas',
  ghost: 'text-ink hover:bg-brand-soft',
  accent: 'bg-accent text-white shadow-sm hover:brightness-95 hover:shadow-md',
  'outline-inverse': 'border border-white/35 text-white hover:bg-white/10',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
}

export const buttonStyles = (
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  fullWidth = false,
) => cn(base, variants[variant], sizes[size], fullWidth && 'w-full')
