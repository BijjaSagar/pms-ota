// Window event fired whenever the traveller (main site) session ends: Log out, another tab logging out,
// or the session expiring / being revoked from another device. Providers that keep personal data in the
// browser (trips, booking details) listen and clear it.
export const TRAVELLER_SIGNED_OUT = 'triponx:traveller-signed-out';

export function announceTravellerSignedOut() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(TRAVELLER_SIGNED_OUT));
}
