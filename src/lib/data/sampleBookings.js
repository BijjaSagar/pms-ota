// STATIC bookings for the property's Bookings tab. No API, no persistence — local UI only.
// Dates are built relative to today so "arriving today / tomorrow" stays meaningful in the demo.
const dateFromToday = (offset) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
};

const stamp = (offset) => {
  const date = dateFromToday(offset);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const initialsOf = (name) => name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

const makeBooking = ({ arrival, nights, guest, ...rest }) => ({
  ...rest,
  guest: { ...guest, initials: initialsOf(guest.name) },
  arrivalOffset: arrival,
  nights,
  checkIn: stamp(arrival),
  checkOut: stamp(arrival + nights),
});

export const BOOKINGS = [
  makeBooking({
    id: 'BK-2048', reference: 'TPX-8K2M9Q', status: 'Confirmed', arrival: 0, nights: 2,
    guest: { name: 'Aarav Sharma', email: 'aarav.sharma@example.com', phone: '+91 98220 41806', city: 'Pune' },
    room: 'Deluxe King', plan: 'Breakfast included', adults: 2, kids: 0, amount: 18400,
    payment: { mode: 'UPI', last4: '4821', state: 'Paid' },
    channel: 'MyBiz', source: 'Direct', gstInvoice: 'Generated', bookingType: 'New',
    otaName: 'TriponX MyBiz', pnr: 'PNR-8K2M9Q', bookedOn: stamp(-2),
    inclusions: ['Breakfast for 2', 'Wi-Fi', 'Late checkout on request'],
    cancellationPolicy: 'Free cancellation until 24 hours before check-in.',
    rooms: [{ name: 'Deluxe King', type: 'King bed · City view', adults: 2, kids: 0, mealPlan: 'Breakfast included', charges: 15000 }],
    charges: {
      roomCharges: 15000, extraAdultChildCharges: 1200, propertyTaxes: 1800, serviceCharges: 750,
      promotion: { label: 'MyBiz first-stay offer', amount: 350 },
    },
    timeline: [
      { label: 'Booking created', detail: 'TriponX app', at: '10:42 AM' },
      { label: 'Payment received', detail: 'UPI · ••4821', at: '10:44 AM' },
      { label: 'Confirmation sent', detail: 'Email and SMS', at: '10:45 AM' },
    ],
  }),
  makeBooking({
    id: 'BK-2047', reference: 'TPX-4R7N2P', status: 'Checked-in', arrival: -1, nights: 3,
    guest: { name: 'Meera Iyer', email: 'meera.iyer@example.com', phone: '+91 90110 27643', city: 'Mumbai' },
    room: 'Heritage Suite', plan: 'Breakfast and dinner', adults: 2, kids: 1, amount: 32600,
    payment: { mode: 'Card', last4: '9012', state: 'Paid' },
    channel: 'Q2T', source: 'OTA', gstInvoice: 'Generated', bookingType: 'Repeat',
    otaName: 'TriponX Q2T', pnr: 'PNR-4R7N2P', bookedOn: stamp(-4),
    inclusions: ['Breakfast for 2', 'Dinner for 3', 'Airport pickup'],
    cancellationPolicy: 'Free cancellation until 48 hours before check-in.',
    rooms: [{ name: 'Heritage Suite', type: 'King bed · Heritage view', adults: 2, kids: 1, mealPlan: 'Breakfast and dinner', charges: 27000 }],
    charges: {
      roomCharges: 27000, extraAdultChildCharges: 2100, propertyTaxes: 3240, serviceCharges: 1350,
      promotion: { label: 'Repeat guest offer', amount: 1090 },
    },
    timeline: [
      { label: 'Booking created', detail: 'TriponX website', at: '04:18 PM' },
      { label: 'Payment received', detail: 'Card · ••9012', at: '04:21 PM' },
      { label: 'Checked in', detail: 'Room 204 · Key issued', at: '02:05 PM' },
    ],
  }),
  makeBooking({
    id: 'BK-2046', reference: 'TPX-1L6H8V', status: 'Confirmed', arrival: 0, nights: 3,
    guest: { name: 'Rohan Patil', email: 'rohan.patil@example.com', phone: '+91 98870 33120', city: 'Nashik' },
    room: 'Deluxe Twin', plan: 'Room only', adults: 3, kids: 0, amount: 21900,
    payment: { mode: 'Net banking', last4: '7304', state: 'Paid' },
    channel: 'MyBiz', source: 'Direct', gstInvoice: 'Pending', bookingType: 'New',
    otaName: 'TriponX MyBiz', pnr: 'PNR-1L6H8V', bookedOn: stamp(-1),
    inclusions: ['Breakfast for 3', 'Wi-Fi'],
    cancellationPolicy: 'Free cancellation until 24 hours before check-in.',
    rooms: [{ name: 'Deluxe Twin', type: 'Twin beds · Garden view', adults: 3, kids: 0, mealPlan: 'Room only', charges: 18000 }],
    charges: {
      roomCharges: 18000, extraAdultChildCharges: 1350, propertyTaxes: 2160, serviceCharges: 900,
      promotion: { label: 'Direct booking offer', amount: 510 },
    },
    timeline: [
      { label: 'Booking created', detail: 'TriponX website', at: '09:12 AM' },
      { label: 'Payment received', detail: 'Net banking · ••7304', at: '09:15 AM' },
      { label: 'Confirmation sent', detail: 'Email and SMS', at: '09:16 AM' },
    ],
  }),
  makeBooking({
    id: 'BK-2045', reference: 'TPX-9Q3W5D', status: 'Pending', arrival: 0, nights: 1,
    guest: { name: 'Sneha Kulkarni', email: 'sneha.k@example.com', phone: '+91 93700 55218', city: 'Solapur' },
    room: 'Deluxe King', plan: 'Breakfast included', adults: 2, kids: 0, amount: 16750,
    payment: { mode: 'UPI', last4: '1198', state: 'Awaiting' },
    channel: 'Q2T', source: 'OTA', gstInvoice: 'Pending', bookingType: 'New',
    otaName: 'TriponX Q2T', pnr: 'PNR-9Q3W5D', bookedOn: stamp(0),
    inclusions: ['Breakfast for 2', 'Wi-Fi'],
    cancellationPolicy: 'Non-refundable rate.',
    rooms: [{ name: 'Deluxe King', type: 'King bed · City view', adults: 2, kids: 0, mealPlan: 'Breakfast included', charges: 14000 }],
    charges: {
      roomCharges: 14000, extraAdultChildCharges: 800, propertyTaxes: 1680, serviceCharges: 700,
      promotion: { label: 'OTA first booking offer', amount: 430 },
    },
    timeline: [
      { label: 'Booking created', detail: 'TriponX app', at: '08:31 AM' },
      { label: 'Payment link shared', detail: 'SMS and email', at: '08:32 AM' },
    ],
  }),
  makeBooking({
    id: 'BK-2044', reference: 'TPX-7T2M4K', status: 'Confirmed', arrival: 1, nights: 2,
    guest: { name: 'Kabir Shah', email: 'kabir.shah@example.com', phone: '+91 90980 61247', city: 'Ahmedabad' },
    room: 'Heritage Suite', plan: 'Breakfast included', adults: 2, kids: 1, amount: 34200,
    payment: { mode: 'Card', last4: '5567', state: 'Paid' },
    channel: 'MyBiz', source: 'OTA', gstInvoice: 'Generated', bookingType: 'Repeat',
    otaName: 'TriponX MyBiz', pnr: 'PNR-7T2M4K', bookedOn: stamp(-3),
    inclusions: ['Breakfast for 3', 'Dinner for 2', 'Spa credit'],
    cancellationPolicy: 'Free cancellation until 72 hours before check-in.',
    rooms: [{ name: 'Heritage Suite', type: 'King bed · Heritage view', adults: 2, kids: 1, mealPlan: 'Breakfast included', charges: 28500 }],
    charges: {
      roomCharges: 28500, extraAdultChildCharges: 1800, propertyTaxes: 3420, serviceCharges: 1425,
      promotion: { label: 'Repeat guest offer', amount: 945 },
    },
    timeline: [
      { label: 'Booking created', detail: 'TriponX app', at: '06:54 PM' },
      { label: 'Payment received', detail: 'Card · ••5567', at: '06:56 PM' },
      { label: 'Confirmation sent', detail: 'Email and SMS', at: '06:57 PM' },
    ],
  }),
  makeBooking({
    id: 'BK-2043', reference: 'TPX-5V8B1Z', status: 'Confirmed', arrival: 3, nights: 4,
    guest: { name: 'Ananya Rao', email: 'ananya.rao@example.com', phone: '+91 99840 17455', city: 'Bengaluru' },
    room: 'Deluxe King', plan: 'Breakfast and dinner', adults: 2, kids: 0, amount: 41200,
    payment: { mode: 'UPI', last4: '3389', state: 'Paid' },
    channel: 'Q2T', source: 'Direct', gstInvoice: 'Generated', bookingType: 'Corporate',
    otaName: 'TriponX Q2T', pnr: 'PNR-5V8B1Z', bookedOn: stamp(-6),
    inclusions: ['Breakfast for 2', 'Dinner for 2', 'Airport pickup', 'Wi-Fi'],
    cancellationPolicy: 'Free cancellation until 7 days before check-in.',
    rooms: [{ name: 'Deluxe King', type: 'King bed · City view', adults: 2, kids: 0, mealPlan: 'Breakfast and dinner', charges: 34000 }],
    charges: {
      roomCharges: 34000, extraAdultChildCharges: 2500, propertyTaxes: 4080, serviceCharges: 1700,
      promotion: { label: 'Corporate rate', amount: 1080 },
    },
    timeline: [
      { label: 'Booking created', detail: 'TriponX website', at: '11:26 AM' },
      { label: 'Payment received', detail: 'UPI · ••3389', at: '11:29 AM' },
      { label: 'Confirmation sent', detail: 'Email and SMS', at: '11:30 AM' },
    ],
  }),
  makeBooking({
    id: 'BK-2041', reference: 'TPX-3N9F6C', status: 'Completed', arrival: -5, nights: 2,
    guest: { name: 'Vikram Nair', email: 'vikram.nair@example.com', phone: '+91 96370 28419', city: 'Kochi' },
    room: 'Deluxe Twin', plan: 'Room only', adults: 2, kids: 0, amount: 19800,
    payment: { mode: 'Card', last4: '6620', state: 'Paid' },
    channel: 'MyBiz', source: 'Direct', gstInvoice: 'Not applicable', bookingType: 'Repeat',
    otaName: 'TriponX MyBiz', pnr: 'PNR-3N9F6C', bookedOn: stamp(-8),
    inclusions: ['Wi-Fi', 'Early check-in on request'],
    cancellationPolicy: 'Free cancellation until 24 hours before check-in.',
    rooms: [{ name: 'Deluxe Twin', type: 'Twin beds · Garden view', adults: 2, kids: 0, mealPlan: 'Room only', charges: 16500 }],
    charges: {
      roomCharges: 16500, extraAdultChildCharges: 900, propertyTaxes: 1980, serviceCharges: 825,
      promotion: { label: 'Repeat guest offer', amount: 405 },
    },
    timeline: [
      { label: 'Booking created', detail: 'TriponX app', at: '02:40 PM' },
      { label: 'Checked in', detail: 'Room 112 · Key issued', at: '01:15 PM' },
      { label: 'Checked out', detail: 'Invoice shared', at: '11:20 AM' },
    ],
  }),
  makeBooking({
    id: 'BK-2039', reference: 'TPX-6D1S7J', status: 'Cancelled', arrival: 8, nights: 3,
    guest: { name: 'Nisha Desai', email: 'nisha.desai@example.com', phone: '+91 98250 90331', city: 'Surat' },
    room: 'Heritage Suite', plan: 'Breakfast included', adults: 2, kids: 2, amount: 48900,
    payment: { mode: 'UPI', last4: '7742', state: 'Refunded' },
    channel: 'Q2T', source: 'OTA', gstInvoice: 'Not applicable', bookingType: 'Corporate',
    otaName: 'TriponX Q2T', pnr: 'PNR-6D1S7J', bookedOn: stamp(-10),
    inclusions: ['Breakfast for 4', 'Dinner for 2', 'Kids stay free'],
    cancellationPolicy: 'Non-refundable rate.',
    rooms: [{ name: 'Heritage Suite', type: 'King bed · Heritage view', adults: 2, kids: 2, mealPlan: 'Breakfast included', charges: 40000 }],
    charges: {
      roomCharges: 40000, extraAdultChildCharges: 3000, propertyTaxes: 4800, serviceCharges: 2000,
      promotion: { label: 'Corporate rate', amount: 900 },
    },
    timeline: [
      { label: 'Booking created', detail: 'TriponX app', at: '12:08 PM' },
      { label: 'Payment received', detail: 'UPI · ••7742', at: '12:10 PM' },
      { label: 'Cancelled', detail: 'Refund initiated', at: '05:36 PM' },
    ],
  }),
];

export const OTA_CONTACT = {
  name: 'TriponX',
  email: 'partners@triponx.com',
  phone: '+91 22 4890 2200',
  website: 'www.triponx.com',
};

const dateFormatter = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });
const weekdayFormatter = new Intl.DateTimeFormat('en-IN', { weekday: 'short' });

export const formatStayDate = (iso) => dateFormatter.format(new Date(`${iso}T12:00:00`));
export const formatWeekday = (iso) => weekdayFormatter.format(new Date(`${iso}T12:00:00`));
export const inr = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

export const BOOKING_STATUSES = ['All', 'Confirmed', 'Checked-in', 'Pending', 'Completed', 'Cancelled'];
export const CHANNELS = ['MyBiz', 'Q2T'];
export const BOOKING_SOURCES = ['All sources', 'Direct', 'OTA'];
export const PAYMENT_STATUSES = ['All', 'Paid', 'Awaiting', 'Refunded'];
export const GST_INVOICE_STATUSES = ['All', 'Generated', 'Pending', 'Not applicable'];
export const BOOKING_TYPES = ['All', 'New', 'Repeat', 'Corporate'];
