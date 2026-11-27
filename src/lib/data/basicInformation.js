export const BASIC_INFO_TABS = [
  { id: 'details', label: 'Property Details' },
  { id: 'contact', label: 'Property Contact Details' },
  { id: 'reach', label: 'How to Reach' },
];

export const PROPERTY_TYPE_OPTIONS = [
  ['', 'Select property type'],
  ['Hotel', 'Hotel'],
  ['Resort', 'Resort'],
  ['Homestay', 'Homestay'],
  ['Apartment', 'Apartment'],
  ['Guest House', 'Guest House'],
  ['Villa', 'Villa'],
  ['Hostel', 'Hostel'],
];

export const STAR_RATING_OPTIONS = [
  ['', 'Select star rating'],
  ...[1, 2, 3, 4, 5].map((value) => [String(value), `${value} Star`]),
];

export const HOTEL_CHAIN_OPTIONS = [
  ['', 'Select hotel chain'],
  ['Independent', 'Independent property'],
  ['Taj Hotels', 'Taj Hotels'],
  ['Oberoi Hotels', 'Oberoi Hotels'],
  ['ITC Hotels', 'ITC Hotels'],
  ['Marriott', 'Marriott'],
  ['Hilton', 'Hilton'],
  ['Hyatt', 'Hyatt'],
  ['Accor', 'Accor'],
  ['Other', 'Other chain'],
];

export const CURRENCY_OPTIONS = [
  ['INR', 'INR — Indian Rupee'],
  ['USD', 'USD — US Dollar'],
  ['EUR', 'EUR — Euro'],
  ['GBP', 'GBP — British Pound'],
  ['AED', 'AED — UAE Dirham'],
];

export const TIMEZONE_OPTIONS = [
  ['Asia/Kolkata', 'Asia/Kolkata (IST)'],
  ['Asia/Dubai', 'Asia/Dubai (GST)'],
  ['Asia/Singapore', 'Asia/Singapore (SGT)'],
  ['Europe/London', 'Europe/London (GMT/BST)'],
  ['America/New_York', 'America/New_York (ET)'],
];

export const VEHICLE_TYPE_OPTIONS = [
  { id: 'hatchback-sedan', label: 'Hatchback / Sedan', detail: 'Standard car with low ground clearance.' },
  { id: 'suv', label: 'SUV', detail: 'High ground clearance, suitable for rough roads, 6–7 seater.' },
  { id: 'tempo-traveller', label: 'Tempo Traveller', detail: 'Group vehicle, 9–12 seater.' },
  { id: 'mini-bus', label: 'Mini Bus', detail: 'Large group vehicle, 15+ seater.' },
];

export const SAMPLE_DIRECTIONS = `From the highway, take the city-centre exit and continue for 3 km. Turn left at the retail complex, then take the second right onto the hotel access road. Look for the green signboard and the large gate. The property is 400 metres after the petrol pump. Guest parking is available inside the gate on the left.`;

export const EMPTY_BASIC_EXTRAS = {
  displayName: '',
  description: '',
  propertyType: '',
  hotelChainName: '',
  restaurants: '',
  floors: '',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  twentyFourHourCheckIn: false,
  phoneList: '',
  websiteList: '',
  emailList: '',
  customerCareNumber: '',
  vehicleAccess: '',
  vehicleTypeMode: '',
  vehicleTypes: [],
  directions: '',
};
