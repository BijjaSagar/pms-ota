// Property Information > Settings: labels and helpers for the settings view from the API.
// Nothing is kept in browser storage; a new access token is shown once and then only its last 4.

export const PREFERENCE_ITEMS = [
  ['onlineBookings', 'Accept online bookings', 'Allow guests to book this property on TriponX. Off keeps the listing but stops new bookings.'],
  ['emailAlerts', 'Email notifications', 'Receive booking and payment alerts by email.'],
  ['smsAlerts', 'SMS alerts', 'Receive urgent booking alerts by SMS.'],
  ['priceAlerts', 'Rate change alerts', 'Get notified when market rates shift significantly.'],
];

export const DEFAULT_PREFERENCES = {
  onlineBookings: true,
  emailAlerts: true,
  smsAlerts: false,
  priceAlerts: true,
};

export const FIELD_LABELS = {
  label: 'Token name',
  otp: 'Code',
  currentPassword: 'Current VCC password',
  newPassword: 'New password',
  confirmPassword: 'Confirm password',
  reason: 'Reason',
};

// Same rule as the API: letters, digits, spaces and . _ -
const TOKEN_LABEL_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} ._-]*$/u;

export function tokenLabelError(label) {
  const text = String(label ?? '').trim();
  if (text.length < 2) return 'Give the token a name (at least 2 characters).';
  if (text.length > 40) return 'Use at most 40 characters.';
  if (!TOKEN_LABEL_PATTERN.test(text)) return 'Use letters, digits, spaces and . _ - only.';
  return '';
}

export function reasonError(reason) {
  const text = String(reason ?? '').trim();
  if (text.length > 300) return 'Use at most 300 characters.';
  if (/[<>{}`]/.test(text)) return 'Remove < > { } and ` from the reason.';
  return '';
}

export function channelManagerSummary(view) {
  const cm = view?.channelManager ?? {};
  if (cm.uses === true) return cm.name ? `Yes · ${cm.name}` : 'Yes';
  if (cm.uses === false) return 'No';
  return 'Not configured';
}

export function formatTimestamp(value) {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}
