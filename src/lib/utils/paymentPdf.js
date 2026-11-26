export const pdfMoney = (value) => `INR ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value)}`;

async function loadDoc(title) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setProperties({ title, subject: 'TriponX Partner Hub payments report', creator: 'TriponX Partner Hub' });
  return doc;
}

function drawHeading(doc, title, subtitle) {
  const width = doc.internal.pageSize.getWidth();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(28, 43, 45);
  doc.text(title, 14, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(91, 105, 101);
  doc.text(subtitle, 14, 25);
  doc.setDrawColor(210, 220, 215);
  doc.line(14, 29, width - 14, 29);
  return 35;
}

function drawSummary(doc, items, startY) {
  const width = doc.internal.pageSize.getWidth();
  const contentWidth = width - 28;
  const cardWidth = (contentWidth - 6) / Math.min(items.length, 2);
  let y = startY;

  items.forEach((item, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 14 + column * (cardWidth + 6);
    const cardY = y + row * 15;
    doc.setFillColor(242, 247, 244);
    doc.roundedRect(x, cardY, cardWidth, 12, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(91, 105, 101);
    doc.text(String(item.label).toUpperCase(), x + 3, cardY + 4.5);
    doc.setFontSize(10);
    doc.setTextColor(28, 43, 45);
    doc.text(String(item.value), x + 3, cardY + 9);
  });

  return y + Math.ceil(items.length / 2) * 15 + 3;
}

function drawTable(doc, columns, rows, startY) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const weight = columns.reduce((total, column) => total + (column.width ?? 1), 0);
  const widths = columns.map((column) => ((column.width ?? 1) / weight) * contentWidth);
  let y = startY;

  const header = () => {
    doc.setFillColor(236, 242, 239);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(28, 43, 45);
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
    const height = Math.max(...cells.map((cell) => cell.lines.length)) * 4.2 + 4;

    if (y + height > pageHeight - margin) {
      doc.addPage();
      y = margin;
      header();
    }

    if (rowIndex % 2 === 1) {
      doc.setFillColor(249, 250, 249);
      doc.rect(margin, y, contentWidth, height, 'F');
    }

    let x = margin;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(41, 56, 54);
    cells.forEach((cell, index) => {
      doc.text(cell.lines, x + 2, y + 4);
      x += cell.width;
    });

    y += height;
    doc.setDrawColor(220, 226, 222);
    doc.line(margin, y, margin + contentWidth, y);
  });

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120, 132, 128);
    doc.text(`Page ${page} of ${pages}`, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
  }
}

export async function downloadPaymentsPdf({ title, subtitle, summary, columns, rows, filename }) {
  const doc = await loadDoc(title);
  let y = drawHeading(doc, title, subtitle);
  y = drawSummary(doc, summary, y);
  drawTable(doc, columns, rows, y);
  doc.save(filename);
}

export async function downloadDetailedStatementPdf({ summary, payouts }) {
  await downloadPaymentsPdf({
    title: 'Payment Settlement Statement',
    subtitle: 'Detailed payout history · Month Till Date · TriponX Partner Hub',
    summary: [
      { label: 'Payments made', value: summary.paymentsMade },
      { label: 'Bookings count', value: summary.bookingsCount },
      { label: 'Payment settled', value: pdfMoney(summary.settled) },
      { label: 'Amount transferred', value: pdfMoney(summary.transferred) },
    ],
    columns: [
      { key: 'reference', label: 'Payment reference', width: 2 },
      { key: 'date', label: 'Payment date', width: 1.4 },
      { key: 'bookings', label: 'Bookings', width: 1 },
      { key: 'settled', label: 'Settled', width: 1.5 },
      { key: 'transferred', label: 'Transferred', width: 1.5 },
      { key: 'adjusted', label: 'Adjusted', width: 1.2 },
    ],
    rows: payouts.map((payout) => ({
      ...payout,
      date: formatPdfDate(payout.date),
      settled: pdfMoney(payout.settled),
      transferred: pdfMoney(payout.transferred),
      adjusted: pdfMoney(payout.adjusted),
    })),
    filename: 'payment-settlement-statement.pdf',
  });
}

export async function downloadPayoutReportPdf(payout) {
  await downloadPaymentsPdf({
    title: `Settlement Report ${payout.reference}`,
    subtitle: `Individual transaction report · ${formatPdfDate(payout.date)}`,
    summary: [
      { label: 'Payment reference', value: payout.reference },
      { label: 'Bookings covered', value: payout.bookings },
      { label: 'Payment settled', value: pdfMoney(payout.settled) },
      { label: 'Amount transferred', value: pdfMoney(payout.transferred) },
      { label: 'Amount adjusted', value: pdfMoney(payout.adjusted) },
    ],
    columns: [
      { key: 'label', label: 'Detail', width: 2 },
      { key: 'value', label: 'Amount', width: 2 },
    ],
    rows: [
      { label: 'Payment settled', value: pdfMoney(payout.settled) },
      { label: 'Amount transferred', value: pdfMoney(payout.transferred) },
      { label: 'Amount adjusted', value: pdfMoney(payout.adjusted) },
    ],
    filename: `${payout.reference}-report.pdf`,
  });
}

function formatPdfDate(iso) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${iso}T12:00:00`));
}
