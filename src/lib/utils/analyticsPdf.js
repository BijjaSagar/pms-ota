import { ANALYTICS_SECTIONS, formatAnalyticsValue } from '../data/analytics.js';

const INK = [28, 43, 45];
const MUTED = [91, 105, 101];
const LINE = [210, 220, 215];
const SAGE = [242, 247, 244];
const STRIPE = [249, 250, 249];
const ACCENT = [63, 107, 87];
const COMPETITOR = [174, 189, 181];

const setInk = (doc, size, weight = 'normal', color = INK) => {
  doc.setFont('helvetica', weight);
  doc.setFontSize(size);
  doc.setTextColor(...color);
};

const ensure = (doc, y, height, pageHeight, margin) => {
  if (y + height <= pageHeight - margin - 8) return { y, pageBreak: false };
  doc.addPage();
  return { y: margin + 4, pageBreak: true };
};

function drawHeading(doc, propertyName) {
  const width = doc.internal.pageSize.getWidth();
  setInk(doc, 16, 'bold');
  doc.text('Analytics Report', 14, 18);
  setInk(doc, 9, 'normal', MUTED);
  doc.text(`${propertyName} · Performance and competitor benchmarking`, 14, 25);
  doc.setDrawColor(...LINE);
  doc.line(14, 29, width - 14, 29);
  return 36;
}

function drawSection(doc, title, y) {
  const width = doc.internal.pageSize.getWidth();
  setInk(doc, 10, 'bold');
  doc.text(title, 14, y);
  doc.setDrawColor(...LINE);
  doc.line(14, y + 2, width - 14, y + 2);
  return y + 7;
}

function drawFilters(doc, filters, y, width, margin, pageHeight) {
  const entries = Object.entries(filters);
  const height = Math.ceil(entries.length / 2) * 6 + 12;
  const next = ensure(doc, y, height, pageHeight, margin);
  let cursorY = drawSection(doc, 'Applied filters', next.y);
  setInk(doc, 8, 'normal');
  entries.forEach(([key, value], index) => {
    const column = index % 2;
    const x = margin + column * ((width - margin * 2) / 2);
    const lineY = cursorY + Math.floor(index / 2) * 6;
    doc.text(`${key}: ${value}`, x, lineY);
  });
  return cursorY + Math.ceil(entries.length / 2) * 6 + 4;
}

function drawKpis(doc, models, y, width, margin, pageHeight) {
  const cards = ANALYTICS_SECTIONS.map((section) => models[section.id]);
  const columns = 3;
  const cardWidth = (width - margin * 2 - (columns - 1) * 5) / columns;
  const rows = Math.ceil(cards.length / columns);
  const next = ensure(doc, y, rows * 17 + 4, pageHeight, margin);
  let cursorY = drawSection(doc, 'Performance snapshot', next.y);

  cards.forEach((model, index) => {
    const x = margin + (index % columns) * (cardWidth + 5);
    const cardY = cursorY + Math.floor(index / columns) * 17;
    doc.setFillColor(...SAGE);
    doc.roundedRect(x, cardY, cardWidth, 14, 2, 2, 'F');
    setInk(doc, 7, 'bold', MUTED);
    doc.text(String(model.section.label).toUpperCase(), x + 3, cardY + 4.5);
    setInk(doc, 10, 'bold');
    doc.text(model.displayValue, x + 3, cardY + 10);
    setInk(doc, 7, 'normal', ACCENT);
    doc.text(`+${model.growth}% vs ${model.comparisonLabel.toLowerCase()}`, x + 3, cardY + 13);
  });

  return cursorY + rows * 17 + 3;
}

