export const ROOM_CATEGORY_PRESETS = [
  { id: 'family-studio', label: 'Family Studio', mealPlanIds: ['cp', 'ep', 'cp2-super-package'] },
  { id: 'superior-studio', label: 'Superior Studio', mealPlanIds: ['cp2-super-package', 'ep'] },
  { id: 'family-studio-mini-kitchenette', label: 'Family Studio with Mini Kitchenette', mealPlanIds: ['ep', 'cp'] },
  { id: 'superior-studio-hourly', label: 'Superior Studio (Hourly)', mealPlanIds: [] },
];

export const MEAL_PLAN_PRESETS = [
  { id: 'cp', label: 'CP (Continental Plan)', shortLabel: 'CP' },
  { id: 'ep', label: 'EP (European Plan)', shortLabel: 'EP' },
  { id: 'cp2-super-package', label: 'CP2 – Super Package', shortLabel: 'CP2' },
];

export const INCLUSION_CATEGORY_OPTIONS = [
  'Breakfast',
  'Refreshments',
  'Transport',
  'Laundry',
  'Guest Services',
  'Assistance',
  'Packages',
  'Kids',
  'Wellness',
];

const ACTIVE_INCLUSIONS = [
  { id: 'hi-tea', name: 'Hi-Tea', category: 'Refreshments', sourcePackage: '', detail: 'Complimentary hi-tea served during the selected meal slot.' },
  { id: 'vehicle-rentals', name: 'Vehicle (Car/Scooter) Rentals', category: 'Transport', sourcePackage: '', detail: 'Self-drive car or scooter rental available at the property.' },
  { id: 'laundry', name: 'Laundry', category: 'Laundry', sourcePackage: '', detail: 'Complimentary laundry service for a fixed number of garments.' },
  { id: 'mandatory-breakfast', name: 'Mandatory Breakfast', category: 'Breakfast', sourcePackage: '', detail: 'Breakfast is included and mandatory for this meal plan.' },
  { id: 'breakfast', name: 'Breakfast', category: 'Breakfast', sourcePackage: '', detail: 'Complimentary breakfast for the booked stay.' },
  { id: 'railway-station-transfer', name: 'Railway Station Transfer', category: 'Transport', sourcePackage: 'CP2 – Super Package', detail: 'One-way transfer to or from the nearest railway station.' },
  { id: 'pilgrimage-assistance', name: 'Pilgrimage Assistance', category: 'Assistance', sourcePackage: 'CP2 – Super Package', detail: 'Guidance and support for nearby pilgrimage routes.' },
  { id: 'long-stay-los3', name: 'Long Stay Benefit – LOS 3 Package', category: 'Packages', sourcePackage: 'Long Stay Benefit – LOS 3 Package', detail: 'Additional benefit for guests staying three nights or more.' },
  { id: 'early-check-in', name: 'Early Check-in', category: 'Guest Services', sourcePackage: '', detail: 'Priority check-in subject to room availability.' },
  { id: 'late-check-out', name: 'Late Check-out', category: 'Guest Services', sourcePackage: '', detail: 'Extended check-out subject to availability.' },
  { id: 'airport-transfer', name: 'Airport Transfer', category: 'Transport', sourcePackage: '', detail: 'Paid or complimentary transfer from the nearest airport.' },
  { id: 'cab-discount', name: 'Cab Booking Discount', category: 'Transport', sourcePackage: '', detail: 'Discounted cab bookings through property partners.' },
  { id: 'welcome-drink', name: 'Welcome Drink', category: 'Refreshments', sourcePackage: '', detail: 'Welcome drink on arrival for each guest.' },
  { id: 'morning-tea', name: 'Morning Tea', category: 'Refreshments', sourcePackage: '', detail: 'Tea served early in the morning on request.' },
  { id: 'evening-snacks', name: 'Evening Snacks', category: 'Refreshments', sourcePackage: '', detail: 'Assorted snacks served in the evening.' },
  { id: 'in-room-dining-credit', name: 'In-room Dining Credit', category: 'Guest Services', sourcePackage: '', detail: 'Fixed credit that can be used against in-room dining orders.' },
  { id: 'spa-discount', name: 'Spa Discount', category: 'Wellness', sourcePackage: '', detail: 'Discounted spa treatments for in-house guests.' },
  { id: 'gym-access', name: 'Gym Access', category: 'Wellness', sourcePackage: '', detail: 'Complimentary access to the fitness centre.' },
  { id: 'swimming-pool-access', name: 'Swimming Pool Access', category: 'Wellness', sourcePackage: '', detail: 'Complimentary access to the swimming pool during operating hours.' },
  { id: 'free-wifi', name: 'Complimentary Wi-Fi', category: 'Guest Services', sourcePackage: '', detail: 'High-speed Wi-Fi included with the stay.' },
  { id: 'newspaper', name: 'Daily Newspaper', category: 'Guest Services', sourcePackage: '', detail: 'Daily newspaper delivered to the room or reception.' },
  { id: 'room-upgrade', name: 'Room Upgrade', category: 'Packages', sourcePackage: '', detail: 'Complimentary upgrade to the next available room category.' },
  { id: 'extra-bed-discount', name: 'Extra Bed Discount', category: 'Packages', sourcePackage: '', detail: 'Reduced charge for an additional bed.' },
  { id: 'laundry-credit', name: 'Laundry Credit', category: 'Laundry', sourcePackage: '', detail: 'Fixed credit applied to laundry charges.' },
  { id: 'dry-cleaning', name: 'Dry Cleaning', category: 'Laundry', sourcePackage: '', detail: 'Complimentary dry cleaning for selected garments.' },
  { id: 'ironing-service', name: 'Ironing Service', category: 'Laundry', sourcePackage: '', detail: 'On-request ironing service for guest clothing.' },
  { id: 'shoe-shine', name: 'Shoe Shine Service', category: 'Guest Services', sourcePackage: '', detail: 'Complimentary shoe shine service on request.' },
  { id: 'luggage-storage', name: 'Luggage Storage', category: 'Guest Services', sourcePackage: '', detail: 'Secure luggage storage before check-in and after check-out.' },
  { id: 'sightseeing-assistance', name: 'Sightseeing Assistance', category: 'Assistance', sourcePackage: '', detail: 'Help with planning and booking local sightseeing.' },
  { id: 'local-tour-guide', name: 'Local Tour Guide', category: 'Assistance', sourcePackage: '', detail: 'Local guide support for a scheduled city tour.' },
  { id: 'ticket-assistance', name: 'Ticket Assistance', category: 'Assistance', sourcePackage: '', detail: 'Assistance with entry tickets for nearby attractions.' },
  { id: 'couple-decor', name: 'Couple Room Decor', category: 'Packages', sourcePackage: 'Celebration Package', detail: 'Romantic room decoration for couples.' },
  { id: 'anniversary-cake', name: 'Anniversary Cake', category: 'Packages', sourcePackage: 'Celebration Package', detail: 'Complimentary cake for anniversary stays.' },
  { id: 'kids-play-area', name: 'Kids Play Area', category: 'Kids', sourcePackage: '', detail: 'Complimentary access to the supervised kids play area.' },
  { id: 'babysitting', name: 'Babysitting Service', category: 'Kids', sourcePackage: '', detail: 'On-request babysitting service for registered guests.' },
  { id: 'medical-assistance', name: 'Medical Assistance', category: 'Assistance', sourcePackage: '', detail: 'Basic medical assistance and local pharmacy guidance.' },
  { id: 'emergency-contact-card', name: 'Emergency Contact Card', category: 'Assistance', sourcePackage: '', detail: 'Emergency contact details shared at check-in.' },
].map((inclusion) => ({ ...inclusion, status: 'active' }));

