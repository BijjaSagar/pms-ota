// Partner Hub — "List your property". Standalone page (own top bar, opened in a new tab from the navbar).
// Signed out: promo panel + PartnerAuthCard (email + password, then an OTP popup).
// Signed in (or the moment sign-in / sign-up completes): go straight to Your properties.
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  BarChart3, BadgePercent, Check, ChevronDown, Globe2, RefreshCw, ShieldCheck, Wallet,
} from 'lucide-react';
import { PartnerAuthCard } from '../components/partner/PartnerAuthCard.jsx';
import { PARTNER_SUPPORT_EMAIL, PartnerTopBar } from '../components/partner/PartnerTopBar.jsx';
import { PARTNER_PATHS } from '../components/partner/paths.js';
import { PartnerCredit } from '../components/partner/PartnerCredit.jsx';
import { useAuth } from '../lib/context/useAuth.js';
import { getHotelBySlug, hotels } from '../lib/data/hotels.js';
import { PARTNER_FAQS, PARTNER_STATS } from '../lib/data/partner.js';
import { AuthLoading } from '../components/auth/RequireAuth.jsx';
import '../styles/account.css';
import '../styles/partner.css';

const PROMO_POINTS = [
  'Free to list — commission only on completed stays',
  'Two-way sync with your PMS and channel manager',
  'Weekly payouts with clear statements',
];

const BENEFITS = [
  { Icon: Globe2, title: 'Reach guests who book', text: 'Get in front of travellers already searching your city — on web and mobile, in their currency.' },
  { Icon: BadgePercent, title: 'Pay only for stays', text: 'No sign-up or monthly fee. Commission applies only to completed stays.' },
  { Icon: RefreshCw, title: 'Works with your PMS', text: 'Two-way sync of rates and availability, so you never risk an overbooking.' },
  { Icon: Wallet, title: 'Weekly payouts', text: 'Money for checked-out stays lands in your bank every week, with clear statements.' },
  { Icon: BarChart3, title: 'Insights that help', text: 'See demand, pace and competitor pricing for your area in one dashboard.' },
  { Icon: ShieldCheck, title: 'Protected bookings', text: 'Verified guests, secure payments and support for you and your guests, 24/7.' },
];

export default function ListPropertyPage() {
  const { isAuthenticated, authReady } = useAuth();
  const [openFaq, setOpenFaq] = useState(0);

  // A villa photo suits owners better than a city street; fall back to any hotel image.
  const heroImage = (getHotelBySlug('casa-azul-goa') ?? hotels[0])?.images?.[0];

  useEffect(() => {
    const prev = document.title;
    document.title = 'Partner Hub · List your property — TriponX';
    return () => { document.title = prev; };
  }, []);

  // Signed in to the Partner Hub (here or in another partner tab) -> Your properties. `replace` keeps Back from bouncing here.
  if (!authReady) return <div className="lp-shell"><AuthLoading /></div>;
  if (isAuthenticated) return <Navigate to={PARTNER_PATHS.properties} replace />;

  return (
    <div className="lp-shell">
      <PartnerTopBar />

      {/* Split: promo + sign-in card */}
      <section className="lp-split">
        <div className="lp-promo" style={heroImage ? { '--lp-photo': `url("${heroImage}")` } : undefined}>
          <div className="lp-promo-inner">
            <span className="lp-promo-kicker">For hotels, villas &amp; homestays</span>
            <h1 className="lp-promo-title">Grow your business with TriponX</h1>
            <p className="lp-promo-sub">Put your property in front of travellers who are ready to book — and stay in control of rates, rooms and rules.</p>
            <ul className="lp-promo-points">
              {PROMO_POINTS.map((p) => <li key={p}><Check size={16} aria-hidden="true" />{p}</li>)}
            </ul>
            <dl className="lp-promo-stats">
              {PARTNER_STATS.map((s) => <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}
            </dl>
          </div>
        </div>

        <div className="lp-panel-wrap">
          <div className="lp-panel">
            <PartnerAuthCard />
            <p className="muted-xs lp-terms">By continuing you agree to the TriponX partner terms and privacy policy.</p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container lp-section" aria-labelledby="lp-why">
        <h2 id="lp-why" className="h2">Why partners choose TriponX</h2>
        <div className="lp-benefits">
          {BENEFITS.map(({ Icon, title, text }) => (
            <article key={title} className="card lp-benefit">
              <span className="lp-benefit-icon"><Icon size={20} aria-hidden="true" /></span>
              <h3 className="h-card">{title}</h3>
              <p className="muted-sm">{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container lp-section" aria-labelledby="lp-faq">
        <h2 id="lp-faq" className="h2">Questions from owners</h2>
        <div className="lp-faq">
          {PARTNER_FAQS.map((f, i) => {
            const open = openFaq === i;
            return (
              <div key={f.q} className={`card lp-faq-item ${open ? 'is-open' : ''}`}>
                <button type="button" aria-expanded={open} aria-controls={`lp-faq-${i}`} onClick={() => setOpenFaq(open ? -1 : i)}>
                  <span>{f.q}</span><ChevronDown size={18} aria-hidden="true" />
                </button>
                {open && <p id={`lp-faq-${i}`} className="muted-sm">{f.a}</p>}
              </div>
            );
          })}
        </div>
      </section>

      <footer className="lp-footer">
        <div className="container lp-footer-inner">
          <span>© {new Date().getFullYear()} TriponX Partner Hub</span>
          <a href={`mailto:${PARTNER_SUPPORT_EMAIL}`}>{PARTNER_SUPPORT_EMAIL}</a>
        </div>
        <div className="container"><PartnerCredit /></div>
      </footer>
    </div>
  );
}
