const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const MIN_REQUEST_INTERVAL_MS = 1000;
let lastRequestAt = 0;

function waitForRequestSlot() {
  const wait = Math.max(0, lastRequestAt + MIN_REQUEST_INTERVAL_MS - Date.now());
  lastRequestAt = Date.now() + wait;
  if (!wait) return Promise.resolve();
  return new Promise((resolve) => { setTimeout(resolve, wait); });
}

function firstValue(...values) {
  const value = values.find((item) => typeof item === 'string' && item.trim());
  return value ? value.trim() : '';
}

function normalisePincode(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return /^\d{6}$/.test(digits) ? digits : '';
}

function geolocationMessage(error) {
  if (error?.code === 1) return 'Location permission was denied. Enable it in your browser settings or enter the address manually.';
  if (error?.code === 2) return 'Your location is unavailable right now. Please try again or enter the address manually.';
  if (error?.code === 3) return 'Location lookup timed out. Please try again or enter the address manually.';
  return 'We could not read your location. Please try again or enter the address manually.';
}

export function getCurrentCoordinates() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Location services are not available in this browser. Please enter the address manually.'));
      return;
    }
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      reject(new Error('Location services need a secure HTTPS connection. Please enter the address manually.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const latitude = Number(coords.latitude);
        const longitude = Number(coords.longitude);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          reject(new Error('We could not read your location. Please try again or enter the address manually.'));
          return;
        }
        resolve({ latitude, longitude });
      },
      (error) => reject(new Error(geolocationMessage(error))),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
}

export async function reverseGeocode({ latitude, longitude }) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('A valid location is needed to look up the address.');
  }
  await waitForRequestSlot();
  const params = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    zoom: '18',
    lat: String(latitude),
    lon: String(longitude),
  });
  let response;
  try {
    response = await fetch(`${NOMINATIM_REVERSE_URL}?${params}`);
  } catch {
    throw new Error('Could not reach the address lookup service. Check your connection and try again.');
  }
  if (!response.ok) {
    throw new Error('Address lookup is temporarily unavailable. Please enter the address manually.');
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Address lookup returned an invalid response. Please enter the address manually.');
  }
  if (!data || typeof data !== 'object' || data.error || !data.address) {
    throw new Error('No address was found for this location. Please enter it manually.');
  }
  return data;
}

export async function forwardGeocode(query, { allowNoResult = false } = {}) {
  const cleaned = String(query ?? '').trim();
  if (!cleaned) {
    throw new Error('Enter an address before searching on the map.');
  }
  await waitForRequestSlot();
  const params = new URLSearchParams({
    q: cleaned,
    format: 'jsonv2',
    addressdetails: '1',
    limit: '1',
  });
  let response;
  try {
    response = await fetch(`${NOMINATIM_SEARCH_URL}?${params}`);
  } catch {
    throw new Error('Could not reach the address lookup service. Check your connection and try again.');
  }
  if (response.status === 429) {
    throw new Error('Address lookup is busy right now. Wait a moment and try again.');
  }
  if (!response.ok) {
    throw new Error('Address lookup is temporarily unavailable. Please try again.');
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Address lookup returned an invalid response. Please try again.');
  }
  if (!Array.isArray(data) || data.length === 0) {
    if (allowNoResult) return null;
    throw new Error('No location found for that address. Check the fields and try again.');
  }
  const latitude = Number(data[0]?.lat);
  const longitude = Number(data[0]?.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('No valid location was found for that address. Please try again.');
  }
  return { latitude, longitude };
}

function queryFrom(info, keys) {
  return keys
    .map((key) => String(info?.[key] ?? '').trim())
    .filter(Boolean)
    .join(', ');
}

export function buildAddressQuery(info) {
  return queryFrom(info, ['apartmentName', 'area', 'pincode', 'city', 'state', 'country']);
}

export function isAddressMapReady(info) {
  const pincode = String(info?.pincode ?? '').trim();
  const city = String(info?.city ?? '').trim();
  const country = String(info?.country ?? '').trim();
  return /^\d{6}$/.test(pincode) && Boolean(city || country);
}

export async function forwardGeocodeAddressInfo(info) {
  const candidates = [
    buildAddressQuery(info),
    queryFrom(info, ['area', 'pincode', 'city', 'state', 'country']),
    queryFrom(info, ['pincode', 'city', 'state', 'country']),
    queryFrom(info, ['pincode', 'country']),
  ];
  const unique = [...new Set(candidates.filter(Boolean))];
  for (const query of unique) {
    const coordinates = await forwardGeocode(query, { allowNoResult: true });
    if (coordinates) return coordinates;
  }
  throw new Error('No location found for that address. Check the fields and try again.');
}

export function addressToLocationFields(result) {
  const address = result?.address ?? {};
  const road = firstValue(address.road, address.pedestrian, address.footway);
  const houseNumber = firstValue(address.house_number);
  return {
    apartmentName: firstValue(
      address.house_name,
      address.building,
      houseNumber && road ? `${houseNumber} ${road}` : '',
      houseNumber,
      road,
    ),
    area: firstValue(
      address.neighbourhood,
      address.suburb,
      address.city_district,
      address.district,
      address.quarter,
      address.residential,
      road,
    ),
    pincode: normalisePincode(address.postcode),
    country: firstValue(address.country),
    state: firstValue(address.state, address.region, address.county),
    city: firstValue(address.city, address.town, address.village, address.municipality, address.county, address.state_district),
  };
}

export function buildOsmEmbedUrl({ latitude, longitude }) {
  const delta = 0.006;
  const lat = Number(latitude).toFixed(6);
  const lng = Number(longitude).toFixed(6);
  const bbox = [
    (Number(longitude) - delta).toFixed(6),
    (Number(latitude) - delta).toFixed(6),
    (Number(longitude) + delta).toFixed(6),
    (Number(latitude) + delta).toFixed(6),
  ].join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}
