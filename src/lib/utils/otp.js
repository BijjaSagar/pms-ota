// Demo OTP: until a real SMS/email provider is wired up, the code is today's date as DDMMYY
// (e.g. 18 Nov 2026 -> 181126). Swap `verifyOtp` for an API call when the backend is ready.
export const OTP_LENGTH = 6;

export function todayOtp(date = new Date()) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}${mm}${yy}`;
}

export function verifyOtp(code) {
  return String(code).trim() === todayOtp();
}
