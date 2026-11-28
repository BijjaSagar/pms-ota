// Partner Hub properties API (/api/v1/partner/*): "Your properties" and the "Add a property" wizard.
// Mappers keep the wizard's form shapes (text inputs are strings, Yes/No answers are 'yes' | 'no' | '').
import { useEffect, useState } from 'react';
import { partnerApi } from '../context/AuthProvider.jsx';
import {
  AMENITY_CATEGORIES, EMPTY_BASIC_INFO, EMPTY_LOCATION_INFO, EMPTY_ROOMS_INFO, POLICY_YES_NO_FIELDS, ROOM_AMENITY_ITEMS,
  applyMasters, normalizePoliciesDraft, sanitizeMobile,
} from '../data/partner.js';

const API_PREFIX = /^\/api\/v1/;
const base = (id) => `/partner/properties/${id}`;
const text = (v) => (v == null ? '' : String(v));
const yesNo = (v) => (v === true ? 'yes' : v === false ? 'no' : '');
const optional = (v) => { const t = String(v ?? '').trim(); return t || undefined; };

// ---------- lists (loaded once; the wizard must not render before this resolves) ----------
let mastersPromise = null;
export function loadMasters() {
  mastersPromise ??= partnerApi.get('/partner/masters')
    .then((masters) => { applyMasters(masters); })
    .catch((error) => { mastersPromise = null; throw error; });
  return mastersPromise;
}

// ---------- properties ----------
// Last list per account, so moving between partner modules shows the property at once (then refreshes).
let listCache = { account: null, items: null };
export const cachedProperties = (account) => (account && listCache.account === account ? listCache.items : null);
export const listProperties = (account) => partnerApi.get('/partner/properties').then((items) => {
  if (account) listCache = { account, items };
  return items;
});
export const createProperty = (type) => partnerApi.post('/partner/properties', { type });
export const getProperty = (id) => partnerApi.get(base(id));
export const deleteProperty = (id) => partnerApi.del(base(id));
export const submitProperty = (id) => partnerApi.post(`${base(id)}/submit`);

// ---------- Property Information (works on listed properties too) ----------
const info = (id) => `${base(id)}/information`;
export const getInformation = (id) => partnerApi.get(info(id));
export const saveInformationDetails = (id, body) => partnerApi.put(`${info(id)}/details`, body);
export const saveInformationContacts = (id, body) => partnerApi.put(`${info(id)}/contacts`, body);
export const saveInformationReach = (id, body) => partnerApi.put(`${info(id)}/reach`, body);
export const getAmenities = (id) => partnerApi.get(`${info(id)}/amenities`);
export const saveAmenityAnswers = (id, answers) => partnerApi.put(`${info(id)}/amenities`, { answers });
export const saveRoomAmenities = (id, roomId, answers) => partnerApi.put(`${info(id)}/rooms/${roomId}/amenities`, { answers });
export const createRestaurant = (id, body) => partnerApi.post(`${info(id)}/restaurants`, body);
export const updateRestaurant = (id, restaurantId, body) => partnerApi.put(`${info(id)}/restaurants/${restaurantId}`, body);
export const deleteRestaurant = (id, restaurantId) => partnerApi.del(`${info(id)}/restaurants/${restaurantId}`);
// ---------- rules & policies (each call answers with the whole Rules view) ----------
export const getRules = (id) => partnerApi.get(`${info(id)}/rules`);
export const saveGracePeriod = (id, body) => partnerApi.put(`${info(id)}/rules/grace-period`, body);
export const savePropertyRules = (id, body) => partnerApi.put(`${info(id)}/rules/property-rules`, body);
export const saveChildAge = (id, body) => partnerApi.put(`${info(id)}/rules/child-age`, body);
export const savePostBooking = (id, body) => partnerApi.put(`${info(id)}/rules/post-booking`, body);
export const createCancellationPolicy = (id, body) => partnerApi.post(`${info(id)}/cancellation-policies`, body);
export const updateCancellationPolicy = (id, policyId, body) => partnerApi.put(`${info(id)}/cancellation-policies/${policyId}`, body);
export const setCancellationPolicyActive = (id, policyId, active) => partnerApi.patch(`${info(id)}/cancellation-policies/${policyId}/status`, { active });
export const setDefaultCancellationPolicy = (id, policyId) => partnerApi.put(`${info(id)}/cancellation-policies/${policyId}/default`, {});
export const deleteCancellationPolicy = (id, policyId) => partnerApi.del(`${info(id)}/cancellation-policies/${policyId}`);
export const createNotice = (id, body) => partnerApi.post(`${info(id)}/notices`, body);
export const updateNotice = (id, noticeId, body) => partnerApi.put(`${info(id)}/notices/${noticeId}`, body);
export const setNoticeActive = (id, noticeId, active) => partnerApi.patch(`${info(id)}/notices/${noticeId}/status`, { active });
export const deleteNotice = (id, noticeId) => partnerApi.del(`${info(id)}/notices/${noticeId}`);
export const getContentScore = (id) => partnerApi.get(`${info(id)}/content-score`);
export const getInclusions = (id) => partnerApi.get(`${info(id)}/inclusions`);
export const addPlanInclusion = (id, planId, body) => partnerApi.post(`${info(id)}/rate-plans/${planId}/inclusions`, body);
export const setPlanInclusions = (id, planId, codes) => partnerApi.put(`${info(id)}/rate-plans/${planId}/inclusions`, { codes });
export const updatePlanInclusion = (id, rowId, body) => partnerApi.patch(`${info(id)}/plan-inclusions/${rowId}`, body);
export const deletePlanInclusion = (id, rowId) => partnerApi.del(`${info(id)}/plan-inclusions/${rowId}`);
export const reportLocation = (id, message) => partnerApi.post(`${info(id)}/location-reports`, { message });

