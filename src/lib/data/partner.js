// Partner Hub: page content, and the lists and form checks of the "Add a property" wizard.
// The checks follow the API's rules (pms-ota-backend: partner/properties/dto/requests.dto.ts).
import { isValidEmail, isValidPhone } from '../utils/validation.js';

export const PROPERTY_INFO_SECTIONS = [
  { id: 'basic', label: 'Basic info' },
  { id: 'location', label: 'Location' },
  { id: 'amenities', label: 'Amenities' },
  { id: 'rooms', label: 'Rooms' },
  { id: 'photos', label: 'Photos & videos' },
  { id: 'policies', label: 'Policies' },
  { id: 'legal', label: 'Financial & legal' },
];

export const TEXT_MAX = { place: 150, region: 80, roomName: 100, provider: 100, infantFood: 300 };
const MAX_PRICE = 10_000_000;
const MAX_ROOM_SIZE = 1_000_000;
const MAX_ROOM_COUNT = 5000;
const MAX_PER_ROOM = 100;

// A plain number with at most 2 decimals, from `min` to `max`.
const isDecimal = (value, min, max) => /^\d+(\.\d{1,2})?$/.test(String(value ?? '').trim())
  && Number(value) >= min && Number(value) <= max;
const isWhole = (value, max) => /^\d+$/.test(String(value ?? '').trim()) && Number(value) >= 1 && Number(value) <= max;

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
  if (/^(\d)\1{9}$/.test(digits)) return 'Enter a valid mobile number.';
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
  } else if (!errors.builtYear && Number(info.bookingSince) < Number(info.builtYear)) {
    errors.bookingSince = 'This cannot be before the built year.';
  }
  if (info.channelManager !== 'yes' && info.channelManager !== 'no') {
    errors.channelManager = 'Tell us whether you use a channel manager.';
  }
  if (!isValidEmail(info.email)) errors.email = 'Enter a valid email address.';
  else if (!info.emailVerified) errors.email = 'Verify your email address.';
  const mobileProblem = mobileError(info.mobile);
  if (mobileProblem) errors.mobile = mobileProblem;
  else if (!info.mobileVerified) errors.mobile = 'Verify your mobile number.';
  if (info.landline.trim() && !(/^[+\d\s()-]{7,25}$/.test(info.landline.trim()) && isValidPhone(info.landline))) errors.landline = 'Enter a valid landline number.';
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
  if (!/^[1-9]\d{5}$/.test(info.pincode.trim())) errors.pincode = 'Enter a valid 6-digit pincode.';
  if (info.country.trim().length < 2) errors.country = 'Enter the country.';
  if (info.state.trim().length < 2) errors.state = 'Enter the state.';
  if (info.city.trim().length < 2) errors.city = 'Enter the city.';
  if (!info.addressConfirmed) errors.addressConfirmed = 'Confirm the address before continuing.';
  return errors;
}

// ---------- Lists from the API (GET /partner/masters) ----------
// Filled by applyMasters() before the wizard renders (see loadMasters in lib/api/properties.js).
// [value, label]; select lists start with a '' placeholder.
export let AMENITY_CATEGORIES = [];   // [{ id, label, items: [{ id, label }] }]
export let ROOM_AMENITY_ITEMS = [];   // [{ id, label }]
export let ROOM_TYPE_OPTIONS = [];
export let ROOM_VIEW_OPTIONS = [];
export let ROOM_SIZE_UNITS = [];
export let BED_TYPE_OPTIONS = [];
export let MEAL_OPTIONS = [];
export let PHOTO_TAG_OPTIONS = [];
export let CANCELLATION_OPTIONS = [];
export let IDENTITY_PROOF_OPTIONS = [];
export let EXTRA_BED_TYPE_OPTIONS = [];
/** Every master list from the server, by group: { cuisine: [[code, label]], … }. */
export let MASTER_LISTS = {};
/** Label of a master code, e.g. masterLabel('mealOption', 'breakfast'). */
export const masterLabel = (group, code) => (MASTER_LISTS[group] ?? []).find(([value]) => value === code)?.[1] ?? code ?? '';
let PHOTO_TAG_VALUES = new Set();
let POLICY_CANCELLATION_VALUES = new Set();
let POLICY_IDENTITY_PROOF_VALUES = new Set();
let POLICY_EXTRA_BED_TYPE_VALUES = new Set();

