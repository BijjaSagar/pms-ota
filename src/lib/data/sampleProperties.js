// STATIC sample values for the Partner Hub booking summary, until the API sends bookings per property.
// Development only: a production build never shows them. Remove this file once the API has `stats`.

export const USE_SAMPLES = import.meta.env.DEV;

const SAMPLE_DETAILS = {
  isSample: true,
  ratings: [{ source: 'TriponX', value: 4.3 }, { source: 'Google', value: 4.4 }],
  reviewRequests: 5,
  stats: { todayBookings: 2, todayCheckIns: 3, stayingToday: 0, todayCheckOuts: 5, netBookings: 66, netEarnings: 280000 },
};

// Shown in Active only while the partner has no approved property.
const SAMPLE_PROPERTY = {
  id: 'sample', reference: 'PTR-SAMPLE', type: 'hotel', typeLabel: 'Hotel', status: 'LIVE', editable: false,
  propertyName: 'The Cult Stay', city: 'Solapur', totalRooms: 24,
  completedSections: ['basic', 'location', 'amenities', 'rooms', 'policies', 'legal'],
  coverUrl: null, reviewNote: null, submittedAt: null, createdAt: '2026-11-24T00:00:00.000Z', updatedAt: '2026-11-24T00:00:00.000Z',
};

/** The partner's real properties, with sample numbers on the active ones that have none. */
export function withSamples(items) {
  if (!USE_SAMPLES) return items;
  const isActive = (p) => p.status === 'LIVE' || p.status === 'SUSPENDED';
  const list = items.some(isActive) ? items : [...items, SAMPLE_PROPERTY];
  return list.map((p) => (isActive(p) && !p.stats ? { ...p, ...SAMPLE_DETAILS } : p));
}
