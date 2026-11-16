import type { CoTraveller, LoggedInDevice, UserProfile } from '../types'

export const genderOptions: string[] = ['Male', 'Female', 'Non-binary', 'Prefer not to say']

export const maritalStatusOptions: string[] = [
  'Single',
  'Married',
  'Divorced',
  'Widowed',
  'Prefer not to say',
]

export const nationalityOptions: string[] = [
  'Indian',
  'American',
  'British',
  'Canadian',
  'Australian',
  'French',
  'German',
  'Italian',
  'Spanish',
  'Dutch',
  'Japanese',
  'Singaporean',
  'Emirati',
  'Brazilian',
  'South African',
  'Other',
]

export const relationshipOptions: string[] = [
  'Spouse',
  'Partner',
  'Parent',
  'Child',
  'Sibling',
  'Friend',
  'Colleague',
  'Other',
]

export const mealPreferenceOptions: string[] = [
  'No preference',
  'Vegetarian',
  'Vegan',
  'Non-vegetarian',
  'Gluten-free',
  'Halal',
  'Kosher',
]

export const documentTypeOptions: string[] = [
  'Passport',
  'National ID',
  'Aadhaar',
  "Driver's licence",
]

export const countryOptions: { name: string; code: string }[] = [
  { name: 'India', code: '+91' },
  { name: 'United States', code: '+1' },
  { name: 'United Kingdom', code: '+44' },
  { name: 'United Arab Emirates', code: '+971' },
  { name: 'Singapore', code: '+65' },
  { name: 'Australia', code: '+61' },
  { name: 'Canada', code: '+1' },
  { name: 'France', code: '+33' },
  { name: 'Germany', code: '+49' },
  { name: 'Italy', code: '+39' },
  { name: 'Spain', code: '+34' },
  { name: 'Netherlands', code: '+31' },
  { name: 'Japan', code: '+81' },
  { name: 'Brazil', code: '+55' },
  { name: 'South Africa', code: '+27' },
]

export const sampleProfile: UserProfile = {
  firstName: 'Alex',
  middleName: 'Jordan',
  lastName: 'Morgan',
  gender: 'Female',
  dob: '1992-06-18',
  nationality: 'Indian',
  maritalStatus: 'Single',
  cityOfResidence: 'Mumbai',
  state: 'Maharashtra',
  mobileCountryCode: '+91',
  mobile: '98765 43210',
  email: 'alex.morgan@example.com',
  photoUrl: '',
  document: {
    type: 'Passport',
    number: 'M1234567',
    expiry: '2031-08-22',
    fileName: '',
  },
}

export const initialCoTravellers: CoTraveller[] = [
  {
    id: 'ct-1',
    firstName: 'Priya',
    middleName: 'Anita',
    lastName: 'Morgan',
    gender: 'Female',
    dob: '1990-03-12',
    nationality: 'Indian',
    relationship: 'Spouse',
    mealPreference: 'Vegetarian',
    countryName: 'India',
    countryCode: '+91',
    mobile: '98111 22334',
    email: 'priya.morgan@example.com',
  },
  {
    id: 'ct-2',
    firstName: 'Noah',
    middleName: '',
    lastName: 'Morgan',
    gender: 'Male',
    dob: '2016-11-05',
    nationality: 'Indian',
    relationship: 'Child',
    mealPreference: 'No preference',
    countryName: 'India',
    countryCode: '+91',
    mobile: '98222 33445',
    email: 'noah.morgan@example.com',
  },
]

export const initialDevices: LoggedInDevice[] = [
  {
    id: 'device-1',
    type: 'mobile',
    name: 'iPhone 15 Pro · Safari',
    loggedIn: true,
    location: 'Mumbai, India',
    loginTime: 'Today, 09:42 AM',
    current: true,
  },
  {
    id: 'device-2',
    type: 'desktop',
    name: 'MacBook Air · Chrome',
    loggedIn: true,
    location: 'Mumbai, India',
    loginTime: 'Yesterday, 08:15 PM',
  },
  {
    id: 'device-3',
    type: 'mobile',
    name: 'OnePlus 12 · Chrome',
    loggedIn: true,
    location: 'Pune, India',
    loginTime: '12 Oct 2026, 06:30 PM',
  },
]
