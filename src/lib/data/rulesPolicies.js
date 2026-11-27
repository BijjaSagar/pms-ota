import { MEAL_PLAN_PRESETS, ROOM_CATEGORY_PRESETS } from './inclusionsPackages.js';
import { RATEPLAN_PRESETS, defaultRateplansFor } from './roomsRateplans.js';

export const RULES_TABS = [
  { id: 'cancellation', label: 'Cancellation Policies', shortLabel: 'Cancellation', description: 'Refund rules, timelines and rate-plan mapping.' },
  { id: 'property-rules', label: 'Property Rules', shortLabel: 'Property Rules', description: 'Guest eligibility, identity, pets and stay rules.' },
  { id: 'notices', label: 'Notices', shortLabel: 'Notices', description: 'Customer announcements and stay-date notices.' },
  { id: 'child-age', label: 'Child Age Policy', shortLabel: 'Child Age', description: 'Free, paid and adult age bands for children.' },
  { id: 'post-booking', label: 'Post Booking Policies', shortLabel: 'Post Booking', description: 'Changes guests can make after booking.' },
];

export const YES_NO_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

export const NOTICE_CATEGORIES = [
  'Property update',
  'Renovation',
  'Service update',
  'Weather',
  'Festival',
  'Safety',
  'Other',
];

export const ASSOCIATED_WITH_OPTIONS = [
  'Property',
  'All rooms',
  ...ROOM_CATEGORY_PRESETS.map((room) => room.label),
  'Cult’s Kitchen',
];

export const IDENTITY_PROOF_FALLBACK = [
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'passport', label: 'Passport' },
  { value: 'driving-licence', label: 'Driving Licence' },
  { value: 'voter-id', label: 'Voter ID' },
  { value: 'pan-card', label: 'PAN Card' },
];

export const EXTRA_BED_TYPE_FALLBACK = [
  { value: 'mattress', label: 'Mattress' },
  { value: 'folding-bed', label: 'Folding bed' },
  { value: 'sofa-bed', label: 'Sofa bed' },
];

export const CANCELLATION_POLICY_FALLBACK = [
  { value: 'free-cancellation', label: 'Free Cancellation' },
  { value: 'non-refundable', label: 'Non-Refundable' },
  { value: 'partial-refund', label: 'Partial Refund' },
];

export const PET_TYPES = ['Dogs & Cats', 'Dogs only', 'Cats only', 'Other pets'];
export const PET_CHARGE_FREQUENCIES = ['Per day', 'Per night', 'Per stay'];
export const RESTRICTED_AREA_OPTIONS = ['Guest rooms', 'Restaurant', 'Pool', 'Lobby', 'Terrace'];
export const INFANT_FOOD_OPTIONS = ['Warm milk', 'Cereal', 'Fruit puree', 'Hot water'];

export const PROPERTY_RULE_SECTIONS = [
  { id: 'guest-profile', label: 'Guest Profile', fields: ['unmarriedCouples', 'below18', 'maleGroupOnly'] },
  { id: 'identity', label: 'Acceptable Identity Proofs', fields: ['identityProofs', 'sameCityIdsAccepted'] },
  { id: 'restrictions', label: 'Property Restrictions', fields: ['smokingAllowed', 'privateParties', 'wheelchairAccess', 'outsideVisitors'] },
  { id: 'pet', label: 'Pet Policy', fields: ['petLivingOnProperty', 'petsAllowed', 'petFoodAvailable', 'petTypes', 'petChargesEnabled', 'petChargeAmount', 'petChargeFrequency', 'restrictedAreas', 'leashRequired', 'maxPets'] },
  { id: 'checkin', label: 'Check-in & Checkout', fields: ['has24HourPolicy'] },
  { id: 'infant', label: 'Infant Policy', fields: ['includeInfant', 'infantCountedInOccupancy', 'infantFoodProvided', 'infantFoodItems'] },
  { id: 'extra-bed-inclusion', label: 'Extra Bed Inclusion', fields: ['extraBedIncluded', 'extraBedInclusionTypes'] },
  { id: 'extra-bed', label: 'Extra Bed Policies', fields: ['extraBedForAdults', 'adultExtraBedType', 'adultMattressCharge', 'extraBedForKids', 'childMattressCharge'] },
];

