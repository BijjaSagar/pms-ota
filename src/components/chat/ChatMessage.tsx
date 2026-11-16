import { ArrowRight, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'
import { formatCurrency } from '../../utils/pricing'
import type { ChatEntry } from './chatTypes'
import { RobotFace } from './RobotFace'

interface ChatMessageProps {
  message: ChatEntry
  onNavigate?: () => void
}

export function ChatMessage({ message, onNavigate }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-2.5', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser ? (
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-[#79d8cf] shadow-sm">
          <RobotFace className="size-6" />
        </span>
      ) : null}

      <div className={cn('max-w-[85%] space-y-2.5', isUser && 'flex flex-col items-end')}>
        <div
          className={cn(
            'whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[0.8rem] leading-relaxed',
            isUser
              ? 'rounded-br-md bg-brand text-white'
              : 'rounded-bl-md border border-line bg-canvas text-ink',
          )}
        >
          {message.text}
        </div>

        {message.hotels?.length ? (
          <div className="w-full space-y-2">
            {message.hotels.map((hotel) => (
              <Link
                key={hotel.id}
                to={`/hotels/${hotel.slug}`}
                onClick={onNavigate}
                className="group flex gap-3 rounded-xl border border-line bg-white p-2.5 transition hover:border-accent/40 hover:shadow-sm"
              >
                <img
                  src={hotel.images[0]}
                  alt={hotel.name}
                  loading="lazy"
                  className="size-14 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-ink">{hotel.name}</p>
                  <p className="truncate text-[0.65rem] text-muted">
                    {hotel.location.city}, {hotel.location.country}
                  </p>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[0.65rem]">
                    <span className="inline-flex items-center gap-1 font-medium text-ink">
                      <Star className="size-3 fill-accent text-accent" aria-hidden="true" />
                      {hotel.rating.toFixed(1)}
                    </span>
                    <span className="font-medium text-ink">
                      {formatCurrency(hotel.pricePerNight)}
                      <span className="font-normal text-muted"> / night</span>
                    </span>
                  </div>
                </div>
                <ArrowRight className="mt-1 size-3.5 shrink-0 text-muted transition group-hover:text-accent" aria-hidden="true" />
              </Link>
            ))}
          </div>
        ) : null}

        {message.actions?.length ? (
          <div className="flex flex-wrap gap-2">
            {message.actions.map((action) => (
              <Link
                key={`${action.label}-${action.to}`}
                to={action.to}
                onClick={onNavigate}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-[0.7rem] font-medium text-ink transition hover:border-accent/50 hover:text-accent"
              >
                {action.label}
                <ArrowRight className="size-3" aria-hidden="true" />
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
