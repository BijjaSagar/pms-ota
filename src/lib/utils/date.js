// Ported from pms-ota/src/utils/date.ts (types removed, logic unchanged).
function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function parseISODate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}
function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 1;
  const start = parseISODate(checkIn).getTime();
  const end = parseISODate(checkOut).getTime();
  const nights = Math.round((end - start) / (1e3 * 60 * 60 * 24));
  return Math.max(1, nights);
}
function formatDate(value, style = "medium") {
  if (!value) return "";
  const date = parseISODate(value);
  const options = style === "short" ? { month: "short", day: "numeric" } : style === "long" ? { weekday: "long", month: "long", day: "numeric", year: "numeric" } : { weekday: "short", month: "short", day: "numeric", year: "numeric" };
  return new Intl.DateTimeFormat("en-US", options).format(date);
}
function todayISO() {
  return toISODate(/* @__PURE__ */ new Date());
}
function defaultSearch() {
  const start = addDays(/* @__PURE__ */ new Date(), 14);
  const end = addDays(start, 3);
  return {
    destination: "",
    checkIn: toISODate(start),
    checkOut: toISODate(end),
    guests: 2,
    rooms: 1,
    adults: 2,
    kids: 0
  };
}
function freeCancellationDays(policy) {
  const days = policy.match(/until\s+(\d+)\s+days?/i);
  if (days) return Number(days[1]);
  const hours = policy.match(/until\s+(\d+)\s+hours?/i);
  if (hours) return Math.max(1, Math.ceil(Number(hours[1]) / 24));
  return 2;
}
function cancellationDeadline(checkIn, policy) {
  if (!checkIn) return "";
  return toISODate(addDays(parseISODate(checkIn), -freeCancellationDays(policy)));
}
function nightsLabel(nights) {
  return `${nights} ${nights === 1 ? "night" : "nights"}`;
}
function guestsLabel(guests, rooms) {
  return `${guests} ${guests === 1 ? "guest" : "guests"} \xB7 ${rooms} ${rooms === 1 ? "room" : "rooms"}`;
}
export {
  addDays,
  cancellationDeadline,
  defaultSearch,
  formatDate,
  freeCancellationDays,
  guestsLabel,
  nightsBetween,
  nightsLabel,
  parseISODate,
  toISODate,
  todayISO
};