export const FAQ_CONTENT = {
  cancellation: [
    { question: 'How does a new cancellation policy work?', answer: 'Create a policy, add refund conditions, map rate plans, and save. The policy can then be assigned to eligible room rates.' },
    { question: 'How does policy deletion work?', answer: 'Deleting removes the policy from this list and unmaps its rate plans. Use deactivate if you want to keep the history.' },
    { question: 'How do I view linked rate plans?', answer: 'Open the three-dot menu on a policy and choose View rate plans.' },
    { question: 'What do blackout dates do?', answer: 'They apply special cancellation conditions during festivals, holidays, and peak seasons.' },
  ],
  'property-rules': [
    { question: 'How do I find a specific rule?', answer: 'Use the search bar above the rule sections. Matching sections stay visible while others are hidden.' },
    { question: 'Why did a field disappear?', answer: 'Conditional fields only appear when the related Yes/No answer requires more detail.' },
    { question: 'What gets saved to the property?', answer: 'Core rules use the property policy API. Property-only extras stay in this browser session until dedicated fields are available.' },
  ],
  notices: [
    { question: 'When does a notice expire?', answer: 'A notice moves to Expired/Deactivated automatically when its stay end date has passed.' },
    { question: 'Can I edit a deactivated notice?', answer: 'Yes. Open it from Expired/Deactivated, edit the details, and activate it again if needed.' },
    { question: 'What does Associated With mean?', answer: 'It shows the property, room, or service the announcement applies to.' },
  ],
  'child-age': [
    { question: 'How are adult rates calculated?', answer: 'Children above the paid-stay age are treated as adults for pricing.' },
    { question: 'Can the ranges overlap?', answer: 'No. The free-stay age must be lower than the paid-stay age, and adult age is calculated automatically.' },
    { question: 'How do I disable this policy?', answer: 'Turn off Children are allowed. The configuration stays saved but becomes inactive.' },
  ],
  'post-booking': [
    { question: 'What does a guest name change allow?', answer: 'It lets the guest update the name on a confirmed booking without creating a new reservation.' },
    { question: 'Can I turn this off later?', answer: 'Yes. Choose No and save. Future bookings will follow the updated setting.' },
  ],
};

export const CHANNEL_PREVIEW = {
  MMT: 'Guests see a concise policy summary on MakeMyTrip with refund windows and stay rules.',
  GO: 'Guests see a concise policy summary on Goibibo with refund windows and stay rules.',
};

const isoDate = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

export const makeRulesId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function createInitialRulesPoliciesState() {
  return {
    gracePeriod: { enabled: false, hours: 24, minCheckInDays: 7 },
    cancellationPolicies: [
      {
        id: 'policy-free-72',
        name: 'Free Cancellation up to 72 Hours',
        status: 'active',
        refundRules: [
          { id: 'rule-free-72', label: 'Before 72 hours of check-in', beforeHours: 72, refundPercent: 100, kind: 'free' },
          { id: 'rule-nonrefund-72', label: 'Within 72 hours of check-in', beforeHours: 0, refundPercent: 0, kind: 'non-refundable' },
        ],
        ratePlanIds: ['family-studio:cp', 'superior-studio:ep', 'family-studio-mini-kitchenette:cp'],
        blackoutDates: [{ id: 'blackout-festival', label: 'Festival peak', from: isoDate(14), to: isoDate(18), condition: 'Non-refundable' }],
      },
      {
        id: 'policy-nonrefundable',
        name: 'Non-Refundable Saver',
        status: 'active',
        refundRules: [{ id: 'rule-nonrefund', label: 'After booking confirmation', beforeHours: 0, refundPercent: 0, kind: 'non-refundable' }],
        ratePlanIds: ['family-studio:ep', 'superior-studio:cp'],
        blackoutDates: [],
      },
      {
        id: 'policy-partial',
        name: '50% Refund up to 48 Hours',
        status: 'active',
        refundRules: [
          { id: 'rule-partial-48', label: 'Before 48 hours of check-in', beforeHours: 48, refundPercent: 50, kind: 'partial' },
          { id: 'rule-partial-zero', label: 'Within 48 hours of check-in', beforeHours: 0, refundPercent: 0, kind: 'non-refundable' },
        ],
        ratePlanIds: ['family-studio-mini-kitchenette:ep'],
        blackoutDates: [],
      },
    ],
    notices: [
      {
        id: 'notice-renovation',
        category: 'Renovation',
        associatedWith: 'Property',
        startDate: isoDate(-2),
        endDate: isoDate(12),
        details: 'The rooftop lounge is being refreshed. Breakfast service is unchanged.',
        status: 'active',
      },
      {
        id: 'notice-airport',
        category: 'Service update',
        associatedWith: 'All rooms',
        startDate: isoDate(5),
        endDate: isoDate(20),
        details: 'Airport pickup can be requested up to 12 hours before arrival.',
        status: 'active',
      },
      {
        id: 'notice-weather',
        category: 'Weather',
        associatedWith: 'Property',
        startDate: isoDate(-45),
        endDate: isoDate(-20),
        details: 'Heavy rain advisory for the weekend.',
        status: 'active',
      },
      {
        id: 'notice-event',
        category: 'Festival',
        associatedWith: 'Cult’s Kitchen',
        startDate: isoDate(-3),
        endDate: isoDate(6),
        details: 'Festival dinner service will run until 11 PM.',
        status: 'deactivated',
      },
    ],
    childAge: { childrenAllowed: true, freeMaxAge: 3, paidMaxAge: 5 },
    postBooking: { allowNameChange: 'yes' },
    propertyRuleExtras: {
      sameCityIdsAccepted: 'no',
      petFoodAvailable: 'no',
      petTypes: [],
      petChargesEnabled: 'no',
      petChargeAmount: '',
      petChargeFrequency: 'Per day',
      restrictedAreas: [],
      leashRequired: 'no',
      maxPets: '2',
      infantCountedInOccupancy: 'no',
      extraBedInclusionTypes: [],
      adultMattressCharge: '',
      childMattressCharge: '',
    },
  };
}