// ---------- contact verification ----------
const contactBody = (field, value) => ({ [field]: String(value).trim() });
export const requestContactOtp = (id, field, value) => partnerApi.post(`${base(id)}/contact/otp/request`, contactBody(field, value));
export const verifyContactOtp = (id, field, value, otp) => partnerApi.post(`${base(id)}/contact/otp/verify`, { ...contactBody(field, value), otp });

// ---------- basic info ----------
export const sameEmail = (a, b) => Boolean(b) && String(a ?? '').trim().toLowerCase() === b;
export const sameMobile = (a, b) => Boolean(b) && String(a ?? '').trim() === b;

export function basicFromApi(b, user) {
  const email = b.email ?? b.verifiedEmail ?? user?.email ?? '';
  const mobile = sanitizeMobile(b.mobile ?? b.verifiedMobile ?? user?.phone ?? '', { keepLast: true });
  return {
    ...EMPTY_BASIC_INFO,
    propertyName: text(b.propertyName),
    rating: b.rating ?? '',
    builtYear: text(b.builtYear),
    bookingSince: text(b.bookingSince),
    channelManager: yesNo(b.channelManager),
    providerName: text(b.providerName),
    email,
    mobile,
    landline: text(b.landline),
    emailVerified: sameEmail(email, b.verifiedEmail),
    mobileVerified: sameMobile(mobile, b.verifiedMobile),
  };
}

export const saveBasic = (id, info) => partnerApi.put(`${base(id)}/basic`, {
  propertyName: info.propertyName,
  rating: Number(info.rating),
  builtYear: Number(info.builtYear),
  bookingSince: Number(info.bookingSince),
  channelManager: info.channelManager === 'yes',
  providerName: info.channelManager === 'yes' ? optional(info.providerName) : undefined,
  email: info.email,
  mobile: info.mobile,
  landline: optional(info.landline),
});

// ---------- location ----------
export const locationFromApi = (l) => ({
  ...EMPTY_LOCATION_INFO,
  ...Object.fromEntries(['apartmentName', 'area', 'pincode', 'country', 'state', 'city', 'latitude', 'longitude'].map((k) => [k, text(l[k])])),
  addressConfirmed: Boolean(l.addressConfirmed),
});

export function saveLocation(id, info) {
  const { apartmentName, area, pincode, country, state, city, addressConfirmed } = info;
  const hasPin = String(info.latitude ?? '') !== '' && String(info.longitude ?? '') !== '';
  return partnerApi.put(`${base(id)}/location`, {
    apartmentName, area, pincode, country, state, city, addressConfirmed,
    ...(hasPin ? { latitude: Number(info.latitude), longitude: Number(info.longitude) } : {}),
  });
}

// ---------- amenities ----------
// The API sends and stores ONLY the amenities the property provides (a list of codes); "No" is never sent
// or stored. The form still shows Yes/No per item: anything not in the saved list shows as "No".
// null = the step was never saved (nothing answered yet).
const providedToAnswers = (provided, items) => {
  if (!Array.isArray(provided)) return {};
  const yes = new Set(provided);
  return Object.fromEntries(items.map((item) => [item.id, yes.has(item.id) ? 'yes' : 'no']));
};
/** Codes answered "Yes" (each once, even when it shows in several categories). */
const providedCodes = (answers) => [...new Set(answers.filter(([, v]) => v === 'yes').map(([code]) => code))];

export const amenitiesFromApi = (provided) => Object.fromEntries(AMENITY_CATEGORIES.map(({ id, items }) => [
  id,
  providedToAnswers(provided, items),
]));

