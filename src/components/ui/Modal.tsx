import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  centered?: boolean
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  centered = false,
}: ModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[100] flex animate-fade-in justify-center bg-brand/60 backdrop-blur-sm',
        centered ? 'items-center p-3 sm:p-4' : 'items-end sm:items-center sm:p-4',
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onMouseDown={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
        className={cn(
          'flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg animate-scale-in flex-col overflow-hidden bg-white shadow-2xl outline-none',
          centered ? 'rounded-2xl' : 'rounded-t-2xl sm:rounded-2xl',
          className,
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 bg-white px-6 pt-6 sm:px-7 sm:pt-7">
          <div>
            <h2 id={titleId} className="font-display text-2xl leading-tight text-ink">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1.5 text-sm text-muted">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-canvas hover:text-ink"
            aria-label="Close dialog"
          >
            <X className="size-4.5" aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 sm:px-7 sm:pb-7">
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
