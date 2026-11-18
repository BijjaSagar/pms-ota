import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from './Icons.jsx';

const SLIDE_MS = 2500;

// Images come from Unsplash; each slide also has a gradient so it still looks
// right if an image fails to load. Swap `image` for your own photos any time.
const SLIDES = [
  {
    eyebrow: 'Kerala · Hill stays',
    title: 'Wake up above the clouds.',
    text: 'Tea-estate cottages in Munnar with misty mornings and a total price you can trust.',
    cta: 'Explore Munnar',
    to: '/search?where=Munnar',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1800&q=70',
    tint: 'linear-gradient(135deg, #2F5447 0%, #6E9A84 55%, #C9DCCF 100%)',
  },
  {
    eyebrow: 'Rajasthan · Heritage',
    title: 'Palace evenings, honest prices.',
    text: 'Lake-view havelis in Udaipur. Taxes and breakfast shown up front, every time.',
    cta: 'See Udaipur stays',
    to: '/search?where=Udaipur',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1800&q=70',
    tint: 'linear-gradient(135deg, #6B3E22 0%, #B9844F 55%, #F0DCC0 100%)',
  },
  {
    eyebrow: 'Goa · Villas & homes',
    title: 'A pool that’s only yours.',
    text: 'Private villas a short walk from the beach. Cancellation dates, not vague promises.',
    cta: 'Browse villas',
    to: '/search?type=villas',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1800&q=70',
    tint: 'linear-gradient(135deg, #1F4A5A 0%, #4F8EA3 55%, #CFE5EC 100%)',
  },
  {
    eyebrow: 'Long stays · Work from anywhere',
    title: 'Stay a month. Feel at home.',
    text: 'Fast Wi-Fi, real desks and weekly rates for slow travel and quiet workcations.',
    cta: 'Find long stays',
    to: '/search?type=long',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1800&q=70',
    tint: 'linear-gradient(135deg, #3B3A5C 0%, #7C7BA6 55%, #E1E0EE 100%)',
  },
];

// `children` (the search panel) is docked over the bottom of the slider.
export default function HeroSlider({ children }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true); // false only for reduced-motion users
  const [hovered, setHovered] = useState(false);
  const [focusInDock, setFocusInDock] = useState(false);
  const [dockH, setDockH] = useState(0);
  const touchX = useRef(null);
  const dockRef = useRef(null);
  const count = SLIDES.length;

  const go = useCallback((i) => setIndex(((i % count) + count) % count), [count]);
  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  // Respect reduced-motion: start paused.
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) setPlaying(false);
  }, []);

  // Measure the docked panel so the slide text always sits above it.
  // On phones the panel is static (below the photo), so it reserves no space.
  useEffect(() => {
    const el = dockRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => {
      const docked = getComputedStyle(el).position === 'absolute';
      setDockH(docked ? el.offsetHeight : 0);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    measure();
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  // Pause while hovering, or while the user is typing in the search panel.
  const running = playing && !hovered && !focusInDock;
  useEffect(() => {
    if (!running) return undefined;
    const t = setTimeout(next, SLIDE_MS);
    return () => clearTimeout(t);
  }, [running, next, index]);

  const inDock = (target) => dockRef.current?.contains(target);
  const onKey = (e) => {
    if (inDock(e.target)) return; // arrow keys in inputs must not change slides
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  };
  const onTouchStart = (e) => { touchX.current = inDock(e.target) ? null : e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
    touchX.current = null;
  };

  return (
    <section
      className="hero-slider"
      style={{ '--dock-h': `${dockH}px` }}
      aria-roledescription="carousel"
      aria-label="Featured destinations"
      tabIndex={0}
      onKeyDown={onKey}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {SLIDES.map((s, i) => (
        <div
          key={s.title}
          className={`slide ${i === index ? 'is-active' : ''}`}
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} of ${count}`}
          aria-hidden={i !== index}
          style={{ backgroundImage: `url(${s.image}), ${s.tint}` }}
        >
          <div className="slide-shade" />
          <div className="slide-copy">
            <span className="glass-pill">{s.eyebrow}</span>
            <h2 className="slide-title">{s.title}</h2>
            <p className="slide-text">{s.text}</p>
            <Link to={s.to} className="btn glass-btn" tabIndex={i === index ? 0 : -1}>
              {s.cta} <ArrowRight size={16} width={2} />
            </Link>
          </div>
        </div>
      ))}


      {children && (
        <div
          ref={dockRef}
          className="hero-dock"
          onFocus={() => setFocusInDock(true)}
          onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocusInDock(false); }}
        >
          <div className="container">{children}</div>
        </div>
      )}
    </section>
  );
}
