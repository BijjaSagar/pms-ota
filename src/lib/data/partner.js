// "List your property" (partner onboarding): page content + the lead-submission service.
// The UI only talks to `submitPartnerLead`, so swapping the demo store for a real
// API later (e.g. POST /partners/leads on the NestJS backend) is a one-function change.
import { isValidEmail, isValidPhone } from '../utils/validation.js';

// Two families of property, shown as the first choice in "Add a property".
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

export const PROPERTY_INFO_SECTIONS = [
  { id: 'basic', label: 'Basic info' },
  { id: 'location', label: 'Location' },
  { id: 'amenities', label: 'Amenities' },
  { id: 'rooms', label: 'Rooms' },
  { id: 'photos', label: 'Photos & videos' },
  { id: 'policies', label: 'Policies' },
  { id: 'legal', label: 'Financial & legal' },
];

export const PROPERTY_RATINGS = [1, 2, 3, 4, 5, 6, 7];

export const EMPTY_BASIC_INFO = {
  propertyName: '', rating: '', builtYear: '', bookingSince: '',
  channelManager: '', providerName: '', email: '', mobile: '', landline: '',
  emailVerified: false, mobileVerified: false,
};

// ---------- Property name: letters only (checked on Save; typing is never blocked) ----------
// Letters (any language) and spaces, plus the few marks real names use: . ' & -  (e.g. "Sam's Inn & Spa").
export const PROPERTY_NAME_MAX = 100;

