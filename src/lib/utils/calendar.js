// Ported from pms-ota/src/utils/calendar.ts (types removed, logic unchanged).
function escapeIcs(value) {
  return value.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}
function buildCalendarFile(booking) {
  const start = booking.search.checkIn.replace(/-/g, "");
  const end = booking.search.checkOut.replace(/-/g, "");
  const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TriponX//Hotel Booking//EN",
    "BEGIN:VEVENT",
    `UID:${booking.reference}@triponx.travel`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${escapeIcs(`${booking.hotel.name} \u2014 ${booking.room.name}`)}`,
    `LOCATION:${escapeIcs(booking.hotel.address)}`,
    `DESCRIPTION:${escapeIcs(
      `Booking reference ${booking.reference}. Check-in ${booking.hotel.policies.checkIn}.`
    )}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}
function downloadCalendarFile(booking) {
  const content = buildCalendarFile(booking);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `triponx-${booking.reference}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
export {
  buildCalendarFile,
  downloadCalendarFile
};
