export const RATINGS_TOTAL_REVIEWS = 673;
export const REVIEWS_REPORT_DATE = '2026-11-26';

export const ratingLabel = (value) => {
  if (value >= 4.5) return 'Excellent';
  if (value >= 3.5) return 'Very Good';
  if (value >= 2.5) return 'Average';
  if (value >= 1.5) return 'Poor';
  return 'Bad';
};

export const ratingTone = (value) => {
  if (value >= 4.5) return 'excellent';
  if (value >= 3.5) return 'very-good';
  if (value >= 2.5) return 'average';
  if (value >= 2) return 'poor';
  return 'bad';
};

export const OTA_SUMMARIES = [
  {
    id: 'makemytrip',
    name: 'MakeMyTrip',
    short: 'MMT',
    totalRatings: 515,
    totalReviews: 264,
    overall: 4.3,
    overallLabel: 'Very Good',
    distribution: [
      { label: 'Excellent', percentage: 54, count: 276 },
      { label: 'Very Good', percentage: 31, count: 157 },
      { label: 'Average', percentage: 10, count: 51 },
      { label: 'Poor', percentage: 5, count: 23 },
      { label: 'Bad', percentage: 2, count: 8 },
    ],
    categories: [
      { label: 'Hospitality', score: 5.0 },
      { label: 'Child Friendliness', score: 4.6 },
      { label: 'Cleanliness', score: 4.5 },
      { label: 'Security', score: 4.5 },
      { label: 'Room', score: 4.5 },
    ],
    extraCategories: [
      { label: 'Location', score: 4.4 },
      { label: 'Food', score: 4.3 },
      { label: 'Value for Money', score: 4.2 },
      { label: 'Facilities', score: 4.1 },
    ],
    recentRatings: [4.5, 4.0, 5.0, 4.0, 4.5, 3.0, 5.0, 4.0],
    impressions: {
      short: 'Guests consistently praise the warm hospitality, peaceful location and clean, spacious rooms. Food quality and parking receive positive mentions.',
      full: 'Guests consistently praise the warm hospitality, peaceful location and clean, spacious rooms. Food quality and parking receive positive mentions. A few guests mention that the property is a little away from the highway and that parking can feel limited during peak hours. Overall sentiment remains strongly positive for short leisure and family stays.',
    },
  },
  {
    id: 'goibibo',
    name: 'Goibibo',
    short: 'GB',
    totalRatings: 158,
    totalReviews: 53,
    overall: 4.4,
    overallLabel: 'Very Good',
    distribution: [
      { label: 'Excellent', percentage: 62, count: 98 },
      { label: 'Very Good', percentage: 26, count: 41 },
      { label: 'Average', percentage: 8, count: 12 },
      { label: 'Poor', percentage: 4, count: 6 },
      { label: 'Bad', percentage: 1, count: 1 },
    ],
    categories: [
      { label: 'Cleanliness', score: 4.9 },
      { label: 'Washroom Cleanliness', score: 4.5 },
      { label: 'Food', score: 4.4 },
      { label: 'Couple', score: 4.4 },
      { label: 'Value for Money', score: 4.3 },
    ],
    extraCategories: [
      { label: 'Staff', score: 4.7 },
      { label: 'Room', score: 4.5 },
      { label: 'Location', score: 4.2 },
      { label: 'Facilities', score: 4.1 },
    ],
    recentRatings: [5.0, 4.5, 4.0, 4.5, 5.0, 4.0, 3.0, 4.5],
    impressions: {
      short: 'Customers highlight clean rooms, polite staff and a calm residential setting. Many reviews call it a good value stay for couples and small groups.',
      full: 'Customers highlight clean rooms, polite staff and a calm residential setting. Many reviews call it a good value stay for couples and small groups. Breakfast and room cleanliness are recurring positive themes. Some guests note limited parking and the approach road as minor areas for improvement.',
    },
  },
];

export const KEYWORD_FILTERS = [
  {
    id: 'makemytrip',
    label: 'MakeMyTrip keywords',
    extraCount: 36,
    items: [
      { label: 'Staff Courtesy', count: 86 },
      { label: 'Food', count: 54 },
      { label: 'Room Cleanliness', count: 42 },
    ],
    extra: [
      { label: 'Good Location', count: 31 },
      { label: 'Spacious Rooms', count: 28 },
      { label: 'Peaceful Stay', count: 24 },
      { label: 'Parking', count: 19 },
      { label: 'Breakfast', count: 17 },
      { label: 'Value for Money', count: 15 },
    ],
  },
  {
    id: 'goibibo',
    label: 'Goibibo keywords',
    extraCount: 24,
    items: [
      { label: 'Clean Room', count: 62 },
      { label: 'Polite Staff', count: 41 },
      { label: 'Good Stay', count: 37 },
    ],
    extra: [
      { label: 'Boutique Property', count: 22 },
      { label: 'Quiet Area', count: 20 },
      { label: 'Family Stay', count: 18 },
      { label: 'Food Quality', count: 14 },
      { label: 'Check-in', count: 12 },
      { label: 'Parking', count: 9 },
    ],
  },
];

