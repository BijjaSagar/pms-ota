import { KeyRound, LogOut, MonitorSmartphone, UserRound, Users } from 'lucide-react'
import { cn } from '../../utils/cn'

export type ProfileSection = 'profile' | 'travellers' | 'devices' | 'password'

const items: { id: ProfileSection; label: string; icon: typeof UserRound }[] = [
  { id: 'profile', label: 'My profile', icon: UserRound },
  { id: 'travellers', label: 'Co-travellers', icon: Users },
  { id: 'devices', label: 'Logged-in devices', icon: MonitorSmartphone },
  { id: 'password', label: 'Reset password', icon: KeyRound },
]

interface ProfileNavProps {
  active: ProfileSection
  onChange: (section: ProfileSection) => void
  onLogout: () => void
}

export function ProfileNav({ active, onChange, onLogout }: ProfileNavProps) {
  return (
    <nav aria-label="Profile sections">
      <div className="flex gap-1 overflow-x-auto lg:flex-col">
        {items.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'inline-flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors lg:w-full',
                isActive
                  ? 'bg-brand text-white'
                  : 'text-muted hover:bg-canvas hover:text-ink',
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {label}
            </button>
          )
        })}
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-red-50 hover:text-red-600 lg:w-full"
        >
          <LogOut className="size-4 shrink-0" aria-hidden="true" />
          Log out
        </button>
      </div>
    </nav>
  )
}
