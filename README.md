# TriponX — OTA front end (React + Vite)

A calm, premium hotel-booking UI: Home & search → Results → Property → Checkout.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```

Deploying on Vercel: framework preset **Vite**, output `dist`. `vercel.json` is included so deep links like `/stay/kanan-tea-house` work.

## Structure

```
src/
  main.jsx            router setup
  App.jsx             routes: /  /search  /stay/:id  /checkout
  data.js             sample content (swap for your PMS / API data)
  styles.css          design tokens + all styles, responsive
  components/
    Icons.jsx         thin-stroke SVG icon set + logo
    Layout.jsx        Header, Footer, Photo placeholder, Chip
    MobileNav.jsx     floating bottom tab bar (phones only)
  pages/
    Home.jsx          hero search, intent chips, collections, flexible-date strip
    Results.jsx       filters, sortable list, map pins, compare tray
    Stay.jsx          gallery, good-to-know, room picker, live price breakdown
    Checkout.jsx      one-page form with validation, 3 payment options, confirmation
```

## Design tokens (in `styles.css` `:root`)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#F6F5F1` | pearl background |
| `--ink` | `#1C2B2D` | primary text |
| `--muted` | `#5B6B6D` | secondary text |
| `--accent` | `#3F6B5C` | eucalyptus, buttons & highlights |
| `--sage` / `--mist` / `--sand` | soft tints | badges, cards |

Font: Manrope (Google Fonts, loaded in `index.html`).

## Hooking up real data

- Replace the arrays in `src/data.js` with API calls (e.g. `useEffect` + `fetch`, or React Query).
- `Photo` renders a tinted placeholder; swap it for `<img src=... />` once you have property images.
- Search params are passed through the URL (`/search?where=...&checkIn=...`), so results can be fetched from them.
