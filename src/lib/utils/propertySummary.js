// Numbers on the Partner Hub property cards: metrics and content score.
import { PROPERTY_INFO_SECTIONS } from '../data/partner.js';

// The API has no bookings per partner property yet. Once it sends `stats: { todayBookings, … }` with each
// property (same keys as below), the numbers fill in. Until then a value is null and shows "–".
export const TODAY_METRICS = [
  { key: 'todayBookings', label: 'Bookings', view: 'bookings' },
  { key: 'todayCheckIns', label: 'Check-ins', view: 'check-ins' },
  { key: 'stayingToday', label: 'Staying', view: 'staying' },
  { key: 'todayCheckOuts', label: 'Check-outs', view: 'check-outs' },
];
export const PERIOD_METRICS = [
  { key: 'netBookings', label: 'Net bookings', view: 'bookings' },
  { key: 'netEarnings', label: 'Net earnings', view: 'earnings', money: true },
];

export const metricOf = (property, key) => property.stats?.[key] ?? null;

const count = new Intl.NumberFormat('en-IN');
const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1 });
export const showMetric = (value, money = false) => (value === null ? '–' : (money ? rupees : count).format(value));

// ---------- content score: share of the listing steps that are complete ----------
export const pendingSections = (p) => PROPERTY_INFO_SECTIONS.filter((s) => !p.completedSections.includes(s.id));
export const contentScore = (p) => Math.round(((PROPERTY_INFO_SECTIONS.length - pendingSections(p).length) / PROPERTY_INFO_SECTIONS.length) * 100);

export const nameOf = (p) => p.propertyName ?? `New ${p.typeLabel.toLowerCase()}`;
