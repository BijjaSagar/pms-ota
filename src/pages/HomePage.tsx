import {
  ArrowRight,
  ChevronDown,
  Headphones,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { SearchBar } from '../components/hotels/SearchBar'
import { HotelCard } from '../components/hotels/HotelCard'
import { SectionHeading } from '../components/ui/SectionHeading'
import { buttonStyles } from '../components/ui/buttonStyles'
import { useBooking } from '../context/useBooking'
import { destinations, hotels } from '../data/hotels'
import { coupons } from '../data/offers'
import type { SearchParams } from '../types'

const featuredHotels = hotels.filter((hotel) => hotel.featured).slice(0, 3)

const reasons = [
  {
    icon: Sparkles,
    title: 'Chosen by people, not algorithms',
    description:
      'Every property is visited and vetted by our travel team. If it is not somewhere we would stay, it is not in the collection.',
  },
  {
    icon: ShieldCheck,
    title: 'The best rate, quietly guaranteed',
    description:
      'Book direct with confidence. Find your stay for less elsewhere and we will match it, plus a credit for your next trip.',
  },
  {
    icon: Headphones,
    title: 'A concierge, not a call centre',
    description:
      'Real specialists, on call before and during your trip — from airport transfers to the table everyone wants.',
  },
]

const stats = [
  { value: '120+', label: 'Handpicked stays' },
  { value: '38', label: 'Countries' },
  { value: '4.9/5', label: 'Guest rating' },
  { value: '24/7', label: 'Concierge' },
]

const testimonials = [
  hotels[0].reviews[0],
  hotels[3].reviews[0],
  hotels[5].reviews[0],
]

const offerImages = [hotels[0].images[1], hotels[2].images[2], hotels[4].images[0]]

const faqs = [
  {
    question: 'Can I cancel or change my booking?',
    answer:
      'Most stays offer free cancellation up to a set number of days before arrival; the exact policy is shown on every room before you book. Changes are free of charge and can be made from your confirmation email.',
  },
  {
    question: 'When will I be charged?',
    answer:
      'This demo booking engine simulates payment at checkout. In production, the card would be authorised at the time of booking, with the balance settled according to the property’s payment terms.',
  },
  {
    question: 'Are rates per room or per person?',
    answer:
      'All rates are per room, per night, based on the occupancy shown for each room type. Taxes and fees are shown clearly in your booking summary before you pay.',
  },
  {
    question: 'Can the concierge help with special occasions?',
    answer:
      'Absolutely. Tell us about birthdays, proposals or dietary needs in the special requests at checkout, or contact the concierge directly — they will coordinate with the property on your behalf.',
  },
]

export function HomePage() {
  const navigate = useNavigate()
  const { search, updateSearch } = useBooking()

  const handleSearch = (params: SearchParams) => {
    updateSearch(params)
    const query = new URLSearchParams({
      destination: params.destination,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      guests: String(params.guests),
      rooms: String(params.rooms),
      adults: String(params.adults),
      kids: String(params.kids),
    })
    navigate(`/hotels?${query.toString()}`)
  }

  return (
    <>
      <section
        className="relative overflow-hidden bg-brand pb-16 pt-10 sm:pt-14 lg:pb-24 lg:pt-16"
        style={{
          backgroundImage: `url(${hotels[0].images[1]})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        <div className="absolute inset-0 bg-brand/75" aria-hidden="true" />
        <div className="container-page relative">
          <div className="max-w-none">
            <div className="animate-fade-up">
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-white/70" />
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-white/80">
                  The Aurelia collection
                </p>
              </div>
              <h1 className="mt-[18px] mb-[18px] max-w-3xl font-sans text-[3.4rem] font-medium leading-[1.02] tracking-[-1.8px] text-white sm:text-6xl lg:text-[64px]">
                Stays worth
                <span className="block not-italic text-[#79D8CF]">travelling for.</span>
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">
                A quiet collection of exceptional hotels, private villas and once-in-a-lifetime
                retreats — chosen one by one, for travellers who notice the details.
              </p>

              <div className="mt-8">
                <Link to="/hotels" className={buttonStyles('primary', 'lg')}>
                  Explore stays
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <div className="mt-7 w-full">
                  <SearchBar initial={search} onSearch={handleSearch} />
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {['EM', 'JL', 'AR'].map((initials, index) => (
                      <span
                        key={initials}
                        className="flex size-9 items-center justify-center rounded-full border-2 border-white/80 bg-brand text-[0.6rem] font-semibold text-white"
                        style={{ backgroundColor: ['#0e2b3b', '#8a6b3f', '#3f5d52'][index] }}
                      >
                        {initials}
                      </span>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} className="size-3 fill-accent text-accent" aria-hidden="true" />
                      ))}
                    </div>
                    <p className="mt-0.5 text-xs text-white/70">Loved by 12,400+ travellers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="offers" className="container-page scroll-mt-24 py-16 lg:py-20">
        <SectionHeading
          eyebrow="Offers"
          title="A few reasons it is worth planning a little earlier"
          description="Member-only savings, early-booking perks and quiet upgrades that make a beautiful stay feel even more personal."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {coupons.map((coupon, index) => (
            <div
              key={coupon.code}
              className="overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-[0_18px_40px_-28px_rgba(14,43,59,0.35)]"
            >
              <div
                className="relative h-32 overflow-hidden"
                style={{
                  backgroundImage: `url(${offerImages[index]})`,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f2d3b]/75 via-[#0f2d3b]/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4">
                  <span className="inline-flex rounded-full border border-white/45 bg-white/15 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.22em] text-white backdrop-blur-sm">
                    {coupon.code}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-display text-[2rem] leading-none text-ink">{coupon.label}</h3>
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  {coupon.type === 'percent'
                    ? `${coupon.value}% off selected stays up to ${coupon.maxDiscount ? `₹${coupon.maxDiscount}` : 'the listed cap'}`
                    : `₹${coupon.value} off stays over ₹${coupon.minSpend}`}
                </p>
                <Link
                  to="/hotels"
                  className="mt-6 inline-flex items-center gap-[7px] text-[13px] font-bold text-[#0d9f91] transition-colors hover:text-[#0b887d]"
                >
                  Book this offer
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="destinations" className="container-page scroll-mt-24 py-16 lg:py-20">
        <SectionHeading
          eyebrow="Where to next"
          title="Destinations with a sense of place"
          description="From caldera cliffs to quiet temple gardens — a short list of the places our travellers return to, season after season."
          action={
            <Link
              to="/hotels"
              className="inline-flex items-center gap-[7px] text-[13px] font-bold text-[#0d9f91] transition-colors hover:text-[#0b887d]"
            >
              Explore all destinations
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          }
        />

        <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((destination, index) => (
            <Link
              key={destination.slug}
              to={`/hotels?destination=${encodeURIComponent(destination.city)}`}
              className="group relative overflow-hidden rounded-2xl animate-fade-up"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <img
                src={destination.image}
                alt={`${destination.city}, ${destination.country}`}
                loading="lazy"
                className="aspect-square w-full object-cover transition-transform duration-[900ms] group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand/85 via-brand/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-white/65">
                  {destination.country}
                </p>
                <h3 className="mt-1 font-display text-2xl text-white">{destination.city}</h3>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-white/75">
                    {destination.tagline} · {destination.hotels} stays
                  </p>
                  <span className="flex size-8 items-center justify-center rounded-full bg-white/15 text-white opacity-0 transition-all duration-300 group-hover:opacity-100">
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white py-16 lg:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="The collection"
            title="Stays our travellers love"
            description="A handful of properties that define what we look for: character, craft and a genuine sense of welcome."
            action={
              <Link to="/hotels" className={`${buttonStyles('secondary', 'md')} text-accent`}>
                View all stays
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            }
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredHotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} className="animate-fade-up" />
            ))}
          </div>
        </div>
      </section>

      <section id="why-aurelia" className="container-page scroll-mt-24 py-16 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="relative">
            <div className="overflow-hidden rounded-[2rem]">
              <img
                src={hotels[2].images[2]}
                alt="The Amalfi coastline at dusk"
                loading="lazy"
                className="aspect-[4/4.4] w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-3 max-w-[13rem] rounded-2xl border border-line bg-white p-5 shadow-[0_24px_60px_-30px_rgba(14,43,59,0.4)] sm:-right-6">
              <p className="font-numeric text-3xl text-ink">24/7</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                A real concierge, from first idea to the drive home.
              </p>
            </div>
          </div>

          <div>
            <SectionHeading
              eyebrow="Why Aurelia"
              title="Luxury without the performance"
              description="We believe the best stays are not the loudest. They are the ones where the bed is right, the welcome is warm and someone has thought about the small things before you ask."
            />
            <div className="mt-8 space-y-6">
              {reasons.map((reason) => (
                <div key={reason.title} className="flex gap-4">
                  <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                    <reason.icon className="size-4.5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{reason.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{reason.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 grid grid-cols-2 gap-6 border-t border-line pt-8 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="font-numeric text-2xl text-ink sm:text-3xl">{stat.value}</p>
                  <p className="mt-1 text-[0.65rem] uppercase tracking-[0.14em] text-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="concierge" className="container-page scroll-mt-24 py-8 lg:py-12">
        <div className="relative overflow-hidden rounded-[2rem] bg-brand">
          <img
            src={hotels[4].images[1]}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand via-brand/90 to-brand/40" />
          <div className="relative grid gap-10 px-6 py-12 sm:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:px-16 lg:py-16">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-white/55">
                A little help, if you would like it
              </p>
              <h2 className="mt-4 max-w-xl font-display text-3xl leading-[1.08] text-white sm:text-4xl lg:text-[2.9rem]">
                Tell us how you like to travel. We will do the rest.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
                Our concierge team plans private itineraries, secures hard-to-book tables and handles
                the details that make a trip feel effortless.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="mailto:concierge@aurelia.travel"
                  className={buttonStyles('accent', 'md')}
                >
                  Speak to a specialist
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
                <Link to="/hotels" className={buttonStyles('outline-inverse', 'md')}>
                  Browse the collection
                </Link>
              </div>
            </div>
            <div className="grid gap-3">
              {[
                { label: 'Call the concierge', value: '+1 (800) 555-0182', icon: Headphones },
                { label: 'Write to us', value: 'concierge@aurelia.travel', icon: Sparkles },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                    <item.icon className="size-4.5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[0.6rem] uppercase tracking-[0.16em] text-white/50">{item.label}</p>
                    <p className="mt-0.5 text-sm font-medium text-white">{item.value}</p>
                  </div>
                </div>
              ))}
              <p className="px-1 text-xs text-white/50">Available daily, 7:00 AM – 11:00 PM ET.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Guest stories"
            title="The reviews that stay with us"
            align="center"
            description="A few words from travellers who have just come home."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {testimonials.map((review) => (
              <figure key={review.id} className="relative rounded-2xl border border-line bg-canvas p-6">
                <Quote className="size-6 text-accent/50" aria-hidden="true" />
                <div className="mt-4 flex items-center gap-0.5" aria-label={`${review.rating} out of 5`}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="size-3.5 fill-accent text-accent" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="mt-3 text-sm leading-relaxed text-ink">
                  “{review.body}”
                </blockquote>
                <figcaption className="mt-5 border-t border-line pt-4">
                  <p className="text-sm font-semibold text-ink">{review.name}</p>
                  <p className="text-xs text-muted">
                    {review.country} · {review.stayType}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="container-page scroll-mt-24 py-16 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <SectionHeading eyebrow="Good to know" title="Questions, answered" />
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Still unsure about something? The concierge is one message away, or call us on{' '}
              <a href="tel:+18005550182" className="font-medium text-ink underline decoration-line underline-offset-4">
                +1 (800) 555-0182
              </a>
              .
            </p>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-ink">
                  {faq.question}
                  <ChevronDown
                    className="size-4 shrink-0 text-muted transition-transform duration-300 group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
