import { OTA_CONTACT, formatStayDate } from '../data/sampleBookings.js';

export const VOUCHER_RATES = {
  commission: 0.15,
  gstOnCommission: 0.18,
  tcs: 0.01,
  tds: 0.02,
};

const amountOf = (value) => Math.round(Number(value) || 0);

export function buildVoucher(booking, property) {
  const rawRooms = booking.rooms?.length
    ? booking.rooms
    : [{
      name: booking.room,
      type: 'Standard room',
      adults: booking.adults,
      kids: booking.kids,
      mealPlan: booking.plan,
      charges: booking.amount,
    }];

  const fallbackCharges = {
    roomCharges: booking.amount,
    extraAdultChildCharges: 0,
    propertyTaxes: 0,
    serviceCharges: 0,
    promotion: null,
  };
  const sourceCharges = booking.charges ?? fallbackCharges;
  const roomCharges = amountOf(sourceCharges.roomCharges);
  const extraAdultChildCharges = amountOf(sourceCharges.extraAdultChildCharges);
  const propertyTaxes = amountOf(sourceCharges.propertyTaxes);
  const serviceCharges = amountOf(sourceCharges.serviceCharges);
  const promotion = sourceCharges.promotion
    ? { label: sourceCharges.promotion.label, amount: amountOf(sourceCharges.promotion.amount) }
    : { label: 'No promotion applied', amount: 0 };
  const propertyGrossCharges = roomCharges + extraAdultChildCharges + propertyTaxes + serviceCharges - promotion.amount;

  const allocated = { room: 0, extra: 0, tax: 0, service: 0, promo: 0 };
  const rooms = rawRooms.map((room, index) => {
    const isLast = index === rawRooms.length - 1;
    const roomShare = isLast
      ? roomCharges - allocated.room
      : amountOf(room.charges ?? roomCharges / rawRooms.length);
    const ratio = roomCharges ? roomShare / roomCharges : 1 / rawRooms.length;
    const extraShare = isLast ? extraAdultChildCharges - allocated.extra : amountOf(extraAdultChildCharges * ratio);
    const taxShare = isLast ? propertyTaxes - allocated.tax : amountOf(propertyTaxes * ratio);
    const serviceShare = isLast ? serviceCharges - allocated.service : amountOf(serviceCharges * ratio);
    const promoShare = isLast ? promotion.amount - allocated.promo : amountOf(promotion.amount * ratio);
    allocated.room += roomShare;
    allocated.extra += extraShare;
    allocated.tax += taxShare;
    allocated.service += serviceShare;
    allocated.promo += promoShare;
    return {
      ...room,
      roomCharges: roomShare,
      extraAdultChildCharges: extraShare,
      propertyTaxes: taxShare,
      serviceCharges: serviceShare,
      promotion: promoShare,
      net: roomShare + extraShare + taxShare + serviceShare - promoShare,
    };
  });

  const adultCount = rooms.reduce((total, room) => total + amountOf(room.adults), 0) || amountOf(booking.adults);
  const childCount = rooms.reduce((total, room) => total + amountOf(room.kids), 0) || amountOf(booking.kids);
  const commission = amountOf(propertyGrossCharges * VOUCHER_RATES.commission);
  const gstOnCommission = amountOf(commission * VOUCHER_RATES.gstOnCommission);
  const commissionInclGst = commission + gstOnCommission;
  const tcs = amountOf(commission * VOUCHER_RATES.tcs);
  const tds = amountOf(commission * VOUCHER_RATES.tds);
  const payableToProperty = propertyGrossCharges - commissionInclGst + tcs + tds;

  return {
    booking,
    propertyName: property?.propertyName ?? 'this property',
    propertyCity: property?.city ?? '',
    otaName: booking.otaName ?? OTA_CONTACT.name,
    pnr: booking.pnr ?? booking.reference,
    bookedOn: formatStayDate(booking.bookedOn ?? booking.checkIn),
    reference: booking.reference,
    bookingStatus: booking.status,
    paymentStatus: booking.payment.state,
    bookedVia: `${booking.channel} · ${booking.source}`,
    bookingType: booking.bookingType,
    gstInvoice: booking.gstInvoice,
    guestName: booking.guest.name,
    guestEmail: booking.guest.email,
    guestPhone: booking.guest.phone,
    guestCity: booking.guest.city,
    checkIn: formatStayDate(booking.checkIn),
    checkOut: formatStayDate(booking.checkOut),
    nights: booking.nights,
    adultCount,
    childCount,
    guestCount: adultCount + childCount,
    rooms,
    inclusions: booking.inclusions ?? [],
    cancellationPolicy: booking.cancellationPolicy ?? 'Cancellation policy unavailable.',
    paymentMode: booking.payment.mode,
    paymentLast4: booking.payment.last4,
    contact: OTA_CONTACT,
    grossPayment: amountOf(booking.amount),
    roomCharges,
    extraAdultChildCharges,
    propertyTaxes,
    serviceCharges,
    promotion,
    propertyGrossCharges,
    commission,
    gstOnCommission,
    commissionInclGst,
    tcs,
    tds,
    payableToProperty,
    grandTotal: propertyGrossCharges,
  };
}
