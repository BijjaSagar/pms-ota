const INK = [28, 43, 45];
const MUTED = [91, 105, 101];
const LINE = [210, 220, 215];
const SAGE = [242, 247, 244];
const STRIPE = [249, 250, 249];

const setInk = (doc, size, weight = 'normal', color = INK) => {
  doc.setFont('helvetica', weight);
  doc.setFontSize(size);
  doc.setTextColor(...color);
};

const ensure = (doc, y, height, pageHeight, margin) => {
  if (y + height <= pageHeight - margin - 8) return y;
  doc.addPage();
  return margin + 4;
};

function drawHeading(doc, propertyName) {
  const width = doc.internal.pageSize.getWidth();
  setInk(doc, 16, 'bold');
  doc.text('Ratings & Reviews Report', 14, 18);
  setInk(doc, 9, 'normal', MUTED);
  doc.text(`${propertyName} · TriponX Partner Hub`, 14, 25);
  doc.setDrawColor(...LINE);
  doc.line(14, 29, width - 14, 29);
  return 36;
}

function drawKpis(doc, items, y, width, margin) {
  const cardWidth = (width - margin * 2 - 6) / 2;
  items.forEach((item, index) => {
    const x = margin + (index % 2) * (cardWidth + 6);
    const cardY = y + Math.floor(index / 2) * 15;
    doc.setFillColor(...SAGE);
    doc.roundedRect(x, cardY, cardWidth, 12, 2, 2, 'F');
    setInk(doc, 7.5, 'bold', MUTED);
    doc.text(String(item.label).toUpperCase(), x + 3, cardY + 4.5);
    setInk(doc, 10, 'bold');
    doc.text(String(item.value), x + 3, cardY + 9);
  });
  return y + Math.ceil(items.length / 2) * 15 + 3;
}

function drawSection(doc, title, y) {
  setInk(doc, 11, 'bold');
  doc.text(title, 14, y);
  doc.setDrawColor(...LINE);
  doc.line(14, y + 2.5, doc.internal.pageSize.getWidth() - 14, y + 2.5);
  return y + 7;
}

function drawOtaCard(doc, summary, y, width, margin, pageHeight) {
  const height = 46;
  const nextY = ensure(doc, y, height, pageHeight, margin);
  const contentWidth = width - margin * 2;
  doc.setFillColor(...SAGE);
  doc.roundedRect(margin, nextY, contentWidth, height, 2, 2, 'F');

  setInk(doc, 11, 'bold');
  doc.text(summary.name, margin + 4, nextY + 6);
  setInk(doc, 10, 'bold');
  doc.text(`${summary.overall.toFixed(1)}/5 - ${summary.overallLabel}`, margin + contentWidth - 4, nextY + 6, { align: 'right' });
  setInk(doc, 7.5, 'normal', MUTED);
  doc.text(`${summary.totalRatings} ratings | ${summary.totalReviews} reviews`, margin + 4, nextY + 10.5);

  setInk(doc, 7.5, 'bold');
  summary.distribution.forEach((row, index) => {
    const column = index % 3;
    const rowIndex = Math.floor(index / 3);
    const x = margin + 4 + column * (contentWidth / 3);
    doc.text(`${row.label}: ${row.percentage}% (${row.count})`, x, nextY + 16 + rowIndex * 5);
  });

  setInk(doc, 7.5, 'normal');
  const categories = summary.categories.map((category) => `${category.label} ${category.score.toFixed(1)}`).join(' | ');
  const recent = `Recent: ${summary.recentRatings.map((rating) => rating.toFixed(1)).join(', ')}`;
  doc.text(doc.splitTextToSize(categories, contentWidth - 8), margin + 4, nextY + 29);
  doc.text(doc.splitTextToSize(recent, contentWidth - 8), margin + 4, nextY + 36);
  doc.text(doc.splitTextToSize(summary.impressions.short, contentWidth - 8), margin + 4, nextY + 42);

  return nextY + height + 4;
}

function drawTextBlock(doc, title, text, y, width, margin, pageHeight) {
  setInk(doc, 8, 'normal');
  const lines = doc.splitTextToSize(text, width - margin * 2);
  const height = lines.length * 4 + 12;
  const nextY = ensure(doc, y, height, pageHeight, margin);
  const afterTitle = drawSection(doc, title, nextY);
  setInk(doc, 8, 'normal');
  doc.text(lines, margin, afterTitle + 1);
  return afterTitle + lines.length * 4 + 4;
}

function drawFilters(doc, filters, y, width, margin, pageHeight) {
  const entries = Object.entries(filters);
  const lines = entries.map(([key, value]) => `${key}: ${value}`);
  const height = Math.ceil(lines.length / 2) * 5 + 12;
  const nextY = ensure(doc, y, height, pageHeight, margin);
  let cursorY = drawSection(doc, 'Applied filters', nextY);
  setInk(doc, 8, 'normal');
  lines.forEach((line, index) => {
    const column = index % 2;
    const x = margin + column * ((width - margin * 2) / 2);
    const lineY = cursorY + Math.floor(index / 2) * 5;
    doc.text(doc.splitTextToSize(line, (width - margin * 2) / 2 - 4), x, lineY);
  });
  return cursorY + Math.ceil(lines.length / 2) * 5 + 5;
}