export const POSTED_ON_OPTIONS = [
  { value: 'all', label: 'All dates' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '2026-11', label: 'November 2026' },
];

export const RATING_OPTIONS = [
  { value: 'all', label: 'All ratings' },
  { value: '5', label: '5 stars' },
  { value: '4', label: '4 stars' },
  { value: '3', label: '3 stars' },
  { value: '2', label: '2 stars' },
  { value: '1', label: '1 star' },
];

export const BRAND_OPTIONS = [
  { value: 'all', label: 'All brands' },
  { value: 'makemytrip', label: 'MakeMyTrip' },
  { value: 'goibibo', label: 'Goibibo' },
];

export const REPLY_OPTIONS = [
  { value: 'all', label: 'All replies' },
  { value: 'replied', label: 'Replied' },
  { value: 'unreplied', label: 'Unreplied' },
];

export const GUEST_TYPE_OPTIONS = ['All guest types', 'Couple', 'Group', 'Family', 'Solo', 'Business'];

export const ROOM_NAME_OPTIONS = ['All rooms', 'Family Studio', 'Deluxe Room', 'Suite Room', 'Standard Room'];

export const INITIAL_REVIEW_FILTERS = {
  postedOn: 'all',
  rating: 'all',
  brand: 'all',
  reply: 'all',
  guestType: 'All guest types',
  roomName: 'All rooms',
};

