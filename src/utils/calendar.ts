import type { Booking } from '../types'

function escapeIcs(value: string) {
  return value.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')
}

export function buildCalendarFile(booking: Booking): string {
  const start = booking.search.checkIn.replace(/-/g, '')
  const end = booking.search.checkOut.replace(/-/g, '')
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Aurelia//Hotel Booking//EN',
    'BEGIN:VEVENT',
    `UID:${booking.reference}@aurelia.travel`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${escapeIcs(`${booking.hotel.name} — ${booking.room.name}`)}`,
    `LOCATION:${escapeIcs(booking.hotel.address)}`,
    `DESCRIPTION:${escapeIcs(
      `Booking reference ${booking.reference}. Check-in ${booking.hotel.policies.checkIn}.`,
    )}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadCalendarFile(booking: Booking) {
  const content = buildCalendarFile(booking)
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `aurelia-${booking.reference}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
