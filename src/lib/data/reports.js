export const REPORT_CATEGORIES = [
  { id: 'inventory', label: 'Inventory', description: 'Room inventory and availability reports.' },
  { id: 'rates', label: 'Rates', description: 'Room pricing and rate-related reports.' },
  { id: 'offers', label: 'Offers', description: 'Promotional offer reports.' },
  { id: 'bookings', label: 'Bookings', description: 'Booking-related reports.' },
  { id: 'plb', label: 'PLB', description: 'PLB-related reports.' },
  { id: 'vdi', label: 'VDI', description: 'VDI-related reports.' },
  { id: 'invoices', label: 'Invoices', description: 'Invoice reports.' },
  { id: 'advance-payment', label: 'Advance Payment', description: 'Advance payment reports.' },
];

export const ROOM_TYPE_OPTIONS = [
  'Family Studio',
  'Deluxe King',
  'Premier Room',
  'Executive Suite',
];

export const REPORT_TYPE_OPTIONS = [
  'All',
  'Availability',
  'Sold rooms',
  'Blocked inventory',
];

export const INITIAL_REPORT_FILTERS = {
  startDate: '',
  endDate: '',
  roomType: 'Family Studio',
  reportType: 'All',
};

export const REPORT_COLUMNS_BY_CATEGORY = {
  inventory: [
    { key: 'date', label: 'Date' },
    { key: 'roomType', label: 'Room Type' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'sold', label: 'Sold' },
    { key: 'blocked', label: 'Blocked' },
    { key: 'available', label: 'Available' },
  ],
  rates: [
    { key: 'date', label: 'Date' },
    { key: 'roomType', label: 'Room Type' },
    { key: 'plan', label: 'Plan' },
    { key: 'baseRate', label: 'Base Rate' },
    { key: 'weekendRate', label: 'Weekend Rate' },
    { key: 'available', label: 'Available' },
  ],
  offers: [
    { key: 'offerName', label: 'Offer Name' },
    { key: 'roomType', label: 'Room Type' },
    { key: 'bookingValidity', label: 'Booking Validity' },
    { key: 'checkinValidity', label: 'Checkin Validity' },
    { key: 'status', label: 'Status' },
    { key: 'offerInfo', label: 'Offer Info' },
  ],
  bookings: [
    { key: 'bookingId', label: 'Booking ID' },
    { key: 'guest', label: 'Guest' },
    { key: 'roomType', label: 'Room Type' },
    { key: 'checkIn', label: 'Check-in' },
    { key: 'checkOut', label: 'Check-out' },
    { key: 'status', label: 'Status' },
    { key: 'amount', label: 'Amount' },
  ],
  plb: [
    { key: 'date', label: 'Date' },
    { key: 'roomType', label: 'Room Type' },
    { key: 'plan', label: 'Plan' },
    { key: 'rooms', label: 'PLB Rooms' },
    { key: 'released', label: 'Released Rooms' },
    { key: 'amount', label: 'Amount' },
  ],
  vdi: [
    { key: 'date', label: 'Date' },
    { key: 'roomType', label: 'Room Type' },
    { key: 'directBookings', label: 'Direct Bookings' },
    { key: 'vdiBookings', label: 'VDI Bookings' },
    { key: 'commission', label: 'Commission' },
    { key: 'netRevenue', label: 'Net Revenue' },
  ],
  invoices: [
    { key: 'invoiceNo', label: 'Invoice No.' },
    { key: 'date', label: 'Date' },
    { key: 'guest', label: 'Guest' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
    { key: 'download', label: 'Download' },
  ],
  'advance-payment': [
    { key: 'paymentId', label: 'Payment ID' },
    { key: 'date', label: 'Date' },
    { key: 'guest', label: 'Guest' },
    { key: 'roomType', label: 'Room Type' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
    { key: 'method', label: 'Method' },
  ],
};

export const reportColumnsFor = (categoryId) => REPORT_COLUMNS_BY_CATEGORY[categoryId] ?? REPORT_COLUMNS_BY_CATEGORY.inventory;

export const reportCategoryById = (id) => REPORT_CATEGORIES.find((category) => category.id === id) ?? REPORT_CATEGORIES[0];

export function validateReportFilters(filters) {
  const errors = {};
  if (!filters.startDate) errors.startDate = 'Select a start date.';
  if (!filters.endDate) errors.endDate = 'Select an end date.';
  if (filters.startDate && filters.endDate && filters.endDate < filters.startDate) {
    errors.endDate = 'End date must be on or after the start date.';
  }
  return errors;
}
