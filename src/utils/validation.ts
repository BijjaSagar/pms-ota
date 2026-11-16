export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
}

export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

export function cardDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function isValidCardNumber(value: string): boolean {
  const digits = cardDigits(value)
  if (digits.length < 13 || digits.length > 19) return false
  let sum = 0
  let double = false
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i])
    if (double) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    double = !double
  }
  return sum % 10 === 0
}

export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

export function isValidExpiry(value: string): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(value)
  if (!match) return false
  const month = Number(match[1])
  const year = Number(match[2])
  if (month < 1 || month > 12) return false
  const now = new Date()
  const expiry = new Date(2000 + year, month, 0, 23, 59, 59)
  return expiry.getTime() > now.getTime()
}

export function isValidCvc(value: string): boolean {
  return /^\d{3,4}$/.test(value)
}

export type CardBrand = 'Visa' | 'Mastercard' | 'Amex' | 'Discover' | 'Card'

export function detectCardBrand(value: string): CardBrand {
  const digits = cardDigits(value)
  if (/^4/.test(digits)) return 'Visa'
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard'
  if (/^3[47]/.test(digits)) return 'Amex'
  if (/^6(?:011|5)/.test(digits)) return 'Discover'
  return 'Card'
}

export function luhnHint(value: string): string | null {
  if (!value) return null
  return isValidCardNumber(value) ? null : 'Please enter a valid card number.'
}

export function generateReference(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 6; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return `AUR-${suffix}`
}
