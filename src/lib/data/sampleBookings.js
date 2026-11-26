// Shared helpers and filter options for the Partner Hub Bookings tab, vouchers and payments.
// Bookings themselves come from the API (lib/api/bookings.js) - there is no sample booking data any more.

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

export const BOOKING_STATUSES = ['All', 'Confirmed', 'Pending', 'Checked-in', 'Completed', 'No-show', 'Cancelled'];
/** Where bookings come from today; more channels (MyBiz, Q2T …) join this list when they are connected. */
export const CHANNELS = ['TriponX'];
export const BOOKING_SOURCES = ['All sources', 'Direct', 'OTA'];
export const PAYMENT_STATUSES = ['All', 'Paid', 'Awaiting', 'Refunded'];
export const GST_INVOICE_STATUSES = ['All', 'Generated', 'Pending', 'Not applicable'];
export const BOOKING_TYPES = ['All', 'New', 'Repeat', 'Corporate'];
