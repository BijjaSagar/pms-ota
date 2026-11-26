// HTTP client for the TriponX NestJS API (/api/v1).
//
// Sign-in model (same for travellers and Partner Hub, each with its own session):
//   - a short-lived access token (15 min) is kept IN MEMORY only (never localStorage: XSS-safe), sent as Bearer;
//   - the long-lived refresh token is an httpOnly cookie the browser sends to /auth/refresh by itself;
//   - before the token runs out, or after a 401, we call /refresh once and retry the request.
// The backend ends a session when an old refresh cookie is reused, so refreshes are single-flight.

const BASE = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/+$/, '');
/** The API root, for building URLs of public files (e.g. hotel photos). */
export const API_BASE = BASE;
const REFRESH_EARLY_MS = 30 * 1000; // renew a little before expiry

export class ApiError extends Error {
  constructor(status, body = {}) {
    const raw = body.message;
    const message = Array.isArray(raw) ? raw.join(' ') : raw;
    super(message || defaultMessage(status));
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    // { email: 'must be a valid email address', ... } — for showing under the right input
    this.fieldErrors = Object.fromEntries((body.errors ?? []).map((e) => [e.field, e.message]));
    this.retryAfterSeconds = body.retryAfterSeconds;
  }
}

function defaultMessage(status) {
  if (status === 0) return 'Can’t reach the server. Check your connection and try again.';
  if (status === 429) return 'Too many attempts. Please wait a minute and try again.';
  if (status === 401) return 'Your session has ended. Please sign in again.';
  if (status === 403) return 'You don’t have access to this.';
  if (status === 404) return 'Not found.';
  if (status >= 500) return 'Something went wrong on our side. Please try again in a moment.';
  return 'Something went wrong. Please try again.';
}

/** A field message from the API reads "must be …"; prefix a label so it stands alone under an input. */
export function fieldMessage(error, field, label) {
  const msg = error?.fieldErrors?.[field];
  if (!msg) return '';
  return /^[A-Z]/.test(msg) ? msg : `${label} ${msg}`.replace(/\s+/g, ' ');
}

async function send(path, { method = 'GET', body, token, form, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form; // FormData: the browser sets the multipart boundary
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }

  let response;
  try {
    response = await fetch(`${BASE}${path}`, { method, headers, body: payload, credentials: 'include', signal });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new ApiError(0);
  }
  if (response.status === 204) return null;
  const type = response.headers.get('content-type') ?? '';
  const data = type.includes('application/json') ? await response.json().catch(() => ({})) : null;
  if (!response.ok) {
    const err = new ApiError(response.status, data ?? {});
    const retry = Number(response.headers.get('Retry-After'));
    if (!err.retryAfterSeconds && retry) err.retryAfterSeconds = retry;
    throw err;
  }
  return data ?? response;
}

/** Calls that need no sign-in (sign-up, login, OTP …). */
export const publicApi = {
  get: (path, opts) => send(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => send(path, { ...opts, method: 'POST', body }),
};

/**
 * One signed-in session (traveller or partner).
 * refreshPath: '/auth/refresh' or '/partner/auth/refresh'.
 * onRefreshed(body): the refresh response (partner refresh also returns the partner).
 * onLost(): the session can't be renewed any more (signed out elsewhere, expired …).
 */
/** Runs `task` while holding a browser-wide lock (Web Locks API); just runs it where that API is missing. */
function oneTabAtATime(name, task) {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  return locks?.request ? locks.request(name, task) : task();
}

export function createSession({ refreshPath, onRefreshed, onLost }) {
  let token = null;
  let expiresAt = 0;
  let refreshing = null;

  const set = (data) => {
    token = data?.accessToken ?? null;
    expiresAt = data?.expiresAt ? Date.parse(data.expiresAt) : 0;
  };
  const clear = () => { token = null; expiresAt = 0; };

  // Single-flight: every caller in this tab waits for the same /refresh. Across tabs, a Web Lock (in memory,
  // nothing stored) makes tabs refresh one after another, so each sends the newest refresh cookie. The server
  // also accepts the just-replaced cookie for a moment, so a tab that still races is never signed out.
  const refresh = () => {
    if (!refreshing) {
      refreshing = oneTabAtATime(`triponx-refresh:${refreshPath}`, () => send(refreshPath, { method: 'POST' }))
        .then((data) => { set(data); onRefreshed?.(data); return data; })
        .catch((error) => { clear(); throw error; })
        .finally(() => { refreshing = null; });
    }
    return refreshing;
  };

  const ensureToken = async () => {
    if (refreshing) await refreshing.catch(() => {});
    if (token && Date.now() < expiresAt - REFRESH_EARLY_MS) return token;
    await refresh();
    return token;
  };

  const lost = (error) => {
    clear();
    onLost?.(error);
  };

  async function request(path, opts = {}) {
    let current;
    try {
      current = await ensureToken();
    } catch (error) {
      if (error.status === 401 || error.status === 403) lost(error);
      throw error.status === 401 ? new ApiError(401) : error;
    }
    try {
      return await send(path, { ...opts, token: current });
    } catch (error) {
      if (error.status !== 401) throw error;
      // Token revoked or expired early: renew once and retry.
      try {
        await refresh();
      } catch (refreshError) {
        lost(refreshError);
        throw new ApiError(401);
      }
      return send(path, { ...opts, token });
    }
  }

  return {
    set,
    clear,
    refresh,
    hasToken: () => Boolean(token),
    get: (path, opts) => request(path, { ...opts, method: 'GET' }),
    post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
    patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
    put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
    del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
    upload: (path, form, opts) => request(path, { ...opts, method: 'PUT', form }),
    /** For binary responses (profile photo). Returns the raw Response. */
    raw: (path, opts) => request(path, { ...opts, method: 'GET' }),
  };
}