export function applyMasters({ amenityCategories, roomAmenities, options }) {
  const list = (group) => (options[group] ?? []).map(({ code, label }) => [code, label]);
  const select = (group, placeholder) => [['', placeholder], ...list(group)];
  const values = (group) => new Set(list(group).map(([value]) => value));
  const item = ({ code, label }) => ({ id: code, label });
  MASTER_LISTS = Object.fromEntries(Object.keys(options).map((group) => [group, list(group)]));
  AMENITY_CATEGORIES = amenityCategories.map((c) => ({ ...item(c), items: c.items.map(item) }));
  ROOM_AMENITY_ITEMS = roomAmenities.map(item);
  ROOM_TYPE_OPTIONS = select('roomType', 'Select room type');
  ROOM_VIEW_OPTIONS = select('roomView', 'Select room view');
  ROOM_SIZE_UNITS = select('roomSizeUnit', 'Select unit');
  BED_TYPE_OPTIONS = select('bedType', 'Select bed type');
  MEAL_OPTIONS = select('mealOption', 'Select meal option');
  PHOTO_TAG_OPTIONS = select('photoTag', 'Select tag');
  CANCELLATION_OPTIONS = list('cancellationPolicy');
  IDENTITY_PROOF_OPTIONS = list('identityProof');
  EXTRA_BED_TYPE_OPTIONS = select('extraBedType', 'Select extra bed type');
  PHOTO_TAG_VALUES = values('photoTag');
  POLICY_CANCELLATION_VALUES = values('cancellationPolicy');
  POLICY_IDENTITY_PROOF_VALUES = values('identityProof');
  POLICY_EXTRA_BED_TYPE_VALUES = values('extraBedType');
}

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

  if (!isOption(ROOM_TYPE_OPTIONS, info.roomType)) errors.roomType = 'Choose a room type.';
  if (!isOption(ROOM_VIEW_OPTIONS, info.roomView)) errors.roomView = 'Choose a room view.';
  if (!isDecimal(info.roomSize, 1, MAX_ROOM_SIZE)) errors.roomSize = 'Enter a valid room size (at least 1, up to 2 decimals).';
  if (!isOption(ROOM_SIZE_UNITS, info.roomSizeUnit)) errors.roomSizeUnit = 'Choose a size unit.';
  if (!info.roomName || info.roomName.trim().length < 2) errors.roomName = 'Enter the room name.';
  if (!isWhole(info.roomCount, MAX_ROOM_COUNT)) errors.roomCount = 'Enter the number of rooms (1 to 5000).';
  if (!isOption(BED_TYPE_OPTIONS, info.bedType)) errors.bedType = 'Choose a bed type.';
  if (!isWhole(info.maxGuests, MAX_PER_ROOM)) errors.maxGuests = 'Enter the maximum number of guests (1 to 100).';
  if (!isWhole(info.bathroomCount, MAX_PER_ROOM)) errors.bathroomCount = 'Enter the number of bathrooms (1 to 100).';
  if (!isOption(MEAL_OPTIONS, info.mealOption)) errors.mealOption = 'Choose a meal option.';
  if (!isDecimal(info.pricePerGuest, 1, MAX_PRICE)) errors.pricePerGuest = 'Enter a valid price, from ₹1 to ₹1 crore.';

  const answers = info.amenities ?? {};
  const missing = ROOM_AMENITY_ITEMS
    .filter(({ id }) => answers[id] !== 'yes' && answers[id] !== 'no')
    .map(({ id }) => id);
  if (missing.length) errors.amenities = missing;
  return errors;
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
const TIME_VALUE_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const asPolicyYesNo = (value) => (POLICY_YES_NO_VALUES.has(value) ? value : '');
const asPolicyTime = (value) => (TIME_VALUE_PATTERN.test(String(value ?? '')) ? String(value) : '');
const asPolicyPrice = (value) => {
  const text = String(value ?? '').trim();
  if (!text) return '';
  return Number.isFinite(Number(text)) && Number(text) >= 0 ? text : '';
};

export const POLICY_YES_NO_FIELDS = [
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
    if (!isDecimal(info[field], 1, MAX_PRICE)) errors[field] = `Enter a valid ${label} rack price, from ₹1 to ₹1 crore.`;
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
