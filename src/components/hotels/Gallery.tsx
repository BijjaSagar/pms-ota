import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { cn } from '../../utils/cn'

interface GalleryProps {
  images: string[]
  name: string
}

export function Gallery({ images, name }: GalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const isOpen = activeIndex !== null

  const close = useCallback(() => setActiveIndex(null), [])
  const next = useCallback(() => {
    setActiveIndex((current) => (current === null ? null : (current + 1) % images.length))
  }, [images.length])
  const previous = useCallback(() => {
    setActiveIndex((current) =>
      current === null ? null : (current - 1 + images.length) % images.length,
    )
  }, [images.length])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowRight') next()
      if (event.key === 'ArrowLeft') previous()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, close, next, previous])

  if (images.length === 0) return null

  const gridImages = images.slice(0, 5)
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-4 sm:grid-rows-2">
        <button
          type="button"
          onClick={() => setActiveIndex(0)}
          className="group relative overflow-hidden rounded-2xl sm:col-span-2 sm:row-span-2"
          aria-label={`Open photo 1 of ${images.length}`}
        >
          <img
            src={gridImages[0]}
            alt={`${name} — main view`}
            className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03] sm:aspect-auto sm:h-full"
          />
          <span className="absolute bottom-3 left-3 hidden items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-ink backdrop-blur sm:inline-flex">
            <Expand className="size-3.5" aria-hidden="true" />
            View all photos
          </span>
        </button>

        {gridImages.slice(1).map((image, index) => (
          <button
            key={image}
            type="button"
            onClick={() => setActiveIndex(index + 1)}
            className={cn('group relative overflow-hidden rounded-2xl', index > 2 && 'hidden sm:block')}
            aria-label={`Open photo ${index + 2} of ${images.length}`}
          >
            <img
              src={image}
              alt={`${name} — view ${index + 2}`}
              loading="lazy"
              className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] sm:h-full"
            />
          </button>
        ))}
      </div>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[100] flex animate-fade-in items-center justify-center bg-brand/95 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${name} photo gallery`}
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-5 top-5 flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close gallery"
          >
            <X className="size-5" />
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              previous()
            }}
            className="absolute left-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-6"
            aria-label="Previous photo"
          >
            <ChevronLeft className="size-5" />
          </button>

          <figure
            className="max-h-[85vh] max-w-6xl animate-scale-in"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={images[activeIndex ?? 0]}
              alt={`${name} — photo ${(activeIndex ?? 0) + 1}`}
              className="max-h-[78vh] w-auto rounded-xl object-contain"
            />
            <figcaption className="mt-4 text-center text-xs font-medium tracking-[0.16em] text-white/70">
              {(activeIndex ?? 0) + 1} / {images.length}
            </figcaption>
          </figure>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              next()
            }}
            className="absolute right-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-6"
            aria-label="Next photo"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      ) : null}
    </>
  )
}