export const saveAmenities = (id, info) => partnerApi.put(`${base(id)}/amenities`, {
  amenities: providedCodes(AMENITY_CATEGORIES.flatMap((category) => category.items.map(
    (item) => [item.id, info[category.id]?.[item.id]],
  ))),
});

// ---------- rooms ----------
const ROOM_TEXT = ['roomType', 'roomView', 'roomSizeUnit', 'roomName', 'bedType', 'mealOption'];
const ROOM_NUMBERS = ['roomSize', 'roomCount', 'maxGuests', 'bathroomCount', 'pricePerGuest'];

export const roomFromApi = (room) => ({
  ...EMPTY_ROOMS_INFO,
  ...Object.fromEntries([...ROOM_TEXT, ...ROOM_NUMBERS].map((k) => [k, text(room[k])])),
  amenities: providedToAnswers(room.amenities, ROOM_AMENITY_ITEMS),
});

export function saveRoom(id, roomId, info) {
  const body = {
    ...Object.fromEntries(ROOM_TEXT.map((k) => [k, info[k]])),
    ...Object.fromEntries(ROOM_NUMBERS.map((k) => [k, Number(info[k])])),
    // Only the room amenities this room provides.
    amenities: providedCodes(ROOM_AMENITY_ITEMS.map((item) => [item.id, info.amenities?.[item.id]])),
  };
  return roomId ? partnerApi.put(`${base(id)}/rooms/${roomId}`, body) : partnerApi.post(`${base(id)}/rooms`, body);
}
export const deleteRoom = (id, roomId) => partnerApi.del(`${base(id)}/rooms/${roomId}`);

/** Rooms & Rateplans: the full room body (beds, occupancy, charges) -> property detail. */
export const saveRoomFull = (id, roomId, body) => (roomId
  ? partnerApi.put(`${base(id)}/rooms/${roomId}`, body)
  : partnerApi.post(`${base(id)}/rooms`, body));
export const setRoomStatus = (id, roomId, active) => partnerApi.put(`${base(id)}/rooms/${roomId}/status`, { active });
export const createRatePlan = (id, roomId, body) => partnerApi.post(`${base(id)}/rooms/${roomId}/rate-plans`, body);
export const updateRatePlan = (id, roomId, planId, body) => partnerApi.patch(`${base(id)}/rooms/${roomId}/rate-plans/${planId}`, body);
export const deleteRatePlan = (id, roomId, planId) => partnerApi.del(`${base(id)}/rooms/${roomId}/rate-plans/${planId}`);

// ---------- photos & videos (saved as they are added) ----------
const mediaFromApi = (m) => ({ ...m, tag: m.tag ?? '', width: m.width ?? 0, height: m.height ?? 0 });

export function photosFromApi(p) {
  const images = p.images.map(mediaFromApi);
  return {
    coverImage: p.cover ? { ...mediaFromApi(p.cover), sourceId: images.some((i) => i.id === p.cover.id) ? p.cover.id : '' } : null,
    images,
    videos: p.videos.map(mediaFromApi),
  };
}

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const IMAGE_ACCEPT = IMAGE_TYPES.join(',');
export const VIDEO_ACCEPT = 'video/mp4,video/quicktime,video/webm';
export const DOCUMENT_ACCEPT = `application/pdf,${IMAGE_ACCEPT}`;
export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 100 * 1024 * 1024;

function formWith(file, fields = {}) {
  const form = new FormData();
  Object.entries(fields).forEach(([k, v]) => form.append(k, v)); // fields go before the file
  form.append('file', file);
  return form;
}
export const uploadImage = (id, file, use) => partnerApi.post(`${base(id)}/images`, undefined, { form: formWith(file, { use }) });
export const uploadVideo = (id, file) => partnerApi.post(`${base(id)}/videos`, undefined, { form: formWith(file) });
export const setImageTag = (id, mediaId, tag) => partnerApi.patch(`${base(id)}/media/${mediaId}`, { tag });
export const setCover = (id, mediaId) => partnerApi.put(`${base(id)}/cover`, { mediaId });
export const deleteMedia = (id, mediaId) => partnerApi.del(`${base(id)}/media/${mediaId}`);
/** Tag, caption, roomTypeId / restaurantId (null unlinks). */
export const updateMedia = (id, mediaId, body) => partnerApi.patch(`${base(id)}/media/${mediaId}`, body);
export const reorderMedia = (id, ids) => partnerApi.put(`${base(id)}/media-order`, { ids });

// ---------- policies ----------
export function policiesFromApi(p) {
  if (!p) return normalizePoliciesDraft({});
  return normalizePoliciesDraft(Object.fromEntries(Object.entries(p).map(([key, value]) => {
    if (POLICY_YES_NO_FIELDS.includes(key)) return [key, yesNo(value)];
    return [key, Array.isArray(value) ? value : text(value)];
  })));
}

