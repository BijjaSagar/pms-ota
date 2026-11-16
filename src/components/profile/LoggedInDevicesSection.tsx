import { Clock3, MapPin, Monitor, Smartphone } from 'lucide-react'
import type { LoggedInDevice } from '../../types'
import { cn } from '../../utils/cn'
import { Badge } from '../ui/Badge'
import { SectionCard } from './SectionCard'

interface LoggedInDevicesSectionProps {
  devices: LoggedInDevice[]
}

export function LoggedInDevicesSection({ devices }: LoggedInDevicesSectionProps) {
  const active = devices.filter((device) => device.loggedIn).length

  return (
    <SectionCard
      title="Logged-in devices"
      description="These devices are currently signed in to your account. If you see something you don't recognise, reset your password."
      action={
        <Badge tone="success">
          {active} {active === 1 ? 'session' : 'sessions'} active
        </Badge>
      }
    >
      <ul className="space-y-3">
        {devices.map((device) => {
          const Icon = device.type === 'desktop' ? Monitor : Smartphone
          return (
            <li
              key={device.id}
              className="flex flex-col gap-4 rounded-2xl border border-line bg-canvas/60 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-brand">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-ink">{device.name}</p>
                    {device.current ? <Badge tone="accent">This device</Badge> : null}
                  </div>
                  <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted">
                    <span
                      className={cn(
                        'size-1.5 rounded-full',
                        device.loggedIn ? 'bg-success' : 'bg-muted/50',
                      )}
                      aria-hidden="true"
                    />
                    {device.loggedIn ? 'Logged in' : 'Signed out'}
                  </p>
                </div>
              </div>

              <div className="grid gap-2 text-sm text-muted sm:grid-cols-2 sm:gap-6">
                <p className="inline-flex items-center gap-2">
                  <MapPin className="size-4 shrink-0 text-accent" aria-hidden="true" />
                  {device.location}
                </p>
                <p className="inline-flex items-center gap-2">
                  <Clock3 className="size-4 shrink-0 text-accent" aria-hidden="true" />
                  {device.loginTime}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </SectionCard>
  )
}
