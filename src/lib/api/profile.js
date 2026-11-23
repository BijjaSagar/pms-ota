// Traveller account API: profile, photo, logged-in devices, co-travellers (/api/v1/me/*, /api/v1/auth/sessions).
// Mappers keep the screens' existing field names (e.g. co-traveller `countryCode`) and turn null into ''.
import { travellerApi } from '../context/AuthProvider.jsx';

const API_PREFIX = /^\/api\/v1/;
const blank = (v) => (v == null ? '' : v);
const orNull = (v) => {
  const t = typeof v === 'string' ? v.trim() : v;
  return t === '' || t == null ? null : t;
};

// ---------- profile ----------
export function profileFromApi(p) {
  return {
    firstName: blank(p.firstName),
    middleName: blank(p.middleName),
    lastName: blank(p.lastName),
    gender: blank(p.gender),
    dob: blank(p.dob),
    nationality: blank(p.nationality),
    maritalStatus: blank(p.maritalStatus),
    cityOfResidence: blank(p.cityOfResidence),
    state: blank(p.state),
    mobileCountryCode: p.mobileCountryCode || '+91',
    mobile: blank(p.mobile),
    email: blank(p.email),
    emailVerified: Boolean(p.emailVerified),
    mobileVerified: Boolean(p.mobileVerified),
    photoPath: p.photoUrl || '', // API path; the image itself needs the bearer token (see loadPhoto)
    preferences: p.preferences ?? null,
  };
}

export const getProfile = async () => profileFromApi(await travellerApi.get('/me/profile'));

/** Only the fields the API lets us change here (email/mobile change through a code, see contact). */
export async function updateProfile(form) {
  const body = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    middleName: orNull(form.middleName),
    gender: orNull(form.gender),
    dob: orNull(form.dob),
    nationality: orNull(form.nationality),
    maritalStatus: orNull(form.maritalStatus),
    cityOfResidence: orNull(form.cityOfResidence),
    state: orNull(form.state),
  };
  return profileFromApi(await travellerApi.patch('/me/profile', body));
}

export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function uploadPhoto(file) {
  const form = new FormData();
  form.append('photo', file);
  const res = await travellerApi.upload('/me/profile/photo', form);
  return res && typeof res === 'object' && 'firstName' in res ? profileFromApi(res) : null;
}

export const removePhoto = () => travellerApi.del('/me/profile/photo');

/** The photo is private: fetch it with the token and show it as a blob: URL (caller revokes it). */
export async function loadPhoto(photoPath) {
  if (!photoPath) return '';
  const response = await travellerApi.raw(photoPath.replace(API_PREFIX, ''));
  if (!(response instanceof Response)) return '';
  return URL.createObjectURL(await response.blob());
}

// ---------- logged-in devices ----------
const DEVICE_TIME = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
function whenText(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === today.toDateString()) return `Today, ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return d.toLocaleString('en-IN', DEVICE_TIME);
}

export function deviceFromApi(s) {
  return {
    id: s.id,
    type: String(s.deviceType || '').toLowerCase() === 'mobile' ? 'mobile' : 'desktop',
    name: s.deviceName || 'Unknown device',
    loggedIn: true,
    location: s.location || 'Location unknown',
    loginTime: `Signed in ${whenText(s.signedInAt)}`,
    lastActive: whenText(s.lastActiveAt),
    current: Boolean(s.current),
  };
}

export const listDevices = async () => (await travellerApi.get('/auth/sessions')).map(deviceFromApi);
export const logoutDevice = (id) => travellerApi.del(`/auth/sessions/${encodeURIComponent(id)}`);
export const logoutOtherDevices = () => travellerApi.post('/auth/logout-others'); // -> { signedOut }

// ---------- co-travellers ----------
export function coTravellerFromApi(t) {
  return {
    id: t.id,
    firstName: blank(t.firstName),
    middleName: blank(t.middleName),
    lastName: blank(t.lastName),
    gender: blank(t.gender),
    dob: blank(t.dob),
    nationality: blank(t.nationality),
    relationship: t.relationship,
    mealPreference: t.mealPreference || 'No preference',
    countryName: t.countryName || 'India',
    countryCode: t.mobileCountryCode || '+91',
    mobile: blank(t.mobile),
    email: blank(t.email),
  };
}

function coTravellerToApi(t) {
  const mobile = orNull(t.mobile);
  return {
    firstName: t.firstName.trim(),
    middleName: orNull(t.middleName),
    lastName: t.lastName.trim(),
    gender: orNull(t.gender),
    dob: orNull(t.dob),
    nationality: orNull(t.nationality),
    relationship: t.relationship,
    mealPreference: t.mealPreference,
    countryName: orNull(t.countryName),
    mobileCountryCode: mobile ? t.countryCode : null,
    mobile,
    email: orNull(t.email),
  };
}

export const listCoTravellers = async () => (await travellerApi.get('/me/co-travellers')).map(coTravellerFromApi);
export const createCoTraveller = async (t) => coTravellerFromApi(await travellerApi.post('/me/co-travellers', coTravellerToApi(t)));
export const updateCoTraveller = async (t) => coTravellerFromApi(await travellerApi.patch(`/me/co-travellers/${encodeURIComponent(t.id)}`, coTravellerToApi(t)));
export const deleteCoTraveller = (id) => travellerApi.del(`/me/co-travellers/${encodeURIComponent(id)}`);