export const REVIEWS = [
  {
    id: 'rv-001',
    platform: 'goibibo',
    title: 'Good Stay',
    rating: 4,
    guestName: 'Anuradha Bagade',
    stayDuration: '1 Night',
    guestType: 'Group',
    roomName: 'Family Studio',
    postedOn: '2026-11-20',
    bookingId: 'GB8264105',
    feedback: "It's a good boutique hotel in Solapur. In a quiet neighborhood.",
    keywords: ['Clean Room', 'Quiet Area', 'Boutique Property'],
    replied: false,
    replyText: '',
  },
  {
    id: 'rv-002',
    platform: 'makemytrip',
    title: 'Good Stay',
    rating: 4,
    guestName: 'Aditya Pandit',
    stayDuration: '1 Night',
    guestType: 'Couple',
    roomName: 'Family Studio',
    postedOn: '2026-11-15',
    bookingId: 'MT7241986',
    feedback: 'The guest appreciates the spacious and well-lit rooms, ventilation, parking facilities, peaceful residential location, and food quality. The guest also mentions that the property is somewhat far from the highway and has limited parking space.',
    keywords: ['Spacious Rooms', 'Food', 'Parking'],
    replied: true,
    replyText: 'Thank you for the detailed feedback. We are glad you enjoyed the room and food, and we have shared your parking note with the operations team.',
  },
  {
    id: 'rv-003',
    platform: 'makemytrip',
    title: 'Excellent Hospitality',
    rating: 5,
    guestName: 'Rohan Deshmukh',
    stayDuration: '2 Nights',
    guestType: 'Family',
    roomName: 'Deluxe Room',
    postedOn: '2026-11-22',
    bookingId: 'MT7198034',
    feedback: 'The staff was very helpful from check-in to checkout. Rooms were clean, the breakfast was fresh and the property is ideal for a relaxed family weekend.',
    keywords: ['Staff Courtesy', 'Room Cleanliness', 'Food'],
    replied: true,
    replyText: 'We are happy to read this. Thank you for choosing us for your family stay.',
  },
  {
    id: 'rv-004',
    platform: 'goibibo',
    title: 'Clean and Peaceful',
    rating: 5,
    guestName: 'Sneha Kulkarni',
    stayDuration: '1 Night',
    guestType: 'Couple',
    roomName: 'Suite Room',
    postedOn: '2026-11-18',
    bookingId: 'GB8147260',
    feedback: 'Very clean suite and a peaceful residential area. The bed was comfortable and the washroom was spotless. Would happily stay again.',
    keywords: ['Clean Room', 'Polite Staff', 'Good Stay'],
    replied: false,
    replyText: '',
  },
  {
    id: 'rv-005',
    platform: 'makemytrip',
    title: 'Good Food and Service',
    rating: 4,
    guestName: 'Imran Shaikh',
    stayDuration: '1 Night',
    guestType: 'Business',
    roomName: 'Standard Room',
    postedOn: '2026-11-12',
    bookingId: 'MT7022118',
    feedback: 'Food quality was good and the team arranged everything quickly. The room was compact but comfortable for a one-night business trip.',
    keywords: ['Food', 'Staff Courtesy', 'Room Cleanliness'],
    replied: false,
    replyText: '',
  },
  {
    id: 'rv-006',
    platform: 'goibibo',
    title: 'Nice Boutique Property',
    rating: 4,
    guestName: 'Meera Joshi',
    stayDuration: '2 Nights',
    guestType: 'Group',
    roomName: 'Family Studio',
    postedOn: '2026-11-09',
    bookingId: 'GB8093351',
    feedback: 'A nice boutique property with helpful staff. The family studio worked well for our group and the location was quiet.',
    keywords: ['Boutique Property', 'Polite Staff', 'Family Stay'],
    replied: true,
    replyText: 'Thank you for the lovely review. We hope to host your group again soon.',
  },
  {
    id: 'rv-007',
    platform: 'makemytrip',
    title: 'Average Experience',
    rating: 3,
    guestName: 'Vikram Patil',
    stayDuration: '1 Night',
    guestType: 'Solo',
    roomName: 'Standard Room',
    postedOn: '2026-11-05',
    bookingId: 'MT6987420',
    feedback: 'The stay was acceptable for the price. Room and linen were clean, but parking was difficult in the evening and the approach road is not very obvious.',
    keywords: ['Room Cleanliness', 'Parking', 'Value for Money'],
    replied: true,
    replyText: 'Thank you for your feedback. We are reviewing our evening parking guidance and signage.',
  },
  {
    id: 'rv-008',
    platform: 'goibibo',
    title: 'Comfortable Room',
    rating: 4,
    guestName: 'Priya Nair',
    stayDuration: '1 Night',
    guestType: 'Couple',
    roomName: 'Deluxe Room',
    postedOn: '2026-11-03',
    bookingId: 'GB8012984',
    feedback: 'Comfortable bed, clean washroom and polite front desk. Good choice for a short stay in the city.',
    keywords: ['Clean Room', 'Polite Staff', 'Good Stay'],
    replied: false,
    replyText: '',
  },
  {
    id: 'rv-009',
    platform: 'makemytrip',
    title: 'Lovely Stay',
    rating: 5,
    guestName: 'Aarti Bhosale',
    stayDuration: '3 Nights',
    guestType: 'Family',
    roomName: 'Suite Room',
    postedOn: '2026-10-28',
    bookingId: 'MT6871244',
    feedback: 'The suite was spacious and very well maintained. Housekeeping was quick, the staff was courteous and the children enjoyed the stay.',
    keywords: ['Spacious Rooms', 'Staff Courtesy', 'Room Cleanliness'],
    replied: true,
    replyText: 'Thank you for the wonderful review. We are glad the whole family enjoyed the stay.',
  },
  {
    id: 'rv-010',
    platform: 'goibibo',
    title: 'Can Improve Parking',
    rating: 2,
    guestName: 'Nikhil Rao',
    stayDuration: '1 Night',
    guestType: 'Couple',
    roomName: 'Standard Room',
    postedOn: '2026-10-24',
    bookingId: 'GB7906532',
    feedback: 'Room was fine, but parking was full when we arrived and check-in took longer than expected. Staff was polite once we got inside.',
    keywords: ['Parking', 'Polite Staff', 'Check-in'],
    replied: false,
    replyText: '',
  },
  {
    id: 'rv-011',
    platform: 'makemytrip',
    title: 'Not As Expected',
    rating: 1,
    guestName: 'Deepak More',
    stayDuration: '1 Night',
    guestType: 'Business',
    roomName: 'Standard Room',
    postedOn: '2026-10-18',
    bookingId: 'MT6753091',
    feedback: 'The room was smaller than expected and the wi-fi was slow during my work call. The team did try to resolve the issue.',
    keywords: ['Room', 'Staff Courtesy'],
    replied: true,
    replyText: 'We are sorry about the connectivity issue. Our internet provider has been informed and we are adding a backup connection.',
  },
  {
    id: 'rv-012',
    platform: 'goibibo',
    title: 'Great Value',
    rating: 5,
    guestName: 'Radhika Menon',
    stayDuration: '2 Nights',
    guestType: 'Solo',
    roomName: 'Deluxe Room',
    postedOn: '2026-10-12',
    bookingId: 'GB7810046',
    feedback: 'Excellent value for money. The location is quiet, the room was clean and the breakfast had good variety.',
    keywords: ['Good Stay', 'Clean Room', 'Food Quality'],
    replied: false,
    replyText: '',
  },
];

export const REVIEW_INFO_POINTS = [
  'An overall score is calculated from guest ratings submitted after completed stays.',
  'Category scores are shown separately for each OTA so you can compare performance.',
  'Traveller impressions summarise repeated themes in recent written feedback.',
  'Rating distribution counts group scores into Excellent, Very Good, Average, Poor and Bad bands.',
  'Replies are private workspace actions in this demo and are not sent to the OTA.',
];
