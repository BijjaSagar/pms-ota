import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header, Footer, Photo, Chip } from '../components/Layout.jsx';
import HeroSlider from '../components/HeroSlider.jsx';
import {
  PinIcon, CalendarIcon, UsersIcon, SearchIcon, CheckIcon, PriceIcon,
  CalendarCheckIcon, StarIcon, ArrowRight, ChevronLeft, ChevronRight, 
} from '../components/Icons.jsx';
import {
  Check as CheckLg, Copy, Headphones, Heart, Mail, Quote, ShieldCheck, Sparkles, Star,
} from 'lucide-react';
import { intents, collections, featured, flexDays, formatINR } from '../data.js';
import { hotels, getHotelBySlug } from '../lib/data/hotels.js';
import { coupons } from '../lib/data/offers.js';
import { useBooking } from '../lib/context/useBooking.js';
import { useWishlist } from '../lib/context/useWishlist.js';
import { addDays, parseISODate, toISODate, todayISO } from '../lib/utils/date.js';
import '../styles/home-extra.css';

const TABS = ['Hotels', 'Villas & homes', 'Long stays'];

// Content (copy + data) from pms-ota HomePage; layout is TriponX's own.
const REASONS = [
  { icon: Sparkles, title: 'Chosen by people, not algorithms', description: 'Every property is visited and vetted by our travel team. If it is not somewhere we would stay, it is not in the collection.' },
  { icon: ShieldCheck, title: 'The best rate, quietly guaranteed', description: 'Book direct with confidence. Find your stay for less elsewhere and we will match it, plus a credit for your next trip.' },
  { icon: Headphones, title: 'A concierge, not a call centre', description: 'Real specialists, on call before and during your trip — from airport transfers to the table everyone wants.' },
];
const STATS = [
  { value: '120+', label: 'Handpicked stays' },
  { value: '38', label: 'Countries' },
  { value: '4.9/5', label: 'Guest rating' },
  { value: '24/7', label: 'Concierge' },
];
const TESTIMONIALS = [hotels[0].reviews[0], hotels[3].reviews[0], hotels[5].reviews[0]];
const FAQS = [
  { question: 'Can I cancel or change my booking?', answer: 'Most stays offer free cancellation up to a set number of days before arrival; the exact policy is shown on every room before you book. Changes are free of charge and can be made from your confirmation email.' },
  { question: 'When will I be charged?', answer: 'This demo booking engine simulates payment at checkout. In production, the card would be authorised at the time of booking, with the balance settled according to the property\u2019s payment terms.' },
  { question: 'Are rates per room or per person?', answer: 'All rates are per room, per night, based on the occupancy shown for each room type. Taxes and fees are shown clearly in your booking summary before you pay.' },
  { question: 'Can the concierge help with special occasions?', answer: 'Absolutely. Tell us about birthdays, proposals or dietary needs in the special requests at checkout, or contact the concierge directly — they will coordinate with the property on your behalf.' },
];
const CONCIERGE_PHONE = '+1 (800) 555-0182';
const CONCIERGE_EMAIL = 'concierge@triponx.travel';

const offerText = (c) => (c.type === 'percent'
  ? `${c.value}% off selected stays up to ${c.maxDiscount ? `₹${c.maxDiscount}` : 'the listed cap'}`
  : `₹${c.value} off stays over ₹${c.minSpend}`);

