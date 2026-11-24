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
export const listProperties = () => partnerApi.get('/partner/properties');
export const createProperty = (type) => partnerApi.post('/partner/properties', { type });
export const getProperty = (id) => partnerApi.get(base(id));
export const deleteProperty = (id) => partnerApi.del(base(id));
export const submitProperty = (id) => partnerApi.post(`${base(id)}/submit`);

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

// ---------- amenities: the API stores each amenity once; the form shows it in every category that lists it ----------
export const amenitiesFromApi = (answers = {}) => Object.fromEntries(AMENITY_CATEGORIES.map(({ id, items }) => [
  id,
  Object.fromEntries(items.filter((item) => typeof answers[item.id] === 'boolean').map((item) => [item.id, yesNo(answers[item.id])])),
]));

export const saveAmenities = (id, info) => partnerApi.put(`${base(id)}/amenities`, {
  answers: Object.fromEntries(AMENITY_CATEGORIES.flatMap((category) => category.items.map(
    (item) => [item.id, info[category.id]?.[item.id] === 'yes'],
  ))),
});

// ---------- rooms ----------
const ROOM_TEXT = ['roomType', 'roomView', 'roomSizeUnit', 'roomName', 'bedType', 'mealOption'];
const ROOM_NUMBERS = ['roomSize', 'roomCount', 'maxGuests', 'bathroomCount', 'pricePerGuest'];

export const roomFromApi = (room) => ({
  ...EMPTY_ROOMS_INFO,
  ...Object.fromEntries([...ROOM_TEXT, ...ROOM_NUMBERS].map((k) => [k, text(room[k])])),
  amenities: Object.fromEntries(ROOM_AMENITY_ITEMS.filter(({ id }) => typeof room.amenities?.[id] === 'boolean').map(({ id }) => [id, yesNo(room.amenities[id])])),
});

export function saveRoom(id, roomId, info) {
  const body = {
    ...Object.fromEntries(ROOM_TEXT.map((k) => [k, info[k]])),
    ...Object.fromEntries(ROOM_NUMBERS.map((k) => [k, Number(info[k])])),
    amenities: Object.fromEntries(ROOM_AMENITY_ITEMS.map((item) => [item.id, info.amenities?.[item.id] === 'yes'])),
  };
  return roomId ? partnerApi.put(`${base(id)}/rooms/${roomId}`, body) : partnerApi.post(`${base(id)}/rooms`, body);
}
export const deleteRoom = (id, roomId) => partnerApi.del(`${base(id)}/rooms/${roomId}`);

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
