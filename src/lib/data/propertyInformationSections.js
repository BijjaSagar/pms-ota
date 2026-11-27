export const PROPERTY_INFO_NAV_SECTIONS = [
  {
    id: 'basic-information',
    label: 'Basic Information',
    description: 'Name, contact details and location',
  },
  {
    id: 'rooms-rateplans',
    label: 'Rooms & Rateplans',
    description: 'Room setup, meal plans and rates',
  },
  {
    id: 'amenities-restaurants',
    label: 'Amenities & Restaurants',
    description: 'Facilities, services and dining',
  },
  {
    id: 'inclusions-packages',
    label: 'Inclusions & Packages',
    description: 'Meals, add-ons and stay packages',
  },
  {
    id: 'photos-videos',
    label: 'Photos & Videos',
    description: 'Cover image, gallery and videos',
  },
  {
    id: 'rules-policies',
    label: 'Rules & Policies',
    description: 'Check-in, cancellation and stay rules',
  },
  {
    id: 'content-score',
    label: 'Content Score',
    description: 'Listing completeness and next steps',
  },
  {
    id: 'financial-bank-details',
    label: 'Financial & Bank Details',
    description: 'Tax, payout and bank information',
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Property preferences and alerts',
  },
];

export const propertyInfoSectionById = (id) => PROPERTY_INFO_NAV_SECTIONS.find((section) => section.id === id) ?? PROPERTY_INFO_NAV_SECTIONS[0];