const EXPIRED_INCLUSIONS = [
  { id: 'festive-dinner-2025', name: 'Festive Dinner 2025', category: 'Packages', sourcePackage: 'Festive Package', detail: 'Seasonal dinner offer that is no longer valid.', status: 'expired', validUntil: '2025-12-31' },
  { id: 'new-year-party-2025', name: 'New Year Party 2025', category: 'Packages', sourcePackage: 'New Year Package', detail: 'New Year celebration access that has expired.', status: 'expired', validUntil: '2025-12-31' },
  { id: 'summer-camp-2025', name: 'Summer Camp 2025', category: 'Kids', sourcePackage: 'Summer Camp Package', detail: 'Kids summer camp activity that has ended.', status: 'expired', validUntil: '2025-06-30' },
  { id: 'monsoon-spa-offer', name: 'Monsoon Spa Offer', category: 'Wellness', sourcePackage: 'Monsoon Package', detail: 'Discounted spa offer from the monsoon season.', status: 'deactivated', validUntil: '2025-09-30' },
  { id: 'free-airport-pickup-2024', name: 'Free Airport Pickup 2024', category: 'Transport', sourcePackage: '', detail: 'Previous airport pickup benefit that has expired.', status: 'expired', validUntil: '2024-12-31' },
  { id: 'complimentary-minibar-2024', name: 'Complimentary Minibar 2024', category: 'Packages', sourcePackage: '', detail: 'Minibar benefit that is no longer offered.', status: 'deactivated', validUntil: '2024-12-31' },
  { id: 'diwali-sweets-2024', name: 'Diwali Sweets 2024', category: 'Refreshments', sourcePackage: 'Festive Package', detail: 'Festive sweets add-on that has expired.', status: 'expired', validUntil: '2024-11-15' },
  { id: 'long-stay-los7-2024', name: 'Long Stay Benefit – LOS 7 Package', category: 'Packages', sourcePackage: 'Long Stay Benefit – LOS 7 Package', detail: 'Older long-stay benefit for seven-night bookings.', status: 'deactivated', validUntil: '2024-12-31' },
  { id: 'corporate-breakfast-2024', name: 'Corporate Breakfast 2024', category: 'Breakfast', sourcePackage: 'Corporate Package', detail: 'Corporate breakfast benefit that is no longer active.', status: 'expired', validUntil: '2024-12-31' },
];