export function propertyNameError(value) {
  const name = String(value ?? '').trim();
  if (!name) return 'Enter your property name.';
  if (/[^\p{L}\p{M}\s.'&-]/u.test(name)) return 'Property name can contain letters only.';
  if ((name.match(/\p{L}/gu) ?? []).length < 2) return 'Property name must have at least 2 letters.';
  return '';
}

// ---------- Mobile number: exactly 10 digits, India (checked on Save / Verify; typing is never blocked) ----------
export const MOBILE_LENGTH = 10;

// Only used to tidy a number stored as "+91 98765 43210" (profile / old draft) when the form loads.
export function sanitizeMobile(value, { keepLast = false } = {}) {
  let digits = String(value ?? '').replace(/\D/g, '');
  // Pasted with a country code / trunk zero: +91 98765 43210, 091…, 098765 43210 -> 9876543210
  if (digits.length === MOBILE_LENGTH + 2 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === MOBILE_LENGTH + 3 && digits.startsWith('091')) digits = digits.slice(3);
  else if (digits.length === MOBILE_LENGTH + 1 && digits.startsWith('0')) digits = digits.slice(1);
  return keepLast ? digits.slice(-MOBILE_LENGTH) : digits.slice(0, MOBILE_LENGTH);
}

export function mobileError(value) {
  const digits = String(value ?? '').trim();
  if (!digits) return 'Enter your mobile number.';
  if (!/^\d+$/.test(digits)) return 'Mobile number can contain digits only.';
  if (digits.length !== MOBILE_LENGTH) return `Mobile number must be ${MOBILE_LENGTH} digits.`;
  if (!/^[6-9]/.test(digits)) return 'Enter a valid mobile number. It should start with 6, 7, 8 or 9.';
  return '';
}

export function validateBasicInfo(info) {
  const errors = {};
  const year = new Date().getFullYear();
  const nameError = propertyNameError(info.propertyName);
  if (nameError) errors.propertyName = nameError;
  if (!PROPERTY_RATINGS.includes(Number(info.rating))) errors.rating = 'Choose a property rating.';
  if (!info.builtYear || Number(info.builtYear) < 1800 || Number(info.builtYear) > year) {
    errors.builtYear = 'Choose a valid built year.';
  }
  if (!info.bookingSince || Number(info.bookingSince) < 1800 || Number(info.bookingSince) > year) {
    errors.bookingSince = 'Choose a valid booking year.';
  }
  if (info.channelManager !== 'yes' && info.channelManager !== 'no') {
    errors.channelManager = 'Tell us whether you use a channel manager.';
  }
  if (!isValidEmail(info.email)) errors.email = 'Enter a valid email address.';
  else if (!info.emailVerified) errors.email = 'Verify your email address.';
  const mobileProblem = mobileError(info.mobile);
  if (mobileProblem) errors.mobile = mobileProblem;
  else if (!info.mobileVerified) errors.mobile = 'Verify your mobile number.';
  if (info.landline.trim() && !isValidPhone(info.landline)) errors.landline = 'Enter a valid landline number.';
  return errors;
}

export const EMPTY_LOCATION_INFO = {
  apartmentName: '', area: '', pincode: '', country: '', state: '', city: '', addressConfirmed: false,
  latitude: '', longitude: '',
};

export function validateLocationInfo(info) {
  const errors = {};
  if (info.apartmentName.trim().length < 2) errors.apartmentName = 'Enter the apartment or building name.';
  if (info.area.trim().length < 2) errors.area = 'Enter the area or locality.';
  if (!/^\d{6}$/.test(info.pincode)) errors.pincode = 'Enter a valid 6-digit pincode.';
  if (info.country.trim().length < 2) errors.country = 'Enter the country.';
  if (info.state.trim().length < 2) errors.state = 'Enter the state.';
  if (info.city.trim().length < 2) errors.city = 'Enter the city.';
  if (!info.addressConfirmed) errors.addressConfirmed = 'Confirm the address before continuing.';
  return errors;
}

const amenityCategory = (id, label, items) => ({
  id,
  label,
  items: items.map(([itemId, itemLabel]) => ({ id: itemId, label: itemLabel })),
});

export const AMENITY_CATEGORIES = [
  amenityCategory('mandatory', 'Mandatory', [
    ['front-desk', '24-hour front desk'],
    ['wifi', 'Free WiFi'],
    ['air-conditioning', 'Air conditioning'],
    ['parking', 'Parking'],
    ['housekeeping', 'Housekeeping'],
    ['cctv', 'CCTV surveillance'],
    ['fire-safety', 'Fire safety equipment'],
    ['power-backup', 'Power backup'],
  ]),
  amenityCategory('generalServices', 'General services', [
    ['laundry', 'Laundry'],
    ['dry-cleaning', 'Dry cleaning'],
    ['concierge', 'Concierge'],
    ['room-service', 'Room service'],
    ['wake-up-call', 'Wake-up call'],
    ['luggage-storage', 'Luggage storage'],
    ['currency-exchange', 'Currency exchange'],
    ['travel-desk', 'Travel desk'],
  ]),
  amenityCategory('security', 'Security', [
    ['security-guards', 'Security guards'],
    ['cctv', 'CCTV surveillance'],
    ['smoke-detectors', 'Smoke detectors'],
    ['first-aid', 'First aid kit'],
    ['safe-deposit', 'Safe deposit box'],
    ['access-control', 'Controlled access'],
    ['emergency-exit', 'Emergency exits'],
  ]),
  amenityCategory('basicFacilities', 'Basic facilities', [
    ['wifi', 'Free WiFi'],
    ['hot-water', 'Hot water'],
    ['elevator', 'Elevator'],
    ['power-backup', 'Power backup'],
    ['tea-coffee', 'Tea & coffee maker'],
    ['mini-fridge', 'Mini fridge'],
    ['work-desk', 'Work desk'],
    ['hair-dryer', 'Hair dryer'],
  ]),
  amenityCategory('outdoorSportsActivities', 'Outdoor sports & activities', [
    ['swimming-pool', 'Swimming pool'],
    ['tennis-court', 'Tennis court'],
    ['badminton-court', 'Badminton court'],
    ['basketball-court', 'Basketball court'],
    ['cricket-ground', 'Cricket ground'],
    ['cycling', 'Cycling'],
    ['jogging-track', 'Jogging track'],
  ]),
  amenityCategory('commonArea', 'Common area', [
    ['lobby', 'Lobby'],
    ['lounge', 'Lounge'],
    ['garden', 'Garden'],
    ['terrace', 'Terrace'],
    ['bbq-area', 'BBQ area'],
    ['shared-kitchen', 'Shared kitchen'],
    ['library', 'Library'],
  ]),
  amenityCategory('foodDrink', 'Food & drink', [
    ['restaurant', 'Restaurant'],
    ['bar', 'Bar'],
    ['cafe', 'Cafe'],
    ['breakfast', 'Breakfast included'],
    ['room-service', 'Room service'],
    ['banquet-hall', 'Banquet hall'],
    ['rooftop-dining', 'Rooftop dining'],
  ]),
  amenityCategory('businessCenterConference', 'Business center & conference', [
    ['business-center', 'Business center'],
    ['conference-room', 'Conference room'],
    ['meeting-rooms', 'Meeting rooms'],
    ['auditorium', 'Auditorium'],
    ['projector', 'Projector'],
    ['video-conferencing', 'Video conferencing'],
    ['printing', 'Printing & scanning'],
  ]),
  amenityCategory('transfer', 'Transfer', [
    ['airport-transfer', 'Airport transfer'],
    ['railway-transfer', 'Railway station transfer'],
    ['car-rental', 'Car rental'],
    ['taxi-service', 'Taxi service'],
    ['valet-parking', 'Valet parking'],
    ['shuttle-service', 'Shuttle service'],
    ['bike-rental', 'Bike rental'],
  ]),
  amenityCategory('entertainment', 'Entertainment', [
    ['live-music', 'Live music'],
    ['karaoke', 'Karaoke'],
    ['movie-night', 'Movie night'],
    ['game-room', 'Game room'],
    ['cultural-shows', 'Cultural shows'],
    ['stand-up-comedy', 'Stand-up comedy'],
    ['dj-nights', 'DJ nights'],
  ]),
  amenityCategory('shopping', 'Shopping', [
    ['gift-shop', 'Gift shop'],
    ['convenience-store', 'Convenience store'],
    ['souvenir-shop', 'Souvenir shop'],
    ['boutique', 'Boutique'],
    ['supermarket', 'Supermarket'],
    ['book-store', 'Book store'],
    ['shopping-arcade', 'Shopping arcade'],
  ]),
  amenityCategory('mediaTechnology', 'Media & technology', [
    ['wifi', 'Free WiFi'],
    ['smart-tv', 'Smart TV'],
    ['cable-tv', 'Cable TV'],
    ['streaming', 'Streaming services'],
    ['home-theater', 'Home theater'],
    ['sound-system', 'Sound system'],
    ['charging-stations', 'Charging stations'],
  ]),
  amenityCategory('paymentServices', 'Payment services', [
    ['credit-cards', 'Credit cards'],
    ['debit-cards', 'Debit cards'],
    ['upi', 'UPI'],
    ['net-banking', 'Net banking'],
    ['digital-wallets', 'Digital wallets'],
    ['cash', 'Cash'],
    ['contactless', 'Contactless payment'],
  ]),
  amenityCategory('familyKids', 'Family & kids', [
    ['kids-pool', "Kids' pool"],
    ['play-area', 'Kids play area'],
    ['kids-club', 'Kids club'],
    ['babysitting', 'Babysitting'],
    ['children-menu', "Children's menu"],
    ['cots-cribs', 'Cots & cribs'],
    ['family-rooms', 'Family rooms'],
  ]),
  amenityCategory('petEssentials', 'Pet essentials', [
    ['pet-friendly', 'Pet friendly'],
    ['pet-beds', 'Pet beds'],
    ['pet-bowls', 'Pet bowls'],
    ['pet-grooming', 'Pet grooming'],
    ['pet-sitting', 'Pet sitting'],
    ['pet-park', 'Pet park'],
    ['pet-first-aid', 'Pet first aid'],
  ]),
  amenityCategory('spaWellness', 'Spa & wellness', [
    ['spa', 'Spa'],
    ['massage', 'Massage'],
    ['sauna', 'Sauna'],
    ['steam-room', 'Steam room'],
    ['jacuzzi', 'Jacuzzi'],
    ['yoga-studio', 'Yoga studio'],
    ['fitness-center', 'Fitness center'],
  ]),
  amenityCategory('accessibility', 'Accessibility', [
    ['wheelchair-accessible', 'Wheelchair accessible'],
    ['accessible-rooms', 'Accessible rooms'],
    ['ramps', 'Ramps'],
    ['accessible-parking', 'Accessible parking'],
    ['accessible-bathrooms', 'Accessible bathrooms'],
    ['hearing-assistance', 'Hearing assistance'],
    ['grab-bars', 'Grab bars'],
  ]),
  amenityCategory('waterSportsActivities', 'Water sports & activities', [
    ['swimming-pool', 'Swimming pool'],
    ['water-park', 'Water park'],
    ['water-slides', 'Water slides'],
    ['snorkeling', 'Snorkeling'],
    ['kayaking', 'Kayaking'],
    ['jet-skiing', 'Jet skiing'],
    ['boat-rides', 'Boat rides'],
  ]),
  amenityCategory('indoorSportsActivities', 'Indoor sports & activities', [
    ['table-tennis', 'Table tennis'],
    ['badminton', 'Badminton'],
    ['squash', 'Squash court'],
    ['bowling', 'Bowling alley'],
    ['billiards', 'Billiards'],
    ['board-games', 'Board games'],
    ['indoor-gym', 'Indoor gym'],
  ]),
  amenityCategory('liveShowsMusicEntertainmentActivities', "Live shows, music & entertainment activities", [
    ['live-music', 'Live music'],
    ['dj-nights', 'DJ nights'],
    ['dance-shows', 'Dance shows'],
    ['theatre', 'Theatre'],
    ['stand-up-comedy', 'Stand-up comedy'],
    ['magic-shows', 'Magic shows'],
    ['open-mic', 'Open mic nights'],
  ]),
  amenityCategory('wildlifeSafariExploration', "Wildlife safari & wildlife exploration", [
    ['wildlife-safari', 'Wildlife safari'],
    ['jeep-safari', 'Jeep safari'],
    ['bird-watching', 'Bird watching'],
    ['nature-trails', 'Nature trails'],
    ['zoo-visits', 'Zoo visits'],
    ['aquarium', 'Aquarium'],
    ['forest-walks', 'Forest walks'],
  ]),
  amenityCategory('ridesSafariExcursionTours', "Rides, safari, excursion & tours", [
    ['guided-tours', 'Guided tours'],
    ['city-tours', 'City tours'],
    ['adventure-tours', 'Adventure tours'],
    ['jeep-rides', 'Jeep rides'],
    ['boat-rides', 'Boat rides'],
    ['cable-car', 'Cable car'],
    ['horse-riding', 'Horse riding'],
  ]),
  amenityCategory('natureWalksTreks', "Nature activities, walks & treks", [
    ['nature-walks', 'Nature walks'],
    ['guided-treks', 'Guided treks'],
    ['hiking-trails', 'Hiking trails'],
    ['sunrise-treks', 'Sunrise treks'],
    ['camping', 'Camping'],
    ['picnic-spots', 'Picnic spots'],
    ['stargazing', 'Stargazing'],
  ]),
  amenityCategory('handsOnWorkshopsInteractiveActivities', "Hands-on workshops & interactive activities", [
    ['cooking-classes', 'Cooking classes'],
    ['pottery', 'Pottery workshops'],
    ['painting', 'Painting classes'],
    ['crafts', 'Craft workshops'],
    ['photography', 'Photography workshops'],
    ['dance-classes', 'Dance classes'],
    ['cultural-workshops', 'Cultural workshops'],
  ]),
];

export function createEmptyAmenitiesInfo() {
  return Object.fromEntries(AMENITY_CATEGORIES.map(({ id }) => [id, {}]));
}

export function validateAmenitiesInfo(info = {}) {
  const errors = {};
  AMENITY_CATEGORIES.forEach(({ id, items }) => {
    const answers = info[id] ?? {};
    const missing = items
      .filter(({ id: itemId }) => answers[itemId] !== 'yes' && answers[itemId] !== 'no')
      .map(({ id: itemId }) => itemId);
    if (missing.length) errors[id] = missing;
  });
  return errors;
}

export const ROOM_TYPE_OPTIONS = [
  ['', 'Select room type'],
  ['apartment', 'Apartment'],
  ['standalone', 'Standalone'],
  ['deluxe', 'Deluxe'],
  ['hotel-room', 'Hotel room'],
  ['suite', 'Suite'],
  ['villa', 'Villa'],
  ['studio', 'Studio'],
  ['cottage', 'Cottage'],
  ['dormitory', 'Dormitory'],
  ['penthouse', 'Penthouse'],
];

export const ROOM_VIEW_OPTIONS = [
  ['', 'Select room view'],
  ['airport', 'Airport view'],
  ['beach', 'Beach view'],
  ['sea', 'Sea view'],
  ['lake', 'Lake view'],
  ['river', 'River view'],
  ['garden', 'Garden view'],
  ['city', 'City view'],
  ['mountain', 'Mountain view'],
  ['valley', 'Valley view'],
  ['courtyard', 'Courtyard view'],
  ['interior', 'Interior / no view'],
];

export const ROOM_SIZE_UNITS = [
  ['', 'Select unit'],
  ['sqft', 'Square feet'],
  ['sqm', 'Square meter'],
];

export const BED_TYPE_OPTIONS = [
  ['', 'Select bed type'],
  ['king', 'King bed'],
  ['queen', 'Queen bed'],
  ['twin', 'Twin beds'],
  ['single', 'Single bed'],
  ['double', 'Double bed'],
  ['sofa', 'Sofa bed'],
  ['bunk', 'Bunk bed'],
  ['king-sofa', 'King bed + sofa bed'],
];

export const MEAL_OPTIONS = [
  ['', 'Select meal option'],
  ['free-breakfast', 'Free breakfast'],
  ['free-lunch', 'Free lunch'],
  ['breakfast-lunch', 'Breakfast & lunch'],
  ['paid-breakfast', 'Paid breakfast'],
  ['no-meal', 'No meal included'],
];

export const ROOM_AMENITY_ITEMS = [
  ['private-balcony', 'Private balcony'],
  ['bathtub', 'Bathtub'],
  ['tea-coffee', 'Tea & coffee'],
  ['mini-bar', 'Mini bar'],
  ['private-terrace', 'Private terrace'],
  ['butler-service', 'Butler service'],
  ['lounge', 'Lounge'],
  ['rain-shower', 'Rain shower'],
  ['private-pool', 'Private pool'],
  ['kitchenette', 'Kitchenette'],
  ['full-kitchen', 'Full kitchen'],
  ['living-room', 'Living room'],
  ['bbq', 'BBQ'],
  ['balcony', 'Balcony'],
  ['yoga-mat', 'Yoga mat'],
  ['fireplace', 'Fireplace'],
].map(([id, label]) => ({ id, label }));

export const ROOM_CATEGORIES = [
  { id: 'roomType', label: 'Room type', fields: ['roomType', 'roomView', 'roomSize', 'roomSizeUnit', 'roomName', 'roomCount'] },
  { id: 'arrangementOccupancy', label: 'Arrangement & occupancy', fields: ['bedType', 'maxGuests'] },
  { id: 'bathroomDetails', label: 'Bathroom details', fields: ['bathroomCount'] },
  { id: 'mealRateInventory', label: 'Meal plan, rate & inventory details', fields: ['mealOption', 'pricePerGuest'] },
  { id: 'roomAmenities', label: 'Amenities for room', fields: ['amenities'] },
];

export const EMPTY_ROOMS_INFO = {
  roomType: '', roomView: '', roomSize: '', roomSizeUnit: 'sqft', roomName: '', roomCount: '',
  bedType: '', maxGuests: '', bathroomCount: '', mealOption: '', pricePerGuest: '',
  amenities: {},
};

export function validateRoomsInfo(info = {}) {
  const errors = {};
  const isOption = (options, value) => options.some(([option]) => option && option === value);
  const isPositiveInteger = (value) => value !== '' && Number.isInteger(Number(value)) && Number(value) > 0;

  if (!isOption(ROOM_TYPE_OPTIONS, info.roomType)) errors.roomType = 'Choose a room type.';
  if (!isOption(ROOM_VIEW_OPTIONS, info.roomView)) errors.roomView = 'Choose a room view.';
  if (!info.roomSize || !Number.isFinite(Number(info.roomSize)) || Number(info.roomSize) <= 0) {
    errors.roomSize = 'Enter the room size.';
  }
  if (!isOption(ROOM_SIZE_UNITS, info.roomSizeUnit)) errors.roomSizeUnit = 'Choose a size unit.';
  if (!info.roomName || info.roomName.trim().length < 2) errors.roomName = 'Enter the room name.';
  if (!isPositiveInteger(info.roomCount)) errors.roomCount = 'Enter the number of rooms.';
  if (!isOption(BED_TYPE_OPTIONS, info.bedType)) errors.bedType = 'Choose a bed type.';
  if (!isPositiveInteger(info.maxGuests)) errors.maxGuests = 'Enter the maximum number of guests.';
  if (!isPositiveInteger(info.bathroomCount)) errors.bathroomCount = 'Enter the number of bathrooms.';
  if (!isOption(MEAL_OPTIONS, info.mealOption)) errors.mealOption = 'Choose a meal option.';
  if (!info.pricePerGuest || !Number.isFinite(Number(info.pricePerGuest)) || Number(info.pricePerGuest) <= 0) {
    errors.pricePerGuest = 'Enter the base price per guest.';
  }

  const answers = info.amenities ?? {};
  const missing = ROOM_AMENITY_ITEMS
    .filter(({ id }) => answers[id] !== 'yes' && answers[id] !== 'no')
    .map(({ id }) => id);
  if (missing.length) errors.amenities = missing;
  return errors;
}

export const PHOTO_TAG_OPTIONS = [
  ['', 'Select tag'],
  ['exterior', 'Exterior'],
  ['lobby', 'Lobby'],
  ['bedroom', 'Bedroom'],
  ['bathroom', 'Bathroom'],
  ['pool', 'Pool'],
  ['restaurant', 'Restaurant'],
  ['view', 'View'],
  ['common-area', 'Common area'],
  ['activities', 'Activities'],
  ['other', 'Other'],
];

const PHOTO_TAG_VALUES = new Set(PHOTO_TAG_OPTIONS.map(([value]) => value).filter(Boolean));

export function createEmptyPhotosInfo() {
  return { coverImage: null, images: [], videos: [] };
}

export function normalizePhotosDraft(draft = {}) {
  const coverImage = draft.coverImage && typeof draft.coverImage === 'object'
    ? {
      id: draft.coverImage.id ?? 'cover',
      name: String(draft.coverImage.name ?? ''),
      url: typeof draft.coverImage.url === 'string' ? draft.coverImage.url : '',
      width: Number(draft.coverImage.width) || 0,
      height: Number(draft.coverImage.height) || 0,
      type: String(draft.coverImage.type ?? ''),
      sourceId: typeof draft.coverImage.sourceId === 'string' ? draft.coverImage.sourceId : '',
    }
    : null;
  const images = (Array.isArray(draft.images) ? draft.images : [])
    .filter((item) => item && typeof item === 'object' && item.name)
    .map((item, index) => ({
      id: item.id ?? `image-${index}`,
      name: String(item.name),
      url: typeof item.url === 'string' ? item.url : '',
      tag: PHOTO_TAG_VALUES.has(item.tag) ? item.tag : '',
      width: Number(item.width) || 0,
      height: Number(item.height) || 0,
      type: String(item.type ?? ''),
    }));
  const videos = (Array.isArray(draft.videos) ? draft.videos : [])
    .filter((item) => item && typeof item === 'object' && item.name)
    .map((item, index) => ({
      id: item.id ?? `video-${index}`,
      name: String(item.name),
      url: typeof item.url === 'string' ? item.url : '',
      type: String(item.type ?? ''),
    }));
  return { coverImage, images, videos };
}

export function sanitizePhotosForDraft(info = {}) {
  const withoutUrl = ({ url: _url, ...rest }) => rest;
  return {
    coverImage: info.coverImage ? withoutUrl(info.coverImage) : null,
    images: (Array.isArray(info.images) ? info.images : []).map(withoutUrl),
    videos: (Array.isArray(info.videos) ? info.videos : []).map(withoutUrl),
  };
}

export function validatePhotosInfo(info = {}) {
  const errors = {};
  const cover = info.coverImage;
  if (!cover?.name) errors.coverImage = 'Upload a landscape cover image.';
  else if (!(Number(cover.width) > Number(cover.height))) {
    errors.coverImage = 'Cover image must be landscape — wider than it is tall.';
  }

  const images = Array.isArray(info.images) ? info.images : [];
  const untaggedIndex = images.findIndex((image) => !PHOTO_TAG_VALUES.has(image?.tag));
  if (untaggedIndex >= 0) errors[`image-${untaggedIndex}`] = 'Choose a tag for this image.';

  const videos = Array.isArray(info.videos) ? info.videos : [];
  const badVideoIndex = videos.findIndex((video) => !video?.name);
  if (badVideoIndex >= 0) errors[`video-${badVideoIndex}`] = 'Video file is missing.';

  return errors;
}

export const POLICY_CATEGORIES = [
  { id: 'checkInOutTime', label: 'Check-in / check-out time', fields: ['checkInTime', 'checkOutTime'] },
  { id: 'cancellation', label: 'Cancellation policy', fields: ['cancellationPolicy'] },
  { id: 'propertyRules', label: 'Property rules', fields: ['unmarriedCouples', 'below18', 'maleGroupOnly', 'identityProofs'] },
  { id: 'restrictions', label: 'Property restrictions', fields: ['smokingAllowed', 'privateParties', 'wheelchairAccess', 'outsideVisitors'] },
  { id: 'petPolicy', label: 'Pet policy', fields: ['petLivingOnProperty', 'petsAllowed'] },
  { id: 'checkInOutPolicy', label: 'Check-in / check-out policy', fields: ['has24HourPolicy'] },
  { id: 'infantPolicy', label: 'Infant policy', fields: ['includeInfant', 'infantFoodProvided', 'infantFoodItems'] },
  { id: 'extraBedInclusion', label: 'Extra bed inclusion', fields: ['extraBedIncluded'] },
  { id: 'extraBedPolicy', label: 'Extra bed policy', fields: ['extraBedForAdults', 'adultExtraBedType', 'extraBedForKids'] },
  { id: 'mealRackPrices', label: 'Meal rack prices', fields: ['breakfastPrice', 'lunchPrice', 'dinnerPrice'] },
];

export const POLICY_CONDITIONAL_FIELDS = {
  infantFoodProvided: (info) => info.includeInfant === 'yes',
  infantFoodItems: (info) => info.includeInfant === 'yes' && info.infantFoodProvided === 'yes',
  adultExtraBedType: (info) => info.extraBedForAdults === 'yes',
};

export const POLICY_YES_NO_OPTIONS = [['yes', 'Yes'], ['no', 'No']];

export const POLICY_TIME_OPTIONS = [
  ['', 'Select time'],
  ...Array.from({ length: 48 }, (_, index) => {
    const hours = Math.floor(index / 2);
    const minutes = index % 2 === 0 ? '00' : '30';
    const value = `${String(hours).padStart(2, '0')}:${minutes}`;
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    return [value, `${displayHour}:${minutes} ${hours >= 12 ? 'PM' : 'AM'}`];
  }),
];

export const CANCELLATION_OPTIONS = [
  ['before-checkin', 'Free cancellation before check-in'],
  ['24-hours', 'Free cancellation till 24 hr before check-in'],
  ['48-hours', 'Free cancellation till 48 hr before check-in'],
  ['72-hours', 'Free cancellation till 72 hours before check-in'],
];

export const IDENTITY_PROOF_OPTIONS = [
  ['aadhaar', 'Aadhaar card'],
  ['pan', 'PAN card'],
  ['passport', 'Passport'],
  ['driving-licence', "Driver's licence"],
  ['voter-id', 'Voter ID'],
  ['other', 'Other'],
];

export const EXTRA_BED_TYPE_OPTIONS = [
  ['', 'Select extra bed type'],
  ['cot', 'Cot'],
  ['mattress', 'Mattress'],
  ['sofa-bed', 'Sofa bed'],
  ['folding-bed', 'Folding bed'],
  ['other', 'Other'],
];

export const EMPTY_POLICIES_INFO = {
  checkInTime: '',
  checkOutTime: '',
  cancellationPolicy: '',
  unmarriedCouples: '',
  below18: '',
  maleGroupOnly: '',
  identityProofs: [],
  smokingAllowed: '',
  privateParties: '',
  wheelchairAccess: '',
  outsideVisitors: '',
  petLivingOnProperty: '',
  petsAllowed: '',
  has24HourPolicy: '',
  includeInfant: '',
  infantFoodProvided: '',
  infantFoodItems: '',
  extraBedIncluded: '',
  extraBedForAdults: '',
  adultExtraBedType: '',
  extraBedForKids: '',
  breakfastPrice: '',
  lunchPrice: '',
  dinnerPrice: '',
};

const POLICY_YES_NO_VALUES = new Set(POLICY_YES_NO_OPTIONS.map(([value]) => value));
const POLICY_CANCELLATION_VALUES = new Set(CANCELLATION_OPTIONS.map(([value]) => value));
const POLICY_IDENTITY_PROOF_VALUES = new Set(IDENTITY_PROOF_OPTIONS.map(([value]) => value));
const POLICY_EXTRA_BED_TYPE_VALUES = new Set(EXTRA_BED_TYPE_OPTIONS.map(([value]) => value).filter(Boolean));
const TIME_VALUE_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const asPolicyYesNo = (value) => (POLICY_YES_NO_VALUES.has(value) ? value : '');
const asPolicyTime = (value) => (TIME_VALUE_PATTERN.test(String(value ?? '')) ? String(value) : '');
const asPolicyPrice = (value) => {
  const text = String(value ?? '').trim();
  if (!text) return '';
  return Number.isFinite(Number(text)) && Number(text) >= 0 ? text : '';
};

const POLICY_YES_NO_FIELDS = [
  'unmarriedCouples', 'below18', 'maleGroupOnly', 'smokingAllowed', 'privateParties',
  'wheelchairAccess', 'outsideVisitors', 'petLivingOnProperty', 'petsAllowed', 'has24HourPolicy',
  'includeInfant', 'infantFoodProvided', 'extraBedIncluded', 'extraBedForAdults', 'extraBedForKids',
];

export function createEmptyPoliciesInfo() {
  return { ...EMPTY_POLICIES_INFO, identityProofs: [] };
}

export function normalizePoliciesDraft(draft = {}) {
  const source = draft && typeof draft === 'object' && !Array.isArray(draft) ? draft : {};
  const merged = { ...createEmptyPoliciesInfo(), ...source };
  const info = { ...merged };

  POLICY_YES_NO_FIELDS.forEach((field) => { info[field] = asPolicyYesNo(merged[field]); });
  ['checkInTime', 'checkOutTime'].forEach((field) => { info[field] = asPolicyTime(merged[field]); });
  ['breakfastPrice', 'lunchPrice', 'dinnerPrice'].forEach((field) => { info[field] = asPolicyPrice(merged[field]); });
  info.cancellationPolicy = POLICY_CANCELLATION_VALUES.has(merged.cancellationPolicy) ? merged.cancellationPolicy : '';
  info.adultExtraBedType = POLICY_EXTRA_BED_TYPE_VALUES.has(merged.adultExtraBedType) ? merged.adultExtraBedType : '';
  info.infantFoodItems = String(merged.infantFoodItems ?? '').trim();
  info.identityProofs = Array.isArray(merged.identityProofs)
    ? [...new Set(merged.identityProofs.filter((value) => POLICY_IDENTITY_PROOF_VALUES.has(value)))]
    : [];

  if (!POLICY_CONDITIONAL_FIELDS.infantFoodProvided(info)) {
    info.infantFoodProvided = '';
    info.infantFoodItems = '';
  }
  if (!POLICY_CONDITIONAL_FIELDS.infantFoodItems(info)) info.infantFoodItems = '';
  if (!POLICY_CONDITIONAL_FIELDS.adultExtraBedType(info)) info.adultExtraBedType = '';

  return info;
}

export function validatePoliciesInfo(info = {}) {
  const errors = {};
  if (!TIME_VALUE_PATTERN.test(String(info.checkInTime ?? ''))) errors.checkInTime = 'Enter a check-in time.';
  if (!TIME_VALUE_PATTERN.test(String(info.checkOutTime ?? ''))) errors.checkOutTime = 'Enter a check-out time.';
  if (!POLICY_CANCELLATION_VALUES.has(info.cancellationPolicy)) errors.cancellationPolicy = 'Choose a cancellation policy.';

  const requireYesNo = (field, label) => {
    if (!POLICY_YES_NO_VALUES.has(info[field])) errors[field] = `Choose Yes or No for ${label}.`;
  };
  requireYesNo('unmarriedCouples', 'unmarried couples');
  requireYesNo('below18', 'guests below 18');
  requireYesNo('maleGroupOnly', 'male-only groups');
  if (!Array.isArray(info.identityProofs) || info.identityProofs.length === 0) {
    errors.identityProofs = 'Select at least one acceptable identity proof.';
  }
  requireYesNo('smokingAllowed', 'smoking');
  requireYesNo('privateParties', 'private parties');
  requireYesNo('wheelchairAccess', 'guests who use a wheelchair');
  requireYesNo('outsideVisitors', 'outside visitors');
  requireYesNo('petLivingOnProperty', 'a pet living on the property');
  requireYesNo('petsAllowed', 'pets');
  requireYesNo('has24HourPolicy', 'the 24-hour policy');
  requireYesNo('includeInfant', 'including one infant per room');
  requireYesNo('extraBedIncluded', 'extra bed inclusion');
  requireYesNo('extraBedForAdults', 'extra beds for adults');
  requireYesNo('extraBedForKids', 'extra beds for kids');

  if (POLICY_CONDITIONAL_FIELDS.infantFoodProvided(info)) requireYesNo('infantFoodProvided', 'complimentary infant food');
  if (POLICY_CONDITIONAL_FIELDS.infantFoodItems(info) && !String(info.infantFoodItems ?? '').trim()) {
    errors.infantFoodItems = 'Mention the complimentary food items.';
  }
  if (POLICY_CONDITIONAL_FIELDS.adultExtraBedType(info) && !POLICY_EXTRA_BED_TYPE_VALUES.has(info.adultExtraBedType)) {
    errors.adultExtraBedType = 'Choose the extra bed type for adults.';
  }

  const requirePrice = (field, label) => {
    const value = Number(info[field]);
    if (!String(info[field] ?? '').trim() || !Number.isFinite(value) || value <= 0) {
      errors[field] = `Enter the ${label} rack price.`;
    }
  };
  requirePrice('breakfastPrice', 'breakfast');
  requirePrice('lunchPrice', 'lunch');
  requirePrice('dinnerPrice', 'dinner');

  return errors;
}

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
const DRAFT_KEY = 'triponx.propertyDrafts.v1';
// Keep plenty: these records are the partner's "Under review" list, so dropping old ones would hide them.
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

const draftKey = (ownerId, type) => `${ownerId}::${type}`;

export function getPropertyDraft(ownerId, type) {
  if (!ownerId || !type) return { basic: {} };
  try {
    const all = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '{}');
    if (!all || typeof all !== 'object' || Array.isArray(all)) return { basic: {} };
    const saved = all[draftKey(ownerId, type)];
    return saved?.basic && typeof saved.basic === 'object' && !Array.isArray(saved.basic) ? saved : { basic: {} };
  } catch {
    return { basic: {} };
  }
}

export function savePropertyDraft(ownerId, type, draft) {
  if (!ownerId || !type) throw new Error('Sign in required to save a draft.');
  let all = {};
  try {
    const parsed = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '{}');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) all = parsed;
  } catch {
    all = {};
  }
  all[draftKey(ownerId, type)] = draft;
  localStorage.setItem(DRAFT_KEY, JSON.stringify(all));
}
