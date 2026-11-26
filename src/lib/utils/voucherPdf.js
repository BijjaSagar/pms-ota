import { buildVoucher } from './voucher.js';

const pdfMoney = (value) => `INR ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value)}`;

export async function downloadVoucherPdf(booking, property) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const voucher = buildVoucher(booking, property);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const accent = [29, 79, 67];
  let y = margin;

  doc.setProperties({
    title: `Hotelier Voucher ${voucher.reference}`,
    subject: 'TriponX hotelier voucher',
    creator: 'TriponX Partner Hub',
  });

  const ensure = (needed) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const section = (label) => {
    ensure(13);
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(28, 43, 45);
    doc.text(label, margin, y);
    y += 7;
    doc.setDrawColor(210, 220, 215);
    doc.line(margin, y - 3, pageWidth - margin, y - 3);
    doc.setFontSize(10);
  };

  const line = (label, value, labelWidth = 54) => {
    doc.setFontSize(8.5);
    const lines = doc.splitTextToSize(String(value ?? ''), Math.max(contentWidth - labelWidth, 30));
    ensure(lines.length * 4.6 + 2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(70, 85, 85);
    doc.text(label, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(28, 43, 45);
    doc.text(lines, margin + labelWidth, y);
    y += lines.length * 4.6 + 1.5;
    doc.setFontSize(10);
  };

  const moneyLine = (label, value, strong = false) => {
    ensure(7);
    doc.setFont('helvetica', strong ? 'bold' : 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(28, 43, 45);
    doc.text(label, margin + (strong ? 0 : 4), y);
    doc.text(pdfMoney(value), pageWidth - margin, y, { align: 'right' });
    y += 6;
    doc.setFontSize(10);
  };

  const measureRows = (rows, width, labelWidth) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const body = rows.reduce((total, [, value]) => (
      total + doc.splitTextToSize(String(value ?? ''), width - labelWidth).length * 4.6 + 1.5
    ), 0);
    doc.setFontSize(10);
    return body + 9;
  };

  const drawRows = (title, rows, x, width, startY, labelWidth = 33) => {
    let localY = startY;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text(title, x, localY);
    localY += 2.5;
    doc.setDrawColor(210, 220, 215);
    doc.line(x, localY, x + width, localY);
    localY += 5;
    rows.forEach(([label, value]) => {
      doc.setFontSize(8.5);
      const lines = doc.splitTextToSize(String(value ?? ''), width - labelWidth);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(70, 85, 85);
      doc.text(label, x, localY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(28, 43, 45);
      doc.text(lines, x + labelWidth, localY);
      localY += lines.length * 4.6 + 1.5;
    });
    doc.setFontSize(10);
    return localY;
  };

  const twoColumnDetails = (leftTitle, leftRows, rightTitle, rightRows) => {
    const gap = 6;
    const columnWidth = (contentWidth - gap) / 2;
    const leftHeight = measureRows(leftRows, columnWidth, 33);
    const rightHeight = measureRows(rightRows, columnWidth, 33);
    const height = Math.max(leftHeight, rightHeight);
    ensure(height + 4);
    const startY = y;
    drawRows(leftTitle, leftRows, margin, columnWidth, startY);
    drawRows(rightTitle, rightRows, margin + columnWidth + gap, columnWidth, startY);
    doc.setDrawColor(225, 232, 228);
    doc.line(margin + columnWidth + gap / 2, startY, margin + columnWidth + gap / 2, startY + height);
    y = startY + height + 3;
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(28, 43, 45);
  doc.text('Hotelier Voucher', margin, y);
  y += 7;
  doc.setFontSize(10);
  line('Property', `${voucher.propertyName}${voucher.propertyCity ? ` · ${voucher.propertyCity}` : ''}`);
  line('Booking ID', voucher.reference);
  line('PNR', voucher.pnr);

  twoColumnDetails(
    'Booking details',
    [
      ['OTA name', voucher.otaName],
      ['Guest name', voucher.guestName],
      ['Check-in / out', `${voucher.checkIn} – ${voucher.checkOut}`],
      ['Total guests', `${voucher.guestCount} (${voucher.adultCount} adults · ${voucher.childCount} children)`],
      ['Booking ID', voucher.reference],
      ['Booked on', voucher.bookedOn],
      ['Status', `${voucher.bookingStatus} · ${voucher.paymentStatus}`],
      ['Booked via', voucher.bookedVia],
      ['Booking type', voucher.bookingType],
      ['PNR', voucher.pnr],
      ['GST invoice', voucher.gstInvoice],
    ],
    'Room details',
    voucher.rooms.flatMap((room, index) => [
      [`Room ${index + 1}`, `${room.name} · ${room.type}`],
      ['Guests', `${room.adults} adults · ${room.kids} children`],
      ['Meal plan', room.mealPlan],
      ['Inclusions', room.inclusions?.join(', ') || voucher.inclusions.join(', ')],
      ['Cancellation', voucher.cancellationPolicy],
    ]),
  );

  section('Payment summary');
  moneyLine('Gross payment (guest paid)', voucher.grossPayment, true);
  moneyLine('Payable to property', voucher.payableToProperty, true);
  voucher.rooms.forEach((room, index) => {
    line(`Room ${index + 1} breakup`, `${room.name} · ${room.netCharges ?? room.net}`);
  });
  moneyLine('Grand total', voucher.grandTotal, true);
  line('Promotion applied', `${voucher.promotion.label} · ${pdfMoney(voucher.promotion.amount)}`);

  section('Final calculation');
  moneyLine('Room charges', voucher.roomCharges);
  moneyLine('Extra adult / child charges', voucher.extraAdultChildCharges);
  moneyLine('Property taxes', voucher.propertyTaxes);
  moneyLine('Service charges', voucher.serviceCharges);
  moneyLine('a) Property gross charges', voucher.propertyGrossCharges, true);
  moneyLine('TriponX commission', voucher.commission);
  moneyLine('GST on commission', voucher.gstOnCommission);
  moneyLine('TriponX commission incl GST', voucher.commissionInclGst, true);
  moneyLine('TCS', voucher.tcs);
  moneyLine('TDS', voucher.tds);
  moneyLine('Payable to property', voucher.payableToProperty, true);

  section('OTA contact info');
  line('Name', voucher.contact.name);
  line('Email', voucher.contact.email);
  line('Phone', voucher.contact.phone);
  line('Website', voucher.contact.website);

  ensure(10);
  y += 2;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(110, 125, 125);
  doc.text('Demo voucher generated from static Partner Hub data.', margin, y);

  doc.save(`hotelier-voucher-${voucher.reference}.pdf`);
}
