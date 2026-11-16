import { ChevronDown, CreditCard, Heart, Menu, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useWishlist } from '../../context/useWishlist'
import { cn } from '../../utils/cn'
import { buttonStyles } from '../ui/buttonStyles'
import { Logo } from './Logo'

const links = [
  { label: 'Home', to: '/' },
  { label: 'Hotels', to: '/hotels' },
  { label: 'Offers', to: '/#offers' },
  { label: 'Help & Support', to: '/#help-support' },
]

const countryCodes = `
AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ
CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ
NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW
`.trim().split(/\s+/)

const countryNames = new Intl.DisplayNames(['en'], { type: 'region' })
const countries = countryCodes
  .map((code) => ({ code, name: countryNames.of(code) }))
  .filter((country): country is { code: string; name: string } => Boolean(country.name))
  .sort((a, b) => a.name.localeCompare(b.name))

function getFlag(code: string) {
  return code
    .toUpperCase()
    .replace(/[A-Z]/g, (letter) => String.fromCodePoint(letter.charCodeAt(0) + 127397))
}

function LocaleSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: [string, string][]
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium text-muted">{label}</span>
      <span className="relative flex h-[51px] items-center rounded-lg border border-line transition focus-within:border-[#0d9f91]">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-full w-full appearance-none bg-transparent px-4 pr-10 text-sm font-medium text-ink outline-none"
        >
          {options.map(([optionCode, name]) => (
            <option key={optionCode} value={optionCode}>
              {name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 size-4 text-muted" aria-hidden="true" />
      </span>
    </label>
  )
}

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [localeOpen, setLocaleOpen] = useState(false)
  const [country, setCountry] = useState('IN')
  const [currency, setCurrency] = useState('INR')
  const [language, setLanguage] = useState('en')
  const { count: wishlistCount } = useWishlist()

  const accountLinks = [
    { label: 'My profile', to: '/profile', icon: UserRound },
    { label: 'Wishlist', to: '/wishlist', icon: Heart },
    { label: 'My trips', to: '/trips', icon: UserRound },
    { label: 'Make a payment', to: '/make-a-payment', icon: CreditCard },
  ]

  return (
    <header className="no-print sticky top-0 z-50 border-b border-line/80 bg-canvas/85 backdrop-blur-xl">
      <div className="container-page flex h-[4.75rem] items-center justify-between gap-6">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {links.map((link) =>
            link.to.includes('#') ? (
              <Link
                key={link.label}
                to={link.to}
                className="rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-brand-soft hover:text-ink"
              >
                {link.label}
              </Link>
            ) : (
              <NavLink
                key={link.label}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-brand-soft hover:text-ink',
                    isActive ? 'text-ink' : 'text-muted',
                  )
                }
              >
                {link.label}
              </NavLink>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/wishlist"
            aria-label={`Wishlist${wishlistCount > 0 ? `, ${wishlistCount} saved` : ''}`}
            className="relative inline-flex size-10 items-center justify-center rounded-full border border-line text-muted transition hover:border-[#0d9f91] hover:text-[#0d9f91]"
          >
            <Heart className="size-4" aria-hidden="true" />
            {wishlistCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.6rem] font-semibold leading-4 text-white">
                {wishlistCount}
              </span>
            ) : null}
          </Link>
          <Link
            to="/hotels"
            className={buttonStyles('primary', 'sm', false)}
          >
            Book a stay
          </Link>
          <div className="relative">
            <button
              type="button"
              onClick={() => setAccountOpen((current) => !current)}
              aria-expanded={accountOpen}
              className="rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              Sign in
            </button>
            {accountOpen ? (
              <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-line bg-white p-2 shadow-[0_20px_45px_-25px_rgba(14,43,59,0.45)]">
                {accountLinks.map(({ label, to, icon: Icon }) => (
                  <Link
                    key={label}
                    to={to}
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted transition hover:bg-canvas hover:text-ink"
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setLocaleOpen(true)}
            className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold tracking-wide text-muted transition hover:border-[#0d9f91]"
          >
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true">{country}</span>
              {currency}
            </span>
          </button>
        </div>

        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-full border border-line bg-white text-ink md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <div id="mobile-menu" className="border-t border-line bg-canvas px-5 pb-6 pt-4 md:hidden">
          <nav className="flex flex-col" aria-label="Mobile navigation">
            {links.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setOpen(false)}
                className="border-b border-line/70 py-3.5 text-sm font-medium text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-5 flex items-center gap-3">
            <Link
              to="/hotels"
              onClick={() => setOpen(false)}
              className={buttonStyles('primary', 'md', true)}
            >
              Book a stay
            </Link>
          </div>
          <Link
            to="/wishlist"
            onClick={() => setOpen(false)}
            className="mt-3 flex items-center justify-between rounded-full border border-line px-4 py-2.5 text-sm font-medium text-ink"
          >
            <span className="inline-flex items-center gap-2">
              <Heart className="size-4 text-accent" aria-hidden="true" />
              Wishlist
            </span>
            {wishlistCount > 0 ? (
              <span className="flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[0.65rem] font-semibold leading-5 text-white">
                {wishlistCount}
              </span>
            ) : null}
          </Link>
          <div className="mt-3 flex items-center justify-between text-sm text-muted">
            <button type="button" onClick={() => setLocaleOpen(true)} className="inline-flex items-center gap-1.5">
              <span aria-hidden="true">{country}</span>
              {currency}
            </button>
            <button
              type="button"
              onClick={() => setAccountOpen((current) => !current)}
              aria-expanded={accountOpen}
              className="font-medium text-ink"
            >
              Sign in
            </button>
          </div>
          {accountOpen ? (
            <nav className="mt-3 border-t border-line pt-2" aria-label="Account navigation">
              {accountLinks.map(({ label, to, icon: Icon }) => (
                <Link
                  key={label}
                  to={to}
                  onClick={() => {
                    setAccountOpen(false)
                    setOpen(false)
                  }}
                  className="flex items-center gap-2.5 border-b border-line/70 py-3 text-sm text-ink"
                >
                  <Icon className="size-4 text-brand" aria-hidden="true" />
                  {label}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>
      ) : null}

      {localeOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 px-4 pt-10 sm:pt-16"
          role="dialog"
          aria-modal="true"
          aria-label="Currency and language settings"
          onClick={() => setLocaleOpen(false)}
        >
          <div
            className="w-full max-w-[440px] overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="p-5">
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-muted">Country</span>
                  <span className="relative flex h-[51px] items-center rounded-lg border border-line transition focus-within:border-[#0d9f91]">
                    <span className="pointer-events-none absolute left-4 text-lg" aria-hidden="true">
                      {getFlag(country)}
                    </span>
                    <select
                      value={country}
                      onChange={(event) => setCountry(event.target.value)}
                      className="h-full w-full appearance-none bg-transparent pl-12 pr-10 text-sm font-medium text-ink outline-none"
                    >
                      {countries.map(({ code, name }) => (
                        <option key={code} value={code}>
                          {getFlag(code)} {name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 size-4 text-muted" aria-hidden="true" />
                  </span>
                </label>
                <LocaleSelect
                  label="Currency"
                  value={currency}
                  onChange={setCurrency}
                  options={[
                    ['INR', 'Indian Rupee'],
                    ['USD', 'US Dollar'],
                    ['EUR', 'Euro'],
                    ['GBP', 'British Pound'],
                    ['AED', 'UAE Dirham'],
                    ['SGD', 'Singapore Dollar'],
                    ['AUD', 'Australian Dollar'],
                    ['JPY', 'Japanese Yen'],
                  ]}
                />
                <LocaleSelect
                  label="Language"
                  value={language}
                  onChange={setLanguage}
                  options={[
                    ['en', 'English'],
                    ['hi', 'Hindi'],
                    ['fr', 'French'],
                    ['de', 'German'],
                    ['es', 'Spanish'],
                    ['it', 'Italian'],
                    ['ja', 'Japanese'],
                  ]}
                />
              </div>
            </div>
            <div className="border-t border-line bg-[#fafafa] p-4">
              <button
                type="button"
                onClick={() => setLocaleOpen(false)}
                className="h-[51px] w-full rounded-lg bg-[#c9c9c9] text-sm font-semibold text-white transition hover:bg-[#b5b5b5]"
              >
                APPLY
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLocaleOpen(false)}
            className="absolute right-4 top-3 flex size-8 items-center justify-center rounded-full bg-white text-ink shadow"
            aria-label="Close currency settings"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}
    </header>
  )
}
