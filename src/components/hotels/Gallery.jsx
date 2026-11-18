// Hotel photos in the TriponX layout: 1 large + 4 small tiles with "All N photos",
// or every photo (`variant="all"`, photos page). Any photo opens a keyboard-friendly lightbox
// (feature from pms-ota's Gallery).
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import '../../styles/hotel-details.css';

export function Gallery({ images, name, photosLink, variant = 'grid' }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const isOpen = activeIndex !== null;

  const close = useCallback(() => setActiveIndex(null), []);
  const next = useCallback(() => {
    setActiveIndex((current) => (current === null ? null : (current + 1) % images.length));
  }, [images.length]);
  const previous = useCallback(() => {
    setActiveIndex((current) => (current === null ? null : (current - 1 + images.length) % images.length));
  }, [images.length]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (event) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight') next();
      if (event.key === 'ArrowLeft') previous();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, close, next, previous]);

  if (images.length === 0) return null;

  const shown = variant === 'all' ? images : images.slice(0, 5);
  const last = shown.length - 1;

  return (
    <>
      <div className={variant === 'all' ? 'hd-gallery-all' : 'gallery'}>
        {shown.map((src, i) => (
          <div key={src} className={`photo has-img hd-tile ${variant !== 'all' && i === 0 ? 'gallery-main' : ''}`}>
            <button type="button" className="hd-tile-btn" onClick={() => setActiveIndex(i)}
              aria-label={`Open photo ${i + 1} of ${images.length}`}>
              <img className="photo-img" src={src} alt={`${name} — photo ${i + 1}`}
                loading={i === 0 ? 'eager' : 'lazy'} decoding="async" />
            </button>
            {variant !== 'all' && i === last && photosLink && (
              <Link to={photosLink} className="gallery-all">All {images.length} photos</Link>
            )}
          </div>
        ))}
      </div>

      {isOpen && (
        <div className="hd-lightbox" role="dialog" aria-modal="true" aria-label={`${name} photo gallery`} onClick={close}>
          <button type="button" onClick={close} className="hd-lb-btn hd-lb-close" aria-label="Close gallery"><X size={20} /></button>
          <button type="button" onClick={(e) => { e.stopPropagation(); previous(); }} className="hd-lb-btn hd-lb-prev" aria-label="Previous photo">
            <ChevronLeft size={20} />
          </button>
          <figure className="hd-lb-figure" onClick={(e) => e.stopPropagation()}>
            <img src={images[activeIndex ?? 0]} alt={`${name} — photo ${(activeIndex ?? 0) + 1}`} />
            <figcaption>{(activeIndex ?? 0) + 1} / {images.length}</figcaption>
          </figure>
          <button type="button" onClick={(e) => { e.stopPropagation(); next(); }} className="hd-lb-btn hd-lb-next" aria-label="Next photo">
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </>
  );
}