export default function Home() {
  const navigate = useNavigate();
  const { search, updateSearch } = useBooking();
  const { isSaved, toggleWishlist } = useWishlist();
  const [tab, setTab] = useState(0);
  const [where, setWhere] = useState(search.destination ?? '');
  const [checkIn, setCheckIn] = useState(search.checkIn);
  const [checkOut, setCheckOut] = useState(search.checkOut);
  const [guests, setGuests] = useState(search.adults || 2);
  const [picked, setPicked] = useState({});
  const [flexDay, setFlexDay] = useState(4);
  const [copied, setCopied] = useState('');
  const [story, setStory] = useState(0);
  const [faq, setFaq] = useState(0);
  const rail = useRail();

  // One section per screen: enable scroll snapping only while the home page is shown.
  useEffect(() => {
    document.documentElement.classList.add('snap-home');
    return () => document.documentElement.classList.remove('snap-home');
  }, []);

  // Keep check-out after check-in, like the pms-ota search bar.
  const onCheckIn = (value) => {
    setCheckIn(value);
    if (value && (!checkOut || checkOut <= value)) setCheckOut(toISODate(addDays(parseISODate(value), 1)));
  };

  // Same flow as pms-ota HomePage: save the search in the booking context, then open the hotel list.
  const onSearch = (e) => {
    e.preventDefault();
    const destination = where.trim();
    const kids = search.kids ?? 0;
    const rooms = search.rooms ?? 1;
    updateSearch({ destination, checkIn, checkOut, adults: guests, kids, rooms, guests: guests + kids });
    navigate(destination ? `/hotels?destination=${encodeURIComponent(destination)}` : '/hotels');
  };

  const copyCode = async (code) => {
    try { await navigator.clipboard.writeText(code); } catch { /* clipboard blocked: the code stays visible */ }
    setCopied(code);
    window.setTimeout(() => setCopied((c) => (c === code ? '' : c)), 1800);
  };

  return (
    <>
      <Header overlay />

      {/* Hero slider + search */}
      <HeroSlider>
        <form className="search-panel glass-panel" onSubmit={onSearch}>
          <div role="tablist" aria-label="Stay type" className="tabs">
            {TABS.map((t, i) => (
              <button key={t} type="button" role="tab" aria-selected={tab === i}
                className={`tab ${tab === i ? 'is-active' : ''}`} onClick={() => setTab(i)}>{t}</button>
            ))}
          </div>

          <div className="search-fields">
            <label className="field">
              <PinIcon size={22} color="#3F6B5C" />
              <span className="field-body">
                <span className="field-label">Where</span>
                <input value={where} onChange={(e) => setWhere(e.target.value)} placeholder="City, area or property" />
              </span>
            </label>
            <label className="field">
              <CalendarIcon size={22} color="#3F6B5C" />
              <span className="field-body">
                <span className="field-label">Check-in</span>
                <input type="date" value={checkIn} min={todayISO()} onChange={(e) => onCheckIn(e.target.value)} />
              </span>
            </label>
            <label className="field">
              <CalendarIcon size={22} color="#3F6B5C" />
              <span className="field-body">
                <span className="field-label">Check-out</span>
                <input type="date" value={checkOut} min={checkIn ? toISODate(addDays(parseISODate(checkIn), 1)) : todayISO()} onChange={(e) => setCheckOut(e.target.value)} />
              </span>
            </label>
            <div className="field">
              <UsersIcon size={22} color="#3F6B5C" />
              <span className="field-body">
                <span className="field-label" id="guests-label">Guests</span>
                <span className="stepper" aria-labelledby="guests-label">
                  <button type="button" aria-label="Fewer guests" onClick={() => setGuests(Math.max(1, guests - 1))}>−</button>
                  <span className="stepper-val">{guests} adult{guests > 1 ? 's' : ''}</span>
                  <button type="button" aria-label="More guests" onClick={() => setGuests(Math.min(12, guests + 1))}>+</button>
                </span>
              </span>
            </div>
            <button type="submit" className="btn btn-primary search-submit">
              <SearchIcon size={20} width={2} /> Search stays
            </button>
          </div>

          <div className="intent-row">
            <span className="intent-label">I'm looking for</span>
            {intents.map((label, i) => (
              <Chip key={label} active={!!picked[i]} onClick={() => setPicked({ ...picked, [i]: !picked[i] })}>{label}</Chip>
            ))}
          </div>
        </form>
      </HeroSlider>

      {/* Screen 2: promises + resume */}
      <section className="screen">
        <div className="container">
          <SectionHead title="Booking, the calm way" sub="Three promises on every stay, and your last search waiting for you." />
          <div className="grid-auto-260 promise-grid">
            <PromiseCard tone="sage" icon={<PriceIcon size={22} color="#3F6B5C" />} title="One honest price"
              text="The total you see in search is the total you pay. Taxes, fees and breakfast are shown up front." />
            <PromiseCard tone="mist" icon={<CalendarCheckIcon size={22} color="#3B5D70" />} title="Cancellation, dated"
              text={'Not just "free cancellation". You see the exact date and time your refund window closes.'} />
            <PromiseCard tone="sand" icon={<StarIcon size={22} color="#8A5A33" />} title="Reviews you can trust"
              text="Only guests who completed a stay can review, scored on what matters: sleep, Wi-Fi, cleanliness, staff." />
          </div>
          <div className="resume-card">
            <div className="resume-left">
              <div className="resume-thumb" aria-hidden="true" />
              <div>
                <p className="eyebrow eyebrow-sage">Pick up where you left off</p>
                <p className="resume-title">Udaipur · 24–27 Jan · 2 adults</p>
                <p className="resume-sub">3 stays saved · prices checked today</p>
              </div>
            </div>
            <Link to="/hotels" className="btn btn-white">Resume search <ArrowRight size={16} width={2} /></Link>
          </div>
        </div>
      </section>

      {/* Offers — TriponX "passes" layout (data: pms-ota coupons) */}
      <section className="screen" id="offers">
        <div className="container tx-offers">
          <div className="tx-offers-intro">
            <p className="eyebrow eyebrow-sage">Offers</p>
            <h2 className="h2 mb-12">Save before you pack</h2>
            <p className="section-sub mb-20">Member-only savings, early-booking perks and quiet upgrades that make a beautiful stay feel even more personal.</p>
            <ol className="tx-steps">
              <li><span>1</span>Copy a code</li>
              <li><span>2</span>Pick any stay</li>
              <li><span>3</span>Apply it at checkout</li>
            </ol>
          </div>
          <div className="tx-passes">
            {coupons.map((c) => (
              <article key={c.code} className="tx-pass">
                <div className="tx-pass-value">
                  <span className="tx-pass-big">{c.type === 'percent' ? `${c.value}%` : `₹${c.value}`}</span>
                  <span className="tx-pass-off">off</span>
                </div>
                <div className="tx-pass-body">
                  <p className="tx-pass-label">{c.label}</p>
                  <p className="muted-xs">{offerText(c)}</p>
                  <p className="tx-pass-code">{c.code}</p>
                </div>
                <div className="tx-pass-actions">
                  <button type="button" className="icon-btn" onClick={() => copyCode(c.code)}
                    aria-label={copied === c.code ? `${c.code} copied` : `Copy code ${c.code}`}>
                    {copied === c.code ? <CheckLg size={16} /> : <Copy size={16} />}
                  </button>
                  <Link to="/hotels" className="btn btn-primary btn-sm">Use</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Screen 3: collections */}
      <section className="screen" id="destinations">
        <div className="container">
          <SectionHead title="Destinations for the season" sub="Hand-picked by our team, refreshed every month."
            action={<Link to="/hotels" className="link-strong">See all destinations →</Link>} />
          <div className="rail rail-collections">
            {collections.map((c) => (
              <Link key={c.title} to={c.to} className="collection-card has-img">
                <img className="collection-img" src={c.image} alt="" loading="lazy" decoding="async" />
                <span className="collection-count">{c.count}</span>
                <span>
                  <span className="collection-title">{c.title}</span>
                  <span className="collection-sub">{c.sub}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Screen 4: featured stays (scrollable rail with working prev/next) */}
      <section className="screen">
        <div className="container">
          <SectionHead title="Loved by recent guests" sub="Totals shown for 2 nights, 2 adults, all taxes included."
            action={
              <div className="row-gap-8">
                <button type="button" className="icon-btn" aria-label="Previous stays" disabled={!rail.canPrev} onClick={() => rail.scroll(-1)}><ChevronLeft size={16} width={2} /></button>
                <button type="button" className="icon-btn" aria-label="Next stays" disabled={!rail.canNext} onClick={() => rail.scroll(1)}><ChevronRight size={16} width={2} /></button>
              </div>
            } />
          <div className="rail rail-stays" ref={rail.ref}>
            {featured.map((s) => {
              const hotelId = getHotelBySlug(s.id)?.id;
              const saved = hotelId ? isSaved(hotelId) : false;
              return (
              <Link key={s.id} to={`/hotels/${s.id}`} className="stay-card">
                <Photo src={s.image} label={s.name} className="stay-photo">
                  <span className="badge-white">{s.badge}</span>
                  <button type="button" className={`photo-heart heart-toggle ${saved ? 'is-saved' : ''}`}
                    aria-label={saved ? `Remove ${s.name} from wishlist` : `Save ${s.name} to wishlist`} aria-pressed={saved}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (hotelId) toggleWishlist(hotelId); }}>
                    <Heart size={16} />
                  </button>
                </Photo>
                <span className="stay-card-head">
                  <span>
                    <span className="stay-name">{s.name}</span>
                    <span className="stay-place">{s.place}</span>
                  </span>
                  <span className="score">{s.score}</span>
                </span>
                <span className="tag-row">{s.tags.map((t) => <span key={t} className="tag">{t}</span>)}</span>
                <span className="stay-price-row">
                  <span className="price-md">{formatINR(s.total)}</span>
                  <span className="muted-sm">total · {s.cancel}</span>
                </span>
              </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Screen 5: flexible dates */}
      <section className="screen">
        <div className="container">
          <div className="card card-lg">
            <SectionHead small title="Flexible? Pick the calmest price." sub="Average total for 2 nights, by check-in date."
              action={
                <div className="legend">
                  <span><i className="sw sw-low" />Lower</span>
                  <span><i className="sw sw-typ" />Typical</span>
                  <span><i className="sw sw-high" />Higher</span>
                </div>
              } />
            <div className="flex-grid">
              {flexDays.map(([dow, date, price, level], i) => (
                <button key={date} type="button" aria-pressed={flexDay === i}
                  className={`flex-day ${flexDay === i ? 'is-active' : ''}`} onClick={() => setFlexDay(i)}>
                  <span className="flex-dow">{dow}</span>
                  <span className="flex-date">{date}</span>
                  <span className={`flex-bar lvl-${level}`} />
                  <span className="flex-price">₹{price.toFixed(1)}k</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why TriponX — statement, stats bar, numbered reasons */}
      <section className="screen" id="why-triponx">
        <div className="container">
          <div className="tx-why-head">
            <p className="eyebrow eyebrow-sage">Why TriponX</p>
            <h2 className="tx-why-title">Luxury without the performance.</h2>
            <p className="section-sub">We believe the best stays are not the loudest. They are the ones where the bed is right, the welcome is warm and someone has thought about the small things before you ask.</p>
          </div>
          <div className="tx-stats">
            {STATS.map((st) => (
              <div key={st.label} className="tx-stat">
                <p className="tx-stat-v">{st.value}</p>
                <p className="muted-xs">{st.label}</p>
              </div>
            ))}
          </div>
          <div className="tx-reasons">
            {REASONS.map(({ icon: Icon, title, description }, i) => (
              <div key={title} className="tx-reason">
                <div className="tx-reason-top">
                  <span className="tx-reason-num">0{i + 1}</span>
                  <Icon size={20} aria-hidden="true" />
                </div>
                <h3 className="h-card">{title}</h3>
                <p className="muted-sm">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Concierge — photo collage + contact desk */}
      <section className="screen" id="concierge">
        <div className="container tx-desk">
          <div className="tx-collage" aria-hidden="true">
            <img className="tx-collage-a" src={hotels[4].images[1]} alt="" loading="lazy" decoding="async" />
            <img className="tx-collage-b" src={hotels[1].images[2]} alt="" loading="lazy" decoding="async" />
          </div>
          <div>
            <p className="eyebrow eyebrow-sage">Concierge</p>
            <h2 className="h2 mb-12">Tell us how you like to travel. We will do the rest.</h2>
            <p className="section-sub mb-20">Our concierge team plans private itineraries, secures hard-to-book tables and handles the details that make a trip feel effortless.</p>
            <div className="tx-desk-list card">
              <a className="tx-desk-row" href="tel:+18005550182">
                <span className="why-icon"><Headphones size={18} aria-hidden="true" /></span>
                <span className="tx-desk-text"><span className="muted-xs">Call the concierge</span><strong>{CONCIERGE_PHONE}</strong></span>
                <ArrowRight size={16} width={2} />
              </a>
              <a className="tx-desk-row" href={`mailto:${CONCIERGE_EMAIL}`}>
                <span className="why-icon"><Mail size={18} aria-hidden="true" /></span>
                <span className="tx-desk-text"><span className="muted-xs">Write to us</span><strong>{CONCIERGE_EMAIL}</strong></span>
                <ArrowRight size={16} width={2} />
              </a>
              <div className="tx-desk-row tx-desk-hours">
                <span className="why-icon"><Sparkles size={18} aria-hidden="true" /></span>
                <span className="tx-desk-text"><span className="muted-xs">Hours</span><strong>Daily, 7:00 AM – 11:00 PM ET</strong></span>
              </div>
            </div>
            <Link to="/hotels" className="link-strong tx-desk-browse">Browse the collection →</Link>
          </div>
        </div>
      </section>

      {/* Guest stories — one featured quote, switch between guests */}
      <section className="screen">
        <div className="container tx-stories">
          <figure className="card tx-quote">
            <Quote size={28} className="story-quote" aria-hidden="true" />
            <blockquote className="tx-quote-text">“{TESTIMONIALS[story].body}”</blockquote>
            <figcaption className="tx-quote-by">
              <span className="story-stars" aria-label={`${TESTIMONIALS[story].rating} out of 5`}>
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} aria-hidden="true" />)}
              </span>
              <strong>{TESTIMONIALS[story].name}</strong>
              <span className="muted-xs">{TESTIMONIALS[story].country} · {TESTIMONIALS[story].stayType}</span>
            </figcaption>
          </figure>
          <div className="tx-story-side">
            <p className="eyebrow eyebrow-sage">Guest stories</p>
            <h2 className="h2 mb-12">The reviews that stay with us</h2>
            <p className="section-sub mb-20">A few words from travellers who have just come home.</p>
            <div className="tx-story-list" role="tablist" aria-label="Guest stories">
              {TESTIMONIALS.map((r, i) => (
                <button key={`${r.id}-${r.name}`} type="button" role="tab" aria-selected={story === i}
                  className={`tx-story-pick ${story === i ? 'is-active' : ''}`} onClick={() => setStory(i)}>
                  <span className="tx-initials">{r.initials}</span>
                  <span className="tx-story-pick-text"><strong>{r.name}</strong><span className="muted-xs">{r.title}</span></span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Help & Support — question list + answer panel (inline answers on phones) */}
      <section className="screen" id="help-support">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow eyebrow-sage">Help &amp; Support</p>
              <h2 className="h2">Questions, answered</h2>
            </div>
            <a href="tel:+18005550182" className="link-strong">Call {CONCIERGE_PHONE} →</a>
          </div>
          <div className="tx-help">
            <div className="tx-help-list" role="tablist" aria-label="Questions" aria-orientation="vertical">
              {FAQS.map((f, i) => (
                <div key={f.question} className="tx-help-item">
                  <button type="button" role="tab" id={`faq-tab-${i}`} aria-selected={faq === i} aria-controls="faq-panel"
                    className={`tx-help-q ${faq === i ? 'is-active' : ''}`} onClick={() => setFaq(i)}>
                    <span className="tx-help-n">{i + 1}</span>{f.question}
                  </button>
                  {faq === i && <p className="tx-help-inline muted-sm">{f.answer}</p>}
                </div>
              ))}
            </div>
            <div className="card tx-help-panel" role="tabpanel" id="faq-panel" aria-labelledby={`faq-tab-${faq}`}>
              <p className="tx-help-panel-q">{FAQS[faq].question}</p>
              <p className="tx-help-panel-a">{FAQS[faq].answer}</p>
              <div className="tx-help-more">
                <p className="muted-sm">Still unsure? The concierge is one message away.</p>
                <div className="row-gap-8 wrap">
                  <a href="tel:+18005550182" className="btn btn-outline btn-sm"><Headphones size={14} />Call</a>
                  <a href={`mailto:${CONCIERGE_EMAIL}`} className="btn btn-outline btn-sm"><Mail size={14} />Email</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Screen 6: membership + footer */}
      <section className="screen screen-last">
        <div className="container screen-grow">
          <div className="member-band">
            <div className="member-copy">
              <p className="eyebrow eyebrow-light">TriponX Circle</p>
              <h2 className="member-title">Member rates, early check-in and a real person on call.</h2>
              <p className="member-sub">Free to join. No points maths: perks are listed on every room you can book.</p>
            </div>
            <div className="row-gap-12 wrap">
              <a href="#" className="btn btn-light">Join for free</a>
              <a href="#" className="btn btn-ghost-light">How it works</a>
            </div>
          </div>
        </div>
        <Footer />
      </section>
    </>
  );
}

// Horizontal card rail with prev/next that know when they can move.
function useRail() {
  const ref = useRef(null);
  const [edges, setEdges] = useState({ canPrev: false, canNext: false });
  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({ canPrev: el.scrollLeft > 4, canNext: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { el.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, [update]);
  const scroll = (dir) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' });
  };
  return { ref, scroll, ...edges };
}

function PromiseCard({ tone, icon, title, text }) {
  return (
    <div className="promise card">
      <div className={`promise-icon tone-${tone}`}>{icon}</div>
      <div>
        <h3 className="h-card">{title}</h3>
        <p className="body-muted">{text}</p>
      </div>
    </div>
  );
}

export function SectionHead({ title, sub, action, small }) {
  return (
    <div className="section-head">
      <div>
        <h2 className={small ? 'h2-sm' : 'h2'}>{title}</h2>
        {sub && <p className="section-sub">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
