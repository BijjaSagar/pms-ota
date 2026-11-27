export const PROPERTY_SETTINGS_STORAGE_KEY = 'triponx.partner.propertySettings';

export const DEFAULT_PROPERTY_SETTINGS = {
  onlineBookings: true,
  emailAlerts: true,
  smsAlerts: false,
  priceAlerts: true,
  deactivated: false,
  vccPasswordSet: false,
  vccUpdatedAt: '',
};

const storageKey = (propertyId) => `${PROPERTY_SETTINGS_STORAGE_KEY}.${propertyId}.v1`;

export function createDemoAccessToken(property) {
  const seed = String(property?.reference ?? property?.id ?? 'property')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') || 'property';
  return `tx_demo_${seed}_${seed.split('').reverse().join('')}`;
}

export function maskAccessToken(token) {
  const text = String(token ?? '');
  if (!text) return '—';
  if (text.length <= 8) return text;
  return `${text.slice(0, 3)}${'•'.repeat(Math.min(10, text.length - 7))}${text.slice(-4)}`;
}

export function loadPropertySettings(propertyId) {
  try {
    const stored = window.sessionStorage.getItem(storageKey(propertyId));
    return stored ? { ...DEFAULT_PROPERTY_SETTINGS, ...JSON.parse(stored) } : DEFAULT_PROPERTY_SETTINGS;
  } catch {
    return DEFAULT_PROPERTY_SETTINGS;
  }
}

export function savePropertySettings(propertyId, settings) {
  try {
    window.sessionStorage.setItem(storageKey(propertyId), JSON.stringify(settings));
  } catch {
    return;
  }
}

export function effectiveStatus(property, settings) {
  if (settings.deactivated) return 'SUSPENDED';
  return property?.status || 'DRAFT';
}

export function hotelCode(property) {
  return property?.reference || property?.hotelCode || property?.id || '—';
}

export function channelManagerSummary(property) {
  const basic = property?.basic && typeof property.basic === 'object' ? property.basic : {};
  const enabled = basic.channelManager ?? property?.channelManager;
  const provider = basic.providerName ?? property?.providerName;
  if (enabled === true || enabled === 'yes') return provider ? `Yes · ${provider}` : 'Yes';
  if (enabled === false || enabled === 'no') return 'No';
  return 'Not configured';
}

export function createdByUser(property, user) {
  const createdBy = property?.createdBy;
  const name = typeof createdBy === 'object' && createdBy !== null
    ? createdBy.name || createdBy.fullName || createdBy.email
    : createdBy;
  if (name) return name;
  return user?.name || user?.fullName || user?.email || '—';
}

export function formatTimestamp(value) {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}
