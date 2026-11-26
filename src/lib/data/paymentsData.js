import { formatStayDate } from './sampleBookings.js';

export const PAYMENT_TABS = [
  { id: 'earnings', label: 'Net Earnings' },
  { id: 'payouts', label: 'Payouts' },
];

export const PAYMENT_VIEWS = [
  { id: 'new', label: 'New View' },
  { id: 'old', label: 'Old View' },
];

export const DATE_RANGES = ['Month Till Date', 'Last 7 Days', 'Last 30 Days', 'This Week'];
export const BOOKING_STATUSES = ['All', 'Confirmed', 'Checked-in', 'Completed', 'Cancelled'];
export const BOOKING_TYPES = ['All', 'Direct', 'OTA', 'Corporate'];
export const PAYMENT_STATUSES = ['All', 'Pending', 'Settled'];
export const BRANDS = ['All', 'Goibibo', 'MakeMyTrip', 'TriponX', 'Booking.com'];

export const EARNINGS_SUMMARY = {
  netBookings: 52,
  payable: 220470,
  settled: 191374,
  pending: 29096,
  transferred: 190234,
  adjusted: 1140,
};

export const PAYOUTS_SUMMARY = {
  paymentsMade: 15,
  bookingsCount: 43,
  settled: 191374,
  transferred: 190234,
  adjusted: 1140,
};

export const INITIAL_EARNINGS_FILTERS = {
  range: DATE_RANGES[0],
  bookingStatus: 'Confirmed',
  bookingType: 'All',
  paymentStatus: 'All',
  brand: 'All',
};

export const INITIAL_PAYOUT_FILTERS = { range: DATE_RANGES[0] };
export const PAGE_SIZE = 8;

const FIRST_NAMES = ['Aarav', 'Vivaan', 'Ananya', 'Diya', 'Meera', 'Rohan', 'Kavya', 'Arjun', 'Isha', 'Neel', 'Sara', 'Dev'];
const LAST_NAMES = ['Sharma', 'Verma', 'Patil', 'Joshi', 'Mehta', 'Rao', 'Kulkarni', 'Desai', 'Pillai', 'Nair', 'Gupta', 'Singh'];
const BRAND_VALUES = BRANDS.slice(1);
const BOOKING_TYPE_VALUES = BOOKING_TYPES.slice(1);

const addDays = (iso, days) => {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const BOOKING_PAYMENTS = Array.from({ length: 48 }, (_, index) => {
  const checkIn = addDays('2026-11-01', index % 24);
  const checkOut = addDays(checkIn, 2 + (index % 3));
  const paymentStatus = index % 7 === 0 ? 'Pending' : 'Settled';
  const bookingAmount = 4200 + ((index * 730) % 5200);
  const payable = Math.round(bookingAmount * (0.82 + (index % 5) * 0.01));
  const adjusted = paymentStatus === 'Settled' ? (index % 4) * 20 : 0;
  return {
    id: `PMS${String(810240 + index)}`,
    pnr: `PNR${String(45210 + index)}`,
    guest: `${FIRST_NAMES[index % FIRST_NAMES.length]} ${LAST_NAMES[(index * 3) % LAST_NAMES.length]}`,
    checkIn,
    checkOut,
    stay: `${formatStayDate(checkIn)} – ${formatStayDate(checkOut)}`,
    bookingStatus: index % 13 === 0 ? 'Checked-in' : 'Confirmed',
    bookingType: BOOKING_TYPE_VALUES[index % BOOKING_TYPE_VALUES.length],
    brand: BRAND_VALUES[index % BRAND_VALUES.length],
    bookingAmount,
    payable,
    paymentStatus,
    dueDate: paymentStatus === 'Pending' ? addDays(checkIn, 3) : null,
    transferred: paymentStatus === 'Settled' ? payable - adjusted : 0,
    adjusted,
  };
});

export const PAYOUTS = Array.from({ length: 15 }, (_, index) => {
  const settled = 8200 + ((index * 1370) % 18000);
  const adjusted = (index % 4) * 95 + 20;
  return {
    reference: `PAY-${String(90210 + index * 17)}`,
    date: addDays('2026-11-30', index * -2),
    bookings: 2 + (index % 5),
    settled,
    transferred: settled - adjusted,
    adjusted,
  };
});

const rangeFloor = (range) => {
  if (range === 'Last 7 Days') return '2026-11-25';
  if (range === 'This Week') return '2026-11-23';
  return '2026-11-01';
};

export function filterBookingPayments(rows, filters, query) {
  const needle = query.trim().toLowerCase();
  const floor = rangeFloor(filters.range);
  return rows.filter((row) => {
    if (row.checkIn < floor) return false;
    if (filters.bookingStatus !== 'All' && row.bookingStatus !== filters.bookingStatus) return false;
    if (filters.bookingType !== 'All' && row.bookingType !== filters.bookingType) return false;
    if (filters.paymentStatus !== 'All' && row.paymentStatus !== filters.paymentStatus) return false;
    if (filters.brand !== 'All' && row.brand !== filters.brand) return false;
    if (!needle) return true;
    return [row.id, row.pnr, row.guest].some((value) => value.toLowerCase().includes(needle));
  });
}

export function filterPayouts(rows, filters, query) {
  const needle = query.trim().toLowerCase();
  const floor = rangeFloor(filters.range);
  return rows.filter((row) => {
    if (row.date < floor) return false;
    return !needle || row.reference.toLowerCase().includes(needle);
  });
}
