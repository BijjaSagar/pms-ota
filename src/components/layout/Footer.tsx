import { ArrowRight, Briefcase, Camera, Send } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from './Logo'

const currentYear = new Date().getFullYear()

const columns = [
  {
    title: 'Explore',
    links: [
      { label: 'Santorini', to: '/hotels?destination=Santorini' },
      { label: 'Kyoto', to: '/hotels?destination=Kyoto' },
      { label: 'Amalfi Coast', to: '/hotels?destination=Amalfi%20Coast' },
      { label: 'Bali', to: '/hotels?destination=Bali' },
      { label: 'Maldives', to: '/hotels?destination=Maldives' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Our story', to: '/#why-aurelia' },
      { label: 'Journal', to: '/#destinations' },
      { label: 'Careers', to: '/#why-aurelia' },
      { label: 'Press', to: '/#concierge' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Contact concierge', to: '/#concierge' },
      { label: 'Booking help', to: '/#faq' },
      { label: 'Cancellation policy', to: '/#faq' },
      { label: 'Accessibility', to: '/#faq' },
    ],
  },
]

export function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim()) return
    setSubscribed(true)
    setEmail('')
  }

  return (
    <footer className="no-print bg-brand text-white">
      <div className="container-page py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Logo light />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/65">
              A curated collection of exceptional hotels, private villas and once-in-a-lifetime stays — chosen
              one by one, for travellers who care about the details.
            </p>
            <div className="mt-8">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-white/50">
                The Aurelia letter
              </p>
              <p className="mt-2 text-sm text-white/70">New openings and quiet escapes, once a month.</p>
              {subscribed ? (
                <p className="mt-4 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white">
                  You're on the list. Watch your inbox.
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="mt-4 flex max-w-sm items-center gap-2">
                  <label htmlFor="newsletter-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="newsletter-email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Your email address"
                    className="h-12 w-full rounded-full border border-white/20 bg-white/5 px-5 text-sm text-white placeholder:text-white/40 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                  <button
                    type="submit"
                    className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-brand transition hover:bg-white/90"
                    aria-label="Subscribe to newsletter"
                  >
                    <ArrowRight className="size-4" />
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <div key={column.title}>
                <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-white/50">
                  {column.title}
                </h3>
                <ul className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="text-sm text-white/75 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-white/15 pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-white/45">
            © {currentYear} Aurelia Travel Group. All rights reserved. This is a demo booking
            experience.
          </p>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3 text-white/55">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-white">
                <Camera className="size-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter" className="hover:text-white">
                <Send className="size-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="hover:text-white">
                <Briefcase className="size-4" />
              </a>
            </div>
            <div className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white/40">
              <span>Visa</span>
              <span className="size-1 rounded-full bg-white/30" />
              <span>Mastercard</span>
              <span className="size-1 rounded-full bg-white/30" />
              <span>Amex</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
