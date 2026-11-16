import { Check } from 'lucide-react'
import { cn } from '../../utils/cn'

interface StepperProps {
  steps: string[]
  current: number
}

export function Stepper({ steps, current }: StepperProps) {
  return (
    <ol className="flex items-center gap-2 sm:gap-4" aria-label="Booking progress">
      {steps.map((step, index) => {
        const complete = index < current
        const active = index === current
        return (
          <li key={step} className={cn('flex items-center gap-2 sm:gap-3', index === steps.length - 1 && 'flex-none')}>
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors sm:size-8',
                  complete && 'border-brand bg-brand text-white',
                  active && 'border-brand bg-brand text-white',
                  !complete && !active && 'border-line bg-white text-muted',
                )}
                aria-current={active ? 'step' : undefined}
              >
                {complete ? <Check className="size-3.5" aria-hidden="true" /> : index + 1}
              </span>
              <span
                className={cn(
                  'hidden whitespace-nowrap text-xs font-medium sm:block',
                  active ? 'text-ink' : 'text-muted',
                )}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 ? (
              <span className={cn('h-px w-6 sm:w-10 lg:w-16', index < current ? 'bg-brand' : 'bg-line')} />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