function drawWeeklyBars(doc, model, y, width, margin, pageHeight) {
  const height = 48;
  const next = ensure(doc, y, height + 12, pageHeight, margin);
  const cursorY = drawSection(doc, `${model.section.label} - weekly comparison`, next.y);
  const contentWidth = width - margin * 2;
  const chartTop = cursorY + 4;
  const chartHeight = 32;
  const max = Math.max(...model.weekly.map((row) => Math.max(row.property, row.competitor)), 1);
  const groupWidth = contentWidth / model.weekly.length;
  const barWidth = Math.min(9, groupWidth * 0.3);

  doc.setDrawColor(...LINE);
  doc.line(margin, chartTop + chartHeight, margin + contentWidth, chartTop + chartHeight);

  model.weekly.forEach((row, index) => {
    const center = margin + groupWidth * index + groupWidth / 2;
    const propertyHeight = (row.property / max) * chartHeight;
    const competitorHeight = (row.competitor / max) * chartHeight;

    doc.setFillColor(...COMPETITOR);
    doc.rect(center - barWidth - 1, chartTop + chartHeight - competitorHeight, barWidth, competitorHeight, 'F');
    doc.setFillColor(...ACCENT);
    doc.rect(center + 1, chartTop + chartHeight - propertyHeight, barWidth, propertyHeight, 'F');
    setInk(doc, 7, 'bold', MUTED);
    doc.text(row.axisLabel, center, chartTop + chartHeight + 5, { align: 'center' });
  });

  setInk(doc, 7, 'normal', MUTED);
  doc.text('Property bar: accent · Competitor bar: light grey', margin, chartTop + chartHeight + 9);
  return chartTop + chartHeight + 13;
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
    const space = ensure(doc, y, height, pageHeight, margin);
    if (space.pageBreak) {
      y = space.y;
      header();
    } else {
      y = space.y;
    }

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

function drawWeeklyTable(doc, model, y, width, margin, pageHeight) {
  const columns = [
    { key: 'axisLabel', label: 'Period', width: 1 },
    { key: 'property', label: 'Your property', width: 1.4 },
    { key: 'competitor', label: 'Competitors', width: 1.4 },
  ];
  const rows = model.weekly.map((row) => ({
    ...row,
    property: formatAnalyticsValue(model.section.id, row.property),
    competitor: formatAnalyticsValue(model.section.id, row.competitor),
  }));
  const next = ensure(doc, y, 20, pageHeight, margin);
  const cursorY = drawSection(doc, 'Weekly data', next.y);
  return drawTable(doc, columns, rows, cursorY, width, margin, pageHeight);
}

function drawBreakdowns(doc, model, y, width, margin, pageHeight) {
  let cursorY = y;
  model.breakdowns.forEach((group) => {
    const columns = [
      { key: 'label', label: 'Category', width: 1.4 },
      { key: 'value', label: 'Your performance', width: 1.4 },
      { key: 'competitor', label: 'Competitor', width: 1.4 },
      { key: 'share', label: 'Share', width: 0.7 },
    ];
    const rows = group.rows.map((row) => ({
      label: row.label,
      value: formatAnalyticsValue(model.section.id, row.value),
      competitor: formatAnalyticsValue(model.section.id, row.competitor),
      share: `${row.share}%`,
    }));
    const next = ensure(doc, cursorY, 30, pageHeight, margin);
    cursorY = drawSection(doc, group.label, next.y);
    cursorY = drawTable(doc, columns, rows, cursorY, width, margin, pageHeight);
  });
  return cursorY;
}

function drawAspTable(doc, model, y, width, margin, pageHeight) {
  const columns = [
    { key: 'day', label: 'Day', width: 0.7 },
    { key: 'date', label: 'Date', width: 1 },
    { key: 'property', label: 'Your rate', width: 1.2 },
    { key: 'competitorMedian', label: 'Median', width: 1.1 },
    { key: 'competitors', label: 'Competitor prices', width: 2.4 },
    { key: 'rank', label: 'Rank', width: 0.6 },
  ];
  const rows = model.aspDays.map((day) => ({
    day: day.day,
    date: day.date,
    property: formatAnalyticsValue('asp', day.property),
    competitorMedian: formatAnalyticsValue('asp', day.competitorMedian),
    competitors: day.competitors.map((competitor) => `${competitor.name} ${formatAnalyticsValue('asp', competitor.price)}`).join(' | '),
    rank: `#${day.rank}`,
  }));
  const next = ensure(doc, y, 30, pageHeight, margin);
  const cursorY = drawSection(doc, `${model.aspWeek.label} - day-wise ASP`, next.y);
  return drawTable(doc, columns, rows, cursorY, width, margin, pageHeight);
}

function drawBenchmark(doc, model, y, width, margin, pageHeight) {
  const next = ensure(doc, y, 18, pageHeight, margin);
  const cursorY = drawSection(doc, 'Competitor benchmarking', next.y);
  setInk(doc, 8, 'normal');
  const message = `${model.section.label}: ${model.displayValue}, ${model.growth}% growth and ${model.competitorShare}% competitor market share. Compared with ${model.comparisonLabel.toLowerCase()}.`;
  doc.text(doc.splitTextToSize(message, width - margin * 2), margin, cursorY + 1);
  return cursorY + 12;
}

const safeFileName = (value) => String(value || 'property')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'property';

export async function downloadAnalyticsPdf({ propertyName, filters, activeSectionId, models }) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 14;
  const active = models[activeSectionId] ?? models[ANALYTICS_SECTIONS[0].id];

  doc.setProperties({
    title: `Analytics Report - ${propertyName}`,
    subject: 'Hotel performance and competitor analytics',
    creator: 'TriponX Partner Hub',
  });

  let y = drawHeading(doc, propertyName);
  y = drawFilters(doc, filters, y, width, margin, height);
  y = drawKpis(doc, models, y, width, margin, height);
  y = drawBenchmark(doc, active, y, width, margin, height);
  y = drawWeeklyBars(doc, active, y, width, margin, height);
  y = drawWeeklyTable(doc, active, y, width, margin, height);

  if (active.section.id === 'asp') {
    y = drawAspTable(doc, active, y, width, margin, height);
  }

  y = drawBreakdowns(doc, active, y, width, margin, height);

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    setInk(doc, 7, 'normal', MUTED);
    doc.text(`Page ${page} of ${pages}`, width - 14, height - 8, { align: 'right' });
  }

  doc.save(`${safeFileName(propertyName)}-analytics.pdf`);
}
