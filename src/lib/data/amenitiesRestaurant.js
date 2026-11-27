export const AMENITY_CATEGORY_ORDER = [
  'Mandatory',
  'General Services',
  'Security',
  'Basic Facilities',
  'Outdoor Sports & Activities',
  'Common Area',
  'Food and Drink',
  'Business Center and Conferences',
  'Transfers',
  'Entertainment',
  'Shopping',
  'Media and Technology',
  'Payment Services',
  'Family and Kids',
  'Pet Essentials',
  'Spa & Wellness',
  'Accessibility',
  'Water Sports & Activities',
  'Indoor Sports & Activities',
  'Live Shows, Music & Entertainment Activities',
  'Wildlife Safari and Wildlife Exploration',
  'Rides, Safari, Excursions & Tour',
  'Nature Activities, Walks & Treks',
  'Hands-on Workshops & Interactive Activities',
];

export const CUISINE_OPTIONS = [
  'Vegetarian food',
  'Indian cuisine',
  'Chinese cuisine',
  'Continental cuisine',
  'South Indian cuisine',
  'Bakery and café',
  'Beverages',
];

export const DINING_MODE_OPTIONS = ['Dine-in', 'Takeaway', 'Room delivery', 'Outdoor seating'];

const roomAmenityItems = (entries) => entries.map(([id, label]) => ({ id, label }));

const roomAmenityCategory = (id, label, items) => ({ id, label, items: roomAmenityItems(items) });

const makeRoomAmenityCategories = ({ hourly = false, kitchenette = false } = {}) => [
  roomAmenityCategory('mandatory', 'Mandatory', [
    ['air-conditioning', 'Air Conditioning'],
    ['wifi', 'Wi-Fi'],
    ['television', 'Television'],
    ['attached-bathroom', 'Attached Bathroom'],
    ...(hourly ? [['hourly-booking', 'Hourly Booking'], ['flexible-checkin', 'Flexible Check-in']] : []),
  ]),
  roomAmenityCategory('popular-with-guest', 'Popular with Guest', [
    ['smart-tv', 'Smart TV'],
    ['work-desk', 'Work Desk'],
    ['coffee-maker', 'Coffee Maker'],
    ['balcony', 'Balcony'],
    ['minibar', 'Minibar'],
  ]),
  roomAmenityCategory('bathroom', 'Bathroom', [
    ['shower', 'Shower'],
    ['bathtub', 'Bathtub'],
    ['hot-water', 'Hot Water'],
    ['toiletries', 'Toiletries'],
    ['hairdryer', 'Hairdryer'],
    ['towels', 'Towels'],
  ]),
  roomAmenityCategory('room-features', 'Room Features', [
    ['seating-area', 'Seating Area'],
    ['wardrobe', 'Wardrobe'],
    ['blackout-curtains', 'Blackout Curtains'],
    ['soundproofing', 'Soundproofing'],
    ['balcony-room', 'Balcony'],
  ]),
  roomAmenityCategory('media-and-entertainment', 'Media and Entertainment', [
    ['satellite-channels', 'Satellite Channels'],
    ['streaming-services', 'Streaming Services'],
    ['bluetooth-speaker', 'Bluetooth Speaker'],
    ['usb-charging', 'USB Charging Points'],
  ]),
  roomAmenityCategory('food-and-drinks', 'Food and Drinks', [
    ['tea-coffee-maker', 'Tea/Coffee Maker'],
    ['bottled-water', 'Complimentary Bottled Water'],
    ['room-service', 'Room Service'],
    ['snack-basket', 'Snack Basket'],
    ...(kitchenette ? [['kitchenette-dining', 'Kitchenette Dining Area']] : []),
  ]),
  roomAmenityCategory('appliances', 'Appliances', [
    ['refrigerator', 'Refrigerator'],
    ['microwave', 'Microwave'],
    ['electric-kettle', 'Electric Kettle'],
    ['iron', 'Iron & Ironing Board'],
    ...(kitchenette ? [
      ['mini-kitchenette', 'Mini Kitchenette'],
      ['cookware', 'Cookware & Utensils'],
    ] : []),
  ]),
  roomAmenityCategory('beds-and-blankets', 'Beds and Blankets', [
    ['bed-linen', 'Bed Linen'],
    ['pillows', 'Pillows'],
    ['blankets', 'Blankets'],
    ['extra-bed', 'Extra Bed'],
  ]),
  roomAmenityCategory('safety-and-security', 'Safety and Security', [
    ['in-room-safe', 'In-room Safe'],
    ['smoke-detector', 'Smoke Detector'],
    ['fire-extinguisher', 'Fire Extinguisher'],
    ['first-aid-kit', 'First Aid Kit'],
    ['cctv', 'CCTV Coverage'],
  ]),
  roomAmenityCategory('childcare', 'Childcare', [
    ['crib', 'Crib'],
    ['baby-bath', 'Baby Bath'],
    ['child-safety-locks', 'Child Safety Locks'],
    ['babysitting-service', 'Babysitting Service'],
    ['kids-toys', 'Kids Toys'],
  ]),
  roomAmenityCategory('other-facilities', 'Other Facilities', [
    ['housekeeping', 'Housekeeping'],
    ['laundry-service', 'Laundry Service'],
    ['wake-up-call', 'Wake-up Call'],
    ['luggage-storage', 'Luggage Storage'],
  ]),
];

export const ROOM_AMENITY_VIEWS = [
  { id: 'hotel', label: 'Hotel', kind: 'hotel' },
  { id: 'family-studio-hourly', label: 'Family Studio Hourly', kind: 'room', categories: makeRoomAmenityCategories({ hourly: true }) },
  { id: 'family-studio', label: 'Family Studio', kind: 'room', categories: makeRoomAmenityCategories() },
  { id: 'superior-studio', label: 'Superior Studio', kind: 'room', categories: makeRoomAmenityCategories() },
  { id: 'family-studio-mini-kitchenette', label: 'Family Studio with Mini Kitchenette', kind: 'room', categories: makeRoomAmenityCategories({ kitchenette: true }) },
];

export const EMPTY_RESTAURANT = {
  id: '',
  name: '',
  description: '',
  cuisines: [],
  diningMode: 'Dine-in',
  hours: '',
  imageUrl: '',
};

export const makeRestaurant = () => ({
  ...EMPTY_RESTAURANT,
  id: `restaurant-${Date.now()}`,
  cuisines: [],
});