function drawTable(doc, columns, rows, startY, width, margin, pageHeight) {
  const contentWidth = width - margin * 2;
  const weight = columns.reduce((total, column) => total + (column.width ?? 1), 0);
  const widths = columns.map((column) => ((column.width ?? 1) / weight) * contentWidth);
  let y = startY;

  const header = () => {
    doc.setFillColor(236, 242, 239);
    doc.rect(margin, y, contentWidth, 8, 'F');
    setInk(doc, 7.5, 'bold');
    let x = margin;
    columns.forEach((column, index) => {
      doc.text(String(column.label).toUpperCase(), x + 2, y + 5.2);
      x += widths[index];
    });
    y += 8;
  };

  header();
  rows.forEach((row, rowIndex) => {
    const cells = columns.map((column, index) => ({
      lines: doc.splitTextToSize(String(row[column.key] ?? ''), widths[index] - 4),
      width: widths[index],
    }));
    const height = Math.max(...cells.map((cell) => cell.lines.length)) * 4 + 4;
    y = ensure(doc, y, height, pageHeight, margin);
    if (y === margin + 4) header();

    if (rowIndex % 2 === 1) {
      doc.setFillColor(...STRIPE);
      doc.rect(margin, y, contentWidth, height, 'F');
    }

    let x = margin;
    setInk(doc, 7.5, 'normal');
    cells.forEach((cell, index) => {
      doc.text(cell.lines, x + 2, y + 4);
      x += cell.width;
    });
    y += height;
    doc.setDrawColor(...LINE);
    doc.line(margin, y, margin + contentWidth, y);
  });

  return y + 4;
}

function drawQr(doc, qrDataUrl, y, width, margin, pageHeight) {
  if (!qrDataUrl) return y;
  const nextY = ensure(doc, y, 36, pageHeight, margin);
  doc.setFillColor(...SAGE);
  doc.roundedRect(margin, nextY, width - margin * 2, 34, 2, 2, 'F');
  doc.addImage(qrDataUrl, 'PNG', margin + 4, nextY + 4, 26, 26);
  setInk(doc, 10, 'bold');
  doc.text('MMT review collection QR', margin + 34, nextY + 8);
  setInk(doc, 8, 'normal');
  doc.text(doc.splitTextToSize('Scan this code with a phone to open the review collection link for this property.', width - margin * 2 - 40), margin + 34, nextY + 14);
  return nextY + 38;
}

function formatPdfDate(iso) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${iso}T12:00:00`));
}

const safeFileName = (value) => String(value || 'property')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'property';

export async function downloadReviewsPdf({ propertyName, summaries, totalReviews, filters, reviews, qrDataUrl }) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 14;

  doc.setProperties({
    title: `Ratings & Reviews Report - ${propertyName}`,
    subject: 'OTA ratings and guest feedback summary',
    creator: 'TriponX Partner Hub',
  });

  let y = drawHeading(doc, propertyName);
  const avg = summaries.reduce((total, summary) => total + summary.overall, 0) / summaries.length;
  y = drawKpis(doc, [
    { label: 'Total reviews', value: totalReviews },
    { label: 'OTA channels', value: summaries.length },
    { label: 'Average OTA score', value: `${avg.toFixed(1)}/5` },
    { label: 'Reviews in report', value: reviews.length },
  ], y, width, margin);

  y = drawSection(doc, 'OTA performance summary', y);
  summaries.forEach((summary) => { y = drawOtaCard(doc, summary, y, width, margin, height); });

  summaries.forEach((summary) => {
    y = drawTextBlock(doc, `${summary.name} traveller impressions`, summary.impressions.full, y, width, margin, height);
  });

  y = drawFilters(doc, filters, y, width, margin, height);

  const columns = [
    { key: 'platform', label: 'Brand', width: 1.1 },
    { key: 'rating', label: 'Rating', width: 0.7 },
    { key: 'guestName', label: 'Guest', width: 1.4 },
    { key: 'roomName', label: 'Room', width: 1.3 },
    { key: 'postedOn', label: 'Posted', width: 1.2 },
    { key: 'bookingId', label: 'Booking ID', width: 1.3 },
    { key: 'feedback', label: 'Feedback', width: 3.4 },
    { key: 'reply', label: 'Reply', width: 0.9 },
  ];
  const rows = reviews.length ? reviews.map((review) => ({
    platform: review.platform === 'makemytrip' ? 'MakeMyTrip' : 'Goibibo',
    rating: `${review.rating.toFixed(1)}/5`,
    guestName: review.guestName,
    roomName: review.roomName,
    postedOn: formatPdfDate(review.postedOn),
    bookingId: review.bookingId,
    feedback: review.feedback,
    reply: review.replied ? 'Replied' : 'Open',
  })) : [{ platform: '-', rating: '-', guestName: '-', roomName: '-', postedOn: '-', bookingId: '-', feedback: 'No reviews match the applied filters.', reply: '-' }];

  y = drawSection(doc, 'Guest reviews', y);
  y = drawTable(doc, columns, rows, y, width, margin, height);
  drawQr(doc, qrDataUrl, y, width, margin, height);

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    setInk(doc, 7, 'normal', MUTED);
    doc.text(`Page ${page} of ${pages}`, width - 14, height - 8, { align: 'right' });
  }

  doc.save(`${safeFileName(propertyName)}-ratings-reviews.pdf`);
}
