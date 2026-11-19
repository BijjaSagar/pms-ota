// "List your property" (partner onboarding): page content + the lead-submission service.
// The UI only talks to `submitPartnerLead`, so swapping the demo store for a real
// API later (e.g. POST /partners/leads on the NestJS backend) is a one-function change.
import { isValidEmail, isValidPhone } from '../utils/validation.js';

// Two families of property, shown as the first choice in "List New Property".
export const PROPERTY_CATEGORIES = [
  { id: 'stay', title: 'Hotels & stays', text: 'Rooms with front desk or on-site staff — hotels, resorts, palaces and more.' },
  { id: 'home', title: 'Homes & villas', text: 'A whole home or a few rooms guests book for themselves — villas, homestays, cottages.' },
];

// [value, label, category, one-line description]. The first entry is the <select> placeholder.
// Values hotel/resort/boutique/villa/homestay/serviced are kept as-is so earlier requests still resolve.
export const PROPERTY_TYPES = [
  ['', 'Select a property type'],
  ['hotel', 'Hotel', 'stay', 'Rooms with daily housekeeping, a front desk and usually a restaurant.'],
  ['resort', 'Resort', 'stay', 'A getaway with pools, spa or activities guests enjoy without leaving.'],
  ['boutique', 'Boutique hotel', 'stay', 'A small, design-led hotel with a personal touch.'],
  ['palace', 'Heritage palace', 'stay', 'A haveli, fort or palace with royal history, run as a hotel.'],
  ['lodge', 'Lodge', 'stay', 'Simple comfort close to nature — forests, hills or wildlife.'],
  ['guesthouse', 'Guest house', 'stay', 'A few rooms in a family-run house, with hosts nearby.'],
  ['houseboat', 'Houseboat', 'stay', 'Bedrooms on a boat, such as a kettuvallam on the backwaters.'],
  ['motel', 'Motel', 'stay', 'Budget rooms by the highway with parking at the door.'],
  ['villa', 'Villa / holiday home', 'home', 'A private house rented in full, often with a pool or garden.'],
  ['homestay', 'Homestay / B&B', 'home', 'Guests stay in your home and share local life and meals.'],
  ['serviced', 'Serviced apartment', 'home', 'A furnished flat with a kitchen, ideal for longer stays.'],
  ['cottage', 'Cottage', 'home', 'A cosy standalone cottage in the hills, woods or by the sea.'],
  ['farmstay', 'Farm stay', 'home', 'Rooms on a working farm, orchard or plantation.'],
  ['camp', 'Camp / glamping', 'home', 'Tents or domes with real beds, under the open sky.'],
];

export const propertyTypeById = (value) => PROPERTY_TYPES.find(([v]) => v === value);

export const ROOM_RANGES = [
  ['', 'Number of rooms'],
  ['1-10', '1–10 rooms'],
  ['11-30', '11–30 rooms'],
  ['31-80', '31–80 rooms'],
  ['80+', 'More than 80 rooms'],
];

export const PARTNER_STATS = [
  { value: '2M+', label: 'Monthly travellers' },
  { value: '0', label: 'Sign-up fee' },
  { value: '48 hrs', label: 'To go live' },
  { value: 'Weekly', label: 'Payouts' },
];

export const PARTNER_FAQS = [
  { q: 'What does it cost to list?', a: 'Listing is free. We charge a commission only on completed stays — never on cancellations or no-shows.' },
  { q: 'Can I keep using my current PMS or channel manager?', a: 'Yes. Rates and availability sync two-way with your PMS, so you never update inventory in two places.' },
  { q: 'Who controls prices and policies?', a: 'You do. Set rates, minimum stays, cancellation rules and promotions from the extranet at any time.' },
  { q: 'When do I get paid?', a: 'Payouts for checked-out stays are sent every week to your bank account, with a downloadable statement.' },
];

export const EMPTY_LEAD = {
  propertyName: '', propertyType: '', city: '', rooms: '', website: '',
  contactName: '', email: '', phone: '', message: '', consent: false,
};

export function validateLead(lead) {
  const errors = {};
  if (lead.propertyName.trim().length < 2) errors.propertyName = 'Enter your property name.';
  if (!lead.propertyType) errors.propertyType = 'Choose a property type.';
  if (lead.city.trim().length < 2) errors.city = 'Enter the city.';
  if (!lead.rooms) errors.rooms = 'Choose the number of rooms.';
  if (lead.website.trim() && !/^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(lead.website.trim())) {
    errors.website = 'Enter a valid website, e.g. www.yourhotel.com';
  }
  if (lead.contactName.trim().length < 2) errors.contactName = 'Enter your full name.';
  if (!isValidEmail(lead.email)) errors.email = 'Enter a valid email address.';
  if (!isValidPhone(lead.phone)) errors.phone = 'Enter a valid phone number.';
  if (!lead.consent) errors.consent = 'Please accept to be contacted about your listing.';
  return errors;
}

const STORE_KEY = 'triponx.partnerLeads';
// Keep plenty: these records are the partner's "In-Progress Properties" list, so dropping old ones would hide them.
const STORE_LIMIT = 200;

function makeReference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) code += chars[Math.floor(Math.random() * chars.length)];
  return `PTR-${code}`;
}

// Demo implementation: simulates network latency and keeps the lead in this browser.
// Storage can be unavailable (private mode, blocked site data) — the submission still succeeds.
export async function submitPartnerLead(lead, owner) {
  if (!owner?.id) throw new Error('Sign in required to list a property.');
  await new Promise((resolve) => { setTimeout(resolve, 700); });
  const record = {
    ...lead,
    propertyName: lead.propertyName.trim(),
    city: lead.city.trim(),
    contactName: lead.contactName.trim(),
    email: lead.email.trim().toLowerCase(),
    ownerId: owner.id,
    reference: makeReference(),
    createdAt: new Date().toISOString(),
  };
  try {
    const existing = JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]');
    localStorage.setItem(STORE_KEY, JSON.stringify([record, ...existing].slice(0, STORE_LIMIT)));
  } catch { /* storage unavailable — non-fatal for the demo */ }
  return { reference: record.reference };
}

// Listing requests submitted by one partner, newest first. Until a request is reviewed and approved it is
// an "in-progress" property; there is no approval flow yet, so every request is in progress.
export function getPartnerLeads(ownerId) {
  if (!ownerId) return [];
  try {
    const all = JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]');
    return Array.isArray(all) ? all.filter((r) => r.ownerId === ownerId) : [];
  } catch {
    return [];
  }
}