const DEFAULT_ASSIGNMENTS = {
  'family-studio': {
    cp: ['hi-tea', 'vehicle-rentals', 'laundry', 'mandatory-breakfast'],
    ep: ['hi-tea', 'vehicle-rentals', 'laundry', 'breakfast'],
    'cp2-super-package': ['hi-tea', 'railway-station-transfer', 'pilgrimage-assistance', 'vehicle-rentals', 'laundry', 'mandatory-breakfast', 'long-stay-los3'],
  },
  'superior-studio': {
    'cp2-super-package': ['hi-tea', 'railway-station-transfer', 'pilgrimage-assistance', 'vehicle-rentals', 'laundry', 'mandatory-breakfast', 'long-stay-los3'],
    ep: ['hi-tea', 'vehicle-rentals', 'laundry', 'breakfast'],
  },
  'family-studio-mini-kitchenette': {
    ep: ['hi-tea', 'vehicle-rentals', 'laundry', 'breakfast'],
    cp: ['hi-tea', 'vehicle-rentals', 'laundry', 'mandatory-breakfast'],
  },
  'superior-studio-hourly': {},
};

export const makeInclusionId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const createInitialInclusionsState = () => ({
  rooms: ROOM_CATEGORY_PRESETS.map((room) => ({ ...room })),
  mealPlans: MEAL_PLAN_PRESETS.map((plan) => ({ ...plan })),
  inclusions: [...ACTIVE_INCLUSIONS, ...EXPIRED_INCLUSIONS].map((inclusion) => ({ ...inclusion })),
  assignments: JSON.parse(JSON.stringify(DEFAULT_ASSIGNMENTS)),
});
