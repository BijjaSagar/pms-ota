export const ANALYTICS_SECTIONS = [
  {
    id: 'room-nights',
    label: 'Room Nights',
    title: 'Performance Overview - Room Nights',
    description: 'Room nights booked during the selected period, compared with the competitor set.',
    metric: 'roomNights',
    unit: 'nights',
  },
  {
    id: 'revenue',
    label: 'Revenue',
    title: 'Performance Overview - Revenue',
    description: 'Revenue generated during the selected period, compared with competitor revenue.',
    metric: 'revenue',
    unit: 'INR',
  },
  {
    id: 'asp',
    label: 'ASP',
    title: 'Performance Overview - Average Selling Price',
    description: 'Average selling price of rooms with a day-wise competitor price comparison.',
    metric: 'asp',
    unit: 'INR',
  },
  {
    id: 'visits',
    label: 'Property Visits',
    title: 'Performance Overview - Property Visits',
    description: 'Listing views received from guests on the booking platform.',
    metric: 'visits',
    unit: 'visits',
  },
  {
    id: 'conversion',
    label: 'Conversion',
    title: 'Performance Overview - Conversion',
    description: 'How effectively property visits turn into confirmed bookings.',
    metric: 'conversion',
    unit: '%',
  },
];

export const ANALYTICS_FILTER_OPTIONS = {
  duration: [
    { value: '30', label: 'Last 30 days' },
    { value: '60', label: 'Last 60 days' },
    { value: '90', label: 'Last 90 days' },
  ],
  brand: [
    { value: 'all', label: 'All brands' },
    { value: 'mmt', label: 'MakeMyTrip' },
    { value: 'goibibo', label: 'Goibibo' },
  ],
  comparison: [
    { value: 'previous', label: 'Previous period' },
    { value: 'last-year', label: 'Last year' },
    { value: 'market', label: 'Market average' },
  ],
  dateType: [
    { value: 'week', label: 'Week' },
    { value: 'weekday', label: 'Weekday' },
    { value: 'date', label: 'Date' },
  ],
};

export const createInitialAnalyticsFilters = () => ({
  duration: '30',
  brand: 'all',
  comparison: 'previous',
  dateType: 'week',
});

export const INITIAL_ANALYTICS_FILTERS = createInitialAnalyticsFilters();

export const KPI_CARDS = [
  { id: 'room-nights', section: 'room-nights', label: 'Room Nights', value: 118, growth: 20, competitorShare: 11 },
  { id: 'revenue', section: 'revenue', label: 'Revenue', value: 360000, growth: 38, competitorShare: 12 },
  { id: 'asp', section: 'asp', label: 'Average Selling Price', value: 3951, growth: 14, competitorShare: 15 },
  { id: 'visits', section: 'visits', label: 'Property Visits', value: 1605, growth: 9, competitorShare: 10 },
  { id: 'conversion', section: 'conversion', label: 'Conversion', value: 4.8, growth: 6, competitorShare: 17 },
];