export function normalizeRulesPoliciesState(saved) {
  const initial = createInitialRulesPoliciesState();
  if (!saved || typeof saved !== 'object') return initial;
  return {
    gracePeriod: { ...initial.gracePeriod, ...(saved.gracePeriod ?? {}) },
    cancellationPolicies: Array.isArray(saved.cancellationPolicies) ? saved.cancellationPolicies : initial.cancellationPolicies,
    notices: Array.isArray(saved.notices) ? saved.notices : initial.notices,
    childAge: { ...initial.childAge, ...(saved.childAge ?? {}) },
    postBooking: { ...initial.postBooking, ...(saved.postBooking ?? {}) },
    propertyRuleExtras: { ...initial.propertyRuleExtras, ...(saved.propertyRuleExtras ?? {}) },
  };
}

export function getNoticeStatus(notice) {
  if (!notice) return 'expired';
  if (notice.status === 'deactivated') return 'deactivated';
  const endDate = new Date(`${notice.endDate}T23:59:59`);
  if (Number.isNaN(endDate.getTime())) return 'active';
  return endDate < new Date() ? 'expired' : 'active';
}

export function formatDateRange(startDate, endDate) {
  const format = (value) => {
    if (!value) return '—';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  return `${format(startDate)} – ${format(endDate)}`;
}

const isExcludedPlan = (room, plan) => {
  const haystack = `${room?.roomName ?? room?.name ?? ''} ${plan?.label ?? plan?.name ?? ''} ${plan?.id ?? ''}`;
  return /group|hour|day\s?use/i.test(haystack);
};

export function buildRatePlanOptions(property) {
  const providedRooms = Array.isArray(property?.rooms) ? property.rooms : [];
  const rooms = providedRooms.length ? providedRooms : ROOM_CATEGORY_PRESETS.map((room) => ({
    id: room.id,
    roomName: room.label,
    rateplans: room.mealPlanIds.map((planId) => MEAL_PLAN_PRESETS.find((plan) => plan.id === planId)).filter(Boolean),
  }));

  const options = rooms.flatMap((room, index) => {
    const plans = Array.isArray(room.rateplans) && room.rateplans.length
      ? room.rateplans
      : defaultRateplansFor(room, index);
    const source = plans.length ? plans : RATEPLAN_PRESETS;
    return source
      .filter((plan) => !isExcludedPlan(room, plan))
      .map((plan) => ({
        id: `${room.id ?? `room-${index}`}:${plan.id}`,
        roomId: room.id ?? `room-${index}`,
        roomName: room.roomName ?? room.name ?? `Room ${index + 1}`,
        planId: plan.id,
        planName: plan.label ?? plan.name ?? plan.id,
      }));
  });

  return options.length ? options : ROOM_CATEGORY_PRESETS.flatMap((room) => room.mealPlanIds.map((planId) => {
    const plan = MEAL_PLAN_PRESETS.find((entry) => entry.id === planId);
    return {
      id: `${room.id}:${planId}`,
      roomId: room.id,
      roomName: room.label,
      planId,
      planName: plan?.shortLabel ?? planId,
    };
  }));
}

export function optionList(options, fallback) {
  if (Array.isArray(options) && options.length > 1) {
    return options
      .filter(([value]) => value)
      .map(([value, label]) => ({ value: String(value), label: String(label) }));
  }
  return fallback;
}

export function isRuleFieldFilled(field, value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value === undefined || value === null) return false;
  return String(value).trim().length > 0;
}
