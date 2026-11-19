// Password rules + hashing for Partner Hub accounts.
// Front-end demo only: accounts live in localStorage until the backend exists. We still never store the
// plain password — only a SHA-256 hash salted with the (normalised) email. A real backend must hash
// server-side with a slow algorithm (bcrypt / argon2) instead.

export const PASSWORD_MIN = 8;

// Each rule: [test, short label shown in the checklist]
export const PASSWORD_RULES = [
  [(p) => p.length >= PASSWORD_MIN, `At least ${PASSWORD_MIN} characters`],
  [(p) => /[A-Za-z]/.test(p), 'A letter'],
  [(p) => /\d/.test(p), 'A number'],
  [(p) => /[^A-Za-z0-9]/.test(p), 'A special character'],
];

export const isStrongPassword = (p) => PASSWORD_RULES.every(([test]) => test(p));

export async function hashPassword(email, password) {
  const data = new TextEncoder().encode(`triponx:${email.trim().toLowerCase()}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function checkPassword(user, password) {
  if (!user?.passwordHash) return false;
  return (await hashPassword(user.email, password)) === user.passwordHash;
}