export const WEEKLY_TRENDS = {
  'room-nights': [
    { label: 'W1', weekday: 'Mon', date: '28 Oct', property: 14, competitor: 13 },
    { label: 'W2', weekday: 'Tue', date: '4 Nov', property: 17, competitor: 15 },
    { label: 'W3', weekday: 'Wed', date: '11 Nov', property: 19, competitor: 17 },
    { label: 'W4', weekday: 'Thu', date: '18 Nov', property: 16, competitor: 18 },
    { label: 'W5', weekday: 'Fri', date: '25 Nov', property: 18, competitor: 16 },
    { label: 'W6', weekday: 'Sat', date: '2 Dec', property: 17, competitor: 15 },
    { label: 'W7', weekday: 'Sun', date: '9 Dec', property: 17, competitor: 16 },
  ],
  revenue: [
    { label: 'W1', weekday: 'Mon', date: '28 Oct', property: 42000, competitor: 37000 },
    { label: 'W2', weekday: 'Tue', date: '4 Nov', property: 51000, competitor: 44000 },
    { label: 'W3', weekday: 'Wed', date: '11 Nov', property: 58000, competitor: 49000 },
    { label: 'W4', weekday: 'Thu', date: '18 Nov', property: 47000, competitor: 45000 },
    { label: 'W5', weekday: 'Fri', date: '25 Nov', property: 54000, competitor: 48000 },
    { label: 'W6', weekday: 'Sat', date: '2 Dec', property: 53000, competitor: 47000 },
    { label: 'W7', weekday: 'Sun', date: '9 Dec', property: 55000, competitor: 50000 },
  ],
  asp: [
    { label: 'W1', weekday: 'Mon', date: '28 Oct', property: 3720, competitor: 3500 },
    { label: 'W2', weekday: 'Tue', date: '4 Nov', property: 3860, competitor: 3560 },
    { label: 'W3', weekday: 'Wed', date: '11 Nov', property: 4010, competitor: 3630 },
    { label: 'W4', weekday: 'Thu', date: '18 Nov', property: 3880, competitor: 3580 },
    { label: 'W5', weekday: 'Fri', date: '25 Nov', property: 3990, competitor: 3670 },
    { label: 'W6', weekday: 'Sat', date: '2 Dec', property: 4020, competitor: 3710 },
    { label: 'W7', weekday: 'Sun', date: '9 Dec', property: 4050, competitor: 3740 },
  ],
  visits: [
    { label: 'W1', weekday: 'Mon', date: '28 Oct', property: 205, competitor: 190 },
    { label: 'W2', weekday: 'Tue', date: '4 Nov', property: 230, competitor: 215 },
    { label: 'W3', weekday: 'Wed', date: '11 Nov', property: 248, competitor: 222 },
    { label: 'W4', weekday: 'Thu', date: '18 Nov', property: 216, competitor: 228 },
    { label: 'W5', weekday: 'Fri', date: '25 Nov', property: 238, competitor: 220 },
    { label: 'W6', weekday: 'Sat', date: '2 Dec', property: 232, competitor: 217 },
    { label: 'W7', weekday: 'Sun', date: '9 Dec', property: 236, competitor: 225 },
  ],
  conversion: [
    { label: 'W1', weekday: 'Mon', date: '28 Oct', property: 4.2, competitor: 3.8 },
    { label: 'W2', weekday: 'Tue', date: '4 Nov', property: 4.5, competitor: 4.0 },
    { label: 'W3', weekday: 'Wed', date: '11 Nov', property: 5.1, competitor: 4.2 },
    { label: 'W4', weekday: 'Thu', date: '18 Nov', property: 4.6, competitor: 4.4 },
    { label: 'W5', weekday: 'Fri', date: '25 Nov', property: 4.9, competitor: 4.3 },
    { label: 'W6', weekday: 'Sat', date: '2 Dec', property: 5.0, competitor: 4.5 },
    { label: 'W7', weekday: 'Sun', date: '9 Dec', property: 5.2, competitor: 4.6 },
  ],
};

const buildBreakdown = (rows, total) => rows.map(([label, value, competitor]) => ({
  label,
  value,
  competitor,
  share: total ? Math.round((value / total) * 100) : 0,
}));

const ROOM_NIGHTS_BREAKDOWNS = [
  {
    id: 'businessChannels',
    label: 'Business Channels',
    rows: buildBreakdown([
      ['B2C', 58, 51],
      ['MyBiz/Corporate', 31, 29],
      ['MyPartner', 18, 16],
      ['Holidays', 11, 12],
    ], 118),
  },
  {
    id: 'roomRatePlans',
    label: 'Room / Rate Plans',
    rows: buildBreakdown([
      ['Deluxe - EP', 42, 38],
      ['Family Studio - CP', 34, 31],
      ['Suite - MAP', 24, 22],
      ['Standard - EP', 18, 17],
    ], 118),
  },
  {
    id: 'daysOfWeek',
    label: 'Days of the Week',
    rows: buildBreakdown([
      ['Monday', 14, 13],
      ['Tuesday', 15, 14],
      ['Wednesday', 17, 16],
      ['Thursday', 16, 17],
      ['Friday', 20, 18],
      ['Saturday', 22, 19],
      ['Sunday', 14, 15],
    ], 118),
  },
  {
    id: 'mealPlans',
    label: 'Meal Plans',
    rows: buildBreakdown([
      ['CP', 52, 46],
      ['EP', 38, 39],
      ['MAP', 19, 17],
      ['AP', 9, 8],
    ], 118),
  },
  {
    id: 'travellerMix',
    label: 'Traveller Mix',
    rows: buildBreakdown([
      ['Group', 38, 34],
      ['Couple', 34, 32],
      ['Family', 29, 27],
      ['Individual', 17, 16],
    ], 118),
  },
  {
    id: 'lengthOfStay',
    label: 'Length of Stay',
    rows: buildBreakdown([
      ['1 day', 47, 43],
      ['2 days', 39, 36],
      ['3 days', 21, 19],
      ['4+ days', 11, 10],
    ], 118),
  },
  {
    id: 'advancePurchase',
    label: 'Advance Purchase Window',
    rows: buildBreakdown([
      ['0-3 days', 31, 29],
      ['4-7 days', 34, 31],
      ['8-15 days', 24, 22],
      ['16-30 days', 18, 16],
      ['31+ days', 11, 10],
    ], 118),
  },
];

