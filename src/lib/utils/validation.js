// Ported from pms-ota/src/utils/validation.ts (types removed, logic unchanged).
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}
function isValidPhone(value) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}
function formatCardNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}
function cardDigits(value) {
  return value.replace(/\D/g, "");
}
function isValidCardNumber(value) {
  const digits = cardDigits(value);
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}
function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}
function isValidExpiry(value) {
  const match = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!match) return false;
  const month = Number(match[1]);
  const year = Number(match[2]);
  if (month < 1 || month > 12) return false;
  const now = /* @__PURE__ */ new Date();
  const expiry = new Date(2e3 + year, month, 0, 23, 59, 59);
  return expiry.getTime() > now.getTime();
}
function isValidCvc(value) {
  return /^\d{3,4}$/.test(value);
}
function detectCardBrand(value) {
  const digits = cardDigits(value);
  if (/^4/.test(digits)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  if (/^6(?:011|5)/.test(digits)) return "Discover";
  return "Card";
}
function luhnHint(value) {
  if (!value) return null;
  return isValidCardNumber(value) ? null : "Please enter a valid card number.";
}
function generateReference() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `TPX-${suffix}`;
}
export {
  cardDigits,
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  generateReference,
  isValidCardNumber,
  isValidCvc,
  isValidEmail,
  isValidExpiry,
  isValidPhone,
  luhnHint
};
