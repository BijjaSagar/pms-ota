// Partner Hub password rules — the same rules the API enforces (8-64 characters, a letter, a number and a
// special character, no spaces). Passwords are only ever sent to the API over HTTPS and hashed there.

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 64;

// Each rule: [test, short label shown in the checklist]
export const PASSWORD_RULES = [
  [(p) => p.length >= PASSWORD_MIN && p.length <= PASSWORD_MAX, `${PASSWORD_MIN}-${PASSWORD_MAX} characters`],
  [(p) => /[A-Za-z]/.test(p), 'A letter'],
  [(p) => /\d/.test(p), 'A number'],
  [(p) => /[^A-Za-z0-9\s]/.test(p), 'A special character'],
  [(p) => p.length > 0 && !/\s/.test(p), 'No spaces'],
];

export const isStrongPassword = (p) => PASSWORD_RULES.every(([test]) => test(p));