const REVENUE_BREAKDOWNS = [
  {
    id: 'businessChannels',
    label: 'Business Channels',
    rows: buildBreakdown([
      ['B2C', 178000, 154000],
      ['MyBiz/Corporate', 96000, 87000],
      ['MyPartner', 56000, 52000],
      ['Holidays', 30000, 28000],
    ], 360000),
  },
  {
    id: 'roomRatePlans',
    label: 'Room / Rate Plans',
    rows: buildBreakdown([
      ['Deluxe - EP', 132000, 116000],
      ['Family Studio - CP', 108000, 97000],
      ['Suite - MAP', 76000, 69000],
      ['Standard - EP', 44000, 41000],
    ], 360000),
  },
  {
    id: 'daysOfWeek',
    label: 'Days of the Week',
    rows: buildBreakdown([
      ['Monday', 42000, 39000],
      ['Tuesday', 45000, 42000],
      ['Wednesday', 51000, 47000],
      ['Thursday', 48000, 46000],
      ['Friday', 62000, 55000],
      ['Saturday', 68000, 59000],
      ['Sunday', 44000, 42000],
    ], 360000),
  },
  {
    id: 'mealPlans',
    label: 'Meal Plans',
    rows: buildBreakdown([
      ['CP', 158000, 141000],
      ['EP', 118000, 112000],
      ['MAP', 59000, 54000],
      ['AP', 25000, 22000],
    ], 360000),
  },
  {
    id: 'travellerMix',
    label: 'Traveller Mix',
    rows: buildBreakdown([
      ['Group', 116000, 102000],
      ['Couple', 104000, 96000],
      ['Family', 92000, 85000],
      ['Individual', 48000, 45000],
    ], 360000),
  },
  {
    id: 'lengthOfStay',
    label: 'Length of Stay',
    rows: buildBreakdown([
      ['1 day', 142000, 129000],
      ['2 days', 118000, 108000],
      ['3 days', 65000, 59000],
      ['4+ days', 35000, 31000],
    ], 360000),
  },
  {
    id: 'advancePurchase',
    label: 'Advance Purchase Window',
    rows: buildBreakdown([
      ['0-3 days', 96000, 89000],
      ['4-7 days', 104000, 95000],
      ['8-15 days', 74000, 68000],
      ['16-30 days', 56000, 51000],
      ['31+ days', 30000, 27000],
    ], 360000),
  },
];

const VISITS_BREAKDOWNS = [
  {
    id: 'advancePurchase',
    label: 'Advance Purchase Window',
    rows: buildBreakdown([
      ['0-3 days', 486, 451],
      ['4-7 days', 421, 398],
      ['8-15 days', 312, 294],
      ['16-30 days', 235, 221],
      ['31+ days', 151, 143],
    ], 1605),
  },
  {
    id: 'travellerMix',
    label: 'Traveller Mix',
    rows: buildBreakdown([
      ['Group', 482, 448],
      ['Couple', 446, 421],
      ['Family', 418, 396],
      ['Individual', 259, 247],
    ], 1605),
  },
  {
    id: 'lengthOfStay',
    label: 'Length of Stay',
    rows: buildBreakdown([
      ['1 day', 632, 598],
      ['2 days', 514, 481],
      ['3 days', 286, 269],
      ['4+ days', 173, 162],
    ], 1605),
  },
];

const CONVERSION_BREAKDOWNS = [
  {
    id: 'advancePurchase',
    label: 'Advance Purchase Window',
    rows: buildBreakdown([
      ['0-3 days', 5.4, 4.6],
      ['4-7 days', 5.1, 4.4],
      ['8-15 days', 4.7, 4.1],
      ['16-30 days', 4.2, 3.8],
      ['31+ days', 3.6, 3.4],
    ], 100),
  },
  {
    id: 'travellerMix',
    label: 'Traveller Mix',
    rows: buildBreakdown([
      ['Group', 5.2, 4.5],
      ['Couple', 5.0, 4.4],
      ['Family', 4.7, 4.2],
      ['Individual', 3.9, 3.6],
    ], 100),
  },
  {
    id: 'lengthOfStay',
    label: 'Length of Stay',
    rows: buildBreakdown([
      ['1 day', 5.1, 4.4],
      ['2 days', 4.9, 4.3],
      ['3 days', 4.6, 4.1],
      ['4+ days', 4.1, 3.7],
    ], 100),
  },
];

export const SECTION_BREAKDOWNS = {
  'room-nights': ROOM_NIGHTS_BREAKDOWNS,
  revenue: REVENUE_BREAKDOWNS,
  asp: ROOM_NIGHTS_BREAKDOWNS,
  visits: VISITS_BREAKDOWNS,
  conversion: CONVERSION_BREAKDOWNS,
};

