// Ported from pms-ota/src/data/profile.ts (types removed, logic unchanged).
const genderOptions = ["Male", "Female", "Non-binary", "Prefer not to say"];
const maritalStatusOptions = [
  "Single",
  "Married",
  "Divorced",
  "Widowed",
  "Prefer not to say"
];
const nationalityOptions = [
  "Indian",
  "American",
  "British",
  "Canadian",
  "Australian",
  "French",
  "German",
  "Italian",
  "Spanish",
  "Dutch",
  "Japanese",
  "Singaporean",
  "Emirati",
  "Brazilian",
  "South African",
  "Other"
];
const relationshipOptions = [
  "Spouse",
  "Partner",
  "Parent",
  "Child",
  "Sibling",
  "Friend",
  "Colleague",
  "Other"
];
const mealPreferenceOptions = [
  "No preference",
  "Vegetarian",
  "Vegan",
  "Non-vegetarian",
  "Gluten-free",
  "Halal",
  "Kosher"
];
const documentTypeOptions = [
  "Passport",
  "National ID",
  "Aadhaar",
  "Driver's licence"
];
const countryOptions = [
  { name: "India", code: "+91" },
  { name: "United States", code: "+1" },
  { name: "United Kingdom", code: "+44" },
  { name: "United Arab Emirates", code: "+971" },
  { name: "Singapore", code: "+65" },
  { name: "Australia", code: "+61" },
  { name: "Canada", code: "+1" },
  { name: "France", code: "+33" },
  { name: "Germany", code: "+49" },
  { name: "Italy", code: "+39" },
  { name: "Spain", code: "+34" },
  { name: "Netherlands", code: "+31" },
  { name: "Japan", code: "+81" },
  { name: "Brazil", code: "+55" },
  { name: "South Africa", code: "+27" }
];
const sampleProfile = {
  firstName: "Alex",
  middleName: "Jordan",
  lastName: "Morgan",
  gender: "Female",
  dob: "1992-06-18",
  nationality: "Indian",
  maritalStatus: "Single",
  cityOfResidence: "Mumbai",
  state: "Maharashtra",
  mobileCountryCode: "+91",
  mobile: "98765 43210",
  email: "alex.morgan@example.com",
  photoUrl: "",
  document: {
    type: "Passport",
    number: "M1234567",
    expiry: "2031-08-22",
    fileName: ""
  }
};
const initialCoTravellers = [
  {
    id: "ct-1",
    firstName: "Priya",
    middleName: "Anita",
    lastName: "Morgan",
    gender: "Female",
    dob: "1990-03-12",
    nationality: "Indian",
    relationship: "Spouse",
    mealPreference: "Vegetarian",
    countryName: "India",
    countryCode: "+91",
    mobile: "98111 22334",
    email: "priya.morgan@example.com"
  },
  {
    id: "ct-2",
    firstName: "Noah",
    middleName: "",
    lastName: "Morgan",
    gender: "Male",
    dob: "2016-11-05",
    nationality: "Indian",
    relationship: "Child",
    mealPreference: "No preference",
    countryName: "India",
    countryCode: "+91",
    mobile: "98222 33445",
    email: "noah.morgan@example.com"
  }
];
const initialDevices = [
  {
    id: "device-1",
    type: "mobile",
    name: "iPhone 15 Pro \xB7 Safari",
    loggedIn: true,
    location: "Mumbai, India",
    loginTime: "Today, 09:42 AM",
    current: true
  },
  {
    id: "device-2",
    type: "desktop",
    name: "MacBook Air \xB7 Chrome",
    loggedIn: true,
    location: "Mumbai, India",
    loginTime: "Yesterday, 08:15 PM"
  },
  {
    id: "device-3",
    type: "mobile",
    name: "OnePlus 12 \xB7 Chrome",
    loggedIn: true,
    location: "Pune, India",
    loginTime: "12 Oct 2026, 06:30 PM"
  }
];
export {
  countryOptions,
  documentTypeOptions,
  genderOptions,
  initialCoTravellers,
  initialDevices,
  maritalStatusOptions,
  mealPreferenceOptions,
  nationalityOptions,
  relationshipOptions,
  sampleProfile
};
