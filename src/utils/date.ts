export function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseISODate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 1
  const start = parseISODate(checkIn).getTime()
  const end = parseISODate(checkOut).getTime()
  const nights = Math.round((end - start) / (1000 * 60 * 60 * 24))
  return Math.max(1, nights)
}

export function formatDate(value: string, style: 'short' | 'medium' | 'long' = 'medium'): string {
  if (!value) return ''
  const date = parseISODate(value)
  const options: Intl.DateTimeFormatOptions =
    style === 'short'
      ? { month: 'short', day: 'numeric' }
      : style === 'long'
        ? { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
        : { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }
  return new Intl.DateTimeFormat('en-US', options).format(date)
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function defaultSearch() {
  const start = addDays(new Date(), 14)
  const end = addDays(start, 3)
  return {
    destination: '',
    checkIn: toISODate(start),
    checkOut: toISODate(end),
    guests: 2,
    rooms: 1,
    adults: 2,
    kids: 0,
  }
}

export function freeCancellationDays(policy: string): number {
  const days = policy.match(/until\s+(\d+)\s+days?/i)
  if (days) return Number(days[1])
  const hours = policy.match(/until\s+(\d+)\s+hours?/i)
  if (hours) return Math.max(1, Math.ceil(Number(hours[1]) / 24))
  return 2
}

export function cancellationDeadline(checkIn: string, policy: string): string {
  if (!checkIn) return ''
  return toISODate(addDays(parseISODate(checkIn), -freeCancellationDays(policy)))
}

export function nightsLabel(nights: number): string {
  return `${nights} ${nights === 1 ? 'night' : 'nights'}`
}

export function guestsLabel(guests: number, rooms: number): string {
  return `${guests} ${guests === 1 ? 'guest' : 'guests'} · ${rooms} ${rooms === 1 ? 'room' : 'rooms'}`
}