const COMPETITOR_NAMES = ['The Fern Residency', 'Bloom Hotel', 'Vits Solapur', 'Treebo Trend'];
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const buildAspWeek = (id, label, startDay, propertyRates, medianRates, offsets) => ({
  id,
  label,
  days: propertyRates.map((rate, index) => {
    const competitors = COMPETITOR_NAMES.map((name, competitorIndex) => ({
      name,
      price: medianRates[index] + offsets[competitorIndex],
    }));
    const calendarDay = startDay + index;
    return {
      date: calendarDay <= 30 ? `${calendarDay} Nov` : `${calendarDay - 30} Dec`,
      day: DAY_NAMES[index],
      property: rate,
      competitorMedian: medianRates[index],
      competitors,
      rank: 1 + competitors.filter((competitor) => competitor.price < rate).length,
    };
  }),
});

export const ASP_WEEKS = [
  buildAspWeek('week-1', '23 - 29 Nov', 23, [3820, 3880, 3950, 3900, 4020, 4100, 3990], [3610, 3660, 3710, 3690, 3750, 3800, 3760], [-120, -40, 80, 160]),
  buildAspWeek('week-2', '30 Nov - 6 Dec', 30, [4040, 3980, 3920, 4010, 4120, 4180, 4090], [3820, 3780, 3740, 3790, 3860, 3910, 3850], [-140, -30, 90, 180]),
];

const DURATION_FACTORS = { 30: 1, 60: 1.9, 90: 2.7 };
const BRAND_FACTORS = { all: 1, mmt: 0.63, goibibo: 0.37 };
const RATE_SECTIONS = new Set(['asp', 'conversion']);

const filterLabel = (entries, value) => entries.find((entry) => entry.value === value)?.label ?? value;

export const analyticsFilterLabels = (filters) => ({
  Duration: filterLabel(ANALYTICS_FILTER_OPTIONS.duration, filters.duration),
  Brand: filterLabel(ANALYTICS_FILTER_OPTIONS.brand, filters.brand),
  'Comparison Period': filterLabel(ANALYTICS_FILTER_OPTIONS.comparison, filters.comparison),
  'Date Type': filterLabel(ANALYTICS_FILTER_OPTIONS.dateType, filters.dateType),
});

export const formatAnalyticsValue = (sectionId, value) => {
  if (sectionId === 'revenue') return `INR ${(value / 100000).toFixed(1)} Lakhs`;
  if (sectionId === 'asp') return `INR ${Math.round(value).toLocaleString('en-IN')}`;
  if (sectionId === 'conversion') return `${value.toFixed(1)}%`;
  return Math.round(value).toLocaleString('en-IN');
};

const scaleValue = (sectionId, value, factor) => {
  if (RATE_SECTIONS.has(sectionId)) return value * (1 + (factor - 1) * 0.16);
  return value * factor;
};

export function buildAnalyticsModel(sectionId, filters, weekIndex = 0) {
  const section = ANALYTICS_SECTIONS.find((item) => item.id === sectionId) ?? ANALYTICS_SECTIONS[0];
  const card = KPI_CARDS.find((item) => item.section === section.id) ?? KPI_CARDS[0];
  const factor = (DURATION_FACTORS[filters.duration] ?? 1) * (BRAND_FACTORS[filters.brand] ?? 1);
  const competitorFactor = filters.comparison === 'market' ? 1.08 : filters.comparison === 'last-year' ? 0.94 : 1;
  const comparisonLabel = filters.comparison === 'market' ? 'Market average' : filters.comparison === 'last-year' ? 'Last year' : 'Previous period';
  const value = scaleValue(section.id, card.value, factor);
  const weekly = WEEKLY_TRENDS[section.id].map((row) => ({
    ...row,
    axisLabel: row[filters.dateType] ?? row.label,
    property: scaleValue(section.id, row.property, factor),
    competitor: scaleValue(section.id, row.competitor, factor * competitorFactor),
  }));
  const breakdowns = SECTION_BREAKDOWNS[section.id].map((group) => ({
    ...group,
    rows: group.rows.map((row) => ({
      ...row,
      value: scaleValue(section.id, row.value, factor),
      competitor: scaleValue(section.id, row.competitor, factor * competitorFactor),
    })),
  }));
  const aspWeek = ASP_WEEKS[Math.max(0, Math.min(weekIndex, ASP_WEEKS.length - 1))];
  const aspDays = aspWeek.days.map((day) => ({
    ...day,
    property: scaleValue('asp', day.property, factor),
    competitorMedian: scaleValue('asp', day.competitorMedian, factor * competitorFactor),
    competitors: day.competitors.map((competitor) => ({
      ...competitor,
      price: scaleValue('asp', competitor.price, factor * competitorFactor),
    })),
  }));

  return {
    section,
    card,
    value,
    displayValue: formatAnalyticsValue(section.id, value),
    growth: card.growth,
    competitorShare: card.competitorShare,
    comparisonLabel,
    weekly,
    breakdowns,
    aspWeek,
    aspDays,
  };
}