export function savePolicies(id, info) {
  const body = { ...normalizePoliciesDraft(info) };
  POLICY_YES_NO_FIELDS.forEach((key) => { body[key] = body[key] === '' ? undefined : body[key] === 'yes'; });
  ['breakfastPrice', 'lunchPrice', 'dinnerPrice'].forEach((key) => { body[key] = Number(body[key]); });
  ['infantFoodItems', 'adultExtraBedType'].forEach((key) => { body[key] = optional(body[key]); });
  return partnerApi.put(`${base(id)}/policies`, body);
}

// ---------- financial & legal ----------
export const saveLegal = (id, form) => partnerApi.put(`${base(id)}/legal`, {
  legalName: form.legalName,
  pan: optional(form.pan),
  hasGst: form.hasGst === 'yes',
  gstin: form.hasGst === 'yes' ? optional(form.gstin) : undefined,
  accountHolder: form.accountHolder,
  bankName: form.bankName,
  accountNumber: optional(form.accountNumber),
  ifsc: form.ifsc,
  declaration: form.declaration,
});
// Property Information > Financial & Bank Details (each call answers with the whole finance view).
export const getFinance = (id) => partnerApi.get(`${info(id)}/finance`);
export const saveFinancePayout = (id, body) => partnerApi.put(`${info(id)}/finance/payout`, body);
// A 6-digit code to the sign-in e-mail, needed to change the bank account of a listed property.
export const requestBankChangeCode = (id) => partnerApi.post(`${info(id)}/finance/payout/code`, {});
export const getFinanceActivity = (id) => partnerApi.get(`${info(id)}/finance/activity`);
export const verifyFinanceBank = (id) => partnerApi.post(`${info(id)}/finance/bank-verification`, { consent: true });
export const saveFinanceTax = (id, body) => partnerApi.put(`${info(id)}/finance/tax`, body);
export const saveFinanceCompliance = (id, body) => partnerApi.put(`${info(id)}/finance/compliance`, body);
export const confirmFinance = (id) => partnerApi.post(`${info(id)}/finance/confirm`, { declaration: true });
// Property Information > Settings (each call answers with the whole settings view).
const settingsPath = (id) => `${info(id)}/settings`;
export const getPropertySettings = (id) => partnerApi.get(settingsPath(id));
export const savePropertyPreferences = (id, body) => partnerApi.put(`${settingsPath(id)}/preferences`, body);
// purpose: 'api-token' | 'vcc-reset' — a 6-digit code to the sign-in e-mail.
export const requestSettingsCode = (id, purpose) => partnerApi.post(`${settingsPath(id)}/code`, { purpose });
// Answers { token, settings }: the token is shown only this once.
export const createApiToken = (id, body) => partnerApi.post(`${settingsPath(id)}/api-tokens`, body);
export const revokeApiToken = (id, tokenId) => partnerApi.del(`${settingsPath(id)}/api-tokens/${tokenId}`);
export const setVccPassword = (id, body) => partnerApi.put(`${settingsPath(id)}/vcc-password`, body);
export const deactivateProperty = (id, reason) => partnerApi.post(`${settingsPath(id)}/deactivate`, reason ? { reason } : {});
export const reactivateProperty = (id) => partnerApi.post(`${settingsPath(id)}/reactivate`, {});
export const uploadDocument = (id, type, file) => partnerApi.upload(`${base(id)}/documents/${type}`, formWith(file));
export const deleteDocument = (id, type) => partnerApi.del(`${base(id)}/documents/${type}`);

// ---------- private files: fetched with the token and shown as blob: URLs ----------
export async function loadFile(path) {
  const response = await partnerApi.raw(path.replace(API_PREFIX, ''));
  if (!(response instanceof Response)) throw new Error('This file could not be loaded.');
  return response.blob();
}

/** blob: URL of a private file ('' while loading or when it failed); revoked when no longer used. */
export function usePrivateUrl(path) {
  const [state, setState] = useState({ path: '', url: '', failed: false });
  useEffect(() => {
    if (!path) return undefined;
    let active = true;
    let url = '';
    loadFile(path)
      .then((blob) => {
        if (!active) return;
        url = URL.createObjectURL(blob);
        setState({ path, url, failed: false });
      })
      .catch(() => { if (active) setState({ path, url: '', failed: true }); });
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [path]);
  return state.path === path ? state : { path, url: '', failed: false };
}

/** API field errors -> { field: 'Label must be …' } for showing under the inputs. */
export function formErrors(error, labels = {}) {
  return Object.fromEntries(Object.entries(error?.fieldErrors ?? {}).map(([field, message]) => {
    const label = labels[field] ?? 'This';
    return [field, /^[A-Z]/.test(message) ? message : `${label} ${message}.`];
  }));
}
