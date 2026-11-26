import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { BedDouble, CreditCard, Download, Eye, RotateCcw, Tag, Target } from 'lucide-react';
import { propertyAnalyticsSectionPath } from './paths.js';
import { AnalyticsPanel } from './AnalyticsPanel.jsx';
import { AspPanel } from './AspPanel.jsx';
import {
  ANALYTICS_FILTER_OPTIONS,
  ANALYTICS_SECTIONS,
  ASP_WEEKS,
  createInitialAnalyticsFilters,
  KPI_CARDS,
  analyticsFilterLabels,
  buildAnalyticsModel,
  formatAnalyticsValue,
} from '../../lib/data/analytics.js';
import { downloadAnalyticsPdf } from '../../lib/utils/analyticsPdf.js';
import { downloadCsv } from '../../lib/utils/download.js';
import '../../styles/partner-properties.css';
import '../../styles/partner-analytics.css';

const KPI_ICONS = {
  'room-nights': BedDouble,
  revenue: CreditCard,
  asp: Tag,
  visits: Eye,
  conversion: Target,
};

const FILTER_FIELDS = [
  ['duration', 'Duration'],
  ['brand', 'Brand'],
  ['comparison', 'Comparison Period'],
  ['dateType', 'Date Type'],
];

export function PropertyAnalytics({ property }) {
  const { propertyId } = useParams();
  const [params] = useSearchParams();
  const [filters, setFilters] = useState(() => createInitialAnalyticsFilters());
  const [weekIndex, setWeekIndex] = useState(0);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [csvBusy, setCsvBusy] = useState(false);

  const activeSection = ANALYTICS_SECTIONS.find((section) => section.id === params.get('section'))?.id ?? ANALYTICS_SECTIONS[0].id;
  const propertyName = property?.propertyName || property?.name || 'this property';
  const models = useMemo(() => Object.fromEntries(ANALYTICS_SECTIONS.map((section) => [
    section.id,
    buildAnalyticsModel(section.id, filters, weekIndex),
  ])), [filters, weekIndex]);
  const model = models[activeSection];
  const filterLabels = analyticsFilterLabels(filters);
  const kpis = KPI_CARDS.map((card) => ({ ...card, display: models[card.section].displayValue }));

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const resetFilters = () => {
    setFilters(() => createInitialAnalyticsFilters());
    setWeekIndex(0);
  };

  const downloadSectionCsv = () => {
    setCsvBusy(true);
    try {
      if (activeSection === 'asp') {
        downloadCsv('analytics-asp-data.csv',
          ['Day', 'Date', 'Your Rate', 'Competitor Median', 'Competitor Prices', 'Rank'],
          model.aspDays.map((day) => [
            day.day,
            day.date,
            formatAnalyticsValue('asp', day.property),
            formatAnalyticsValue('asp', day.competitorMedian),
            day.competitors.map((competitor) => `${competitor.name}: ${formatAnalyticsValue('asp', competitor.price)}`).join(' | '),
            `#${day.rank}`,
          ]));
      } else {
        const rows = [
          ...model.weekly.map((row) => ['Weekly', row.axisLabel, formatAnalyticsValue(model.section.id, row.property), formatAnalyticsValue(model.section.id, row.competitor)]),
          ...model.breakdowns.flatMap((group) => group.rows.map((row) => [
            group.label,
            row.label,
            formatAnalyticsValue(model.section.id, row.value),
            formatAnalyticsValue(model.section.id, row.competitor),
          ])),
        ];
        downloadCsv(`analytics-${activeSection}-data.csv`, ['Analysis', 'Category', 'Your Performance', 'Competitor'], rows);
      }
    } finally {
      setCsvBusy(false);
    }
  };

  const convertToPdf = async () => {
    setPdfBusy(true);
    try {
      await downloadAnalyticsPdf({
        propertyName,
        filters: filterLabels,
        activeSectionId: activeSection,
        models,
      });
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <div className="an-page">
      <header className="an-head">
        <div>
          <span className="an-eyebrow">Business intelligence</span>
          <h2 className="an-title">Analytics</h2>
          <p className="an-sub">Track room nights, revenue, pricing, visits and conversion against your competitor set.</p>
        </div>
        <button type="button" className="btn btn-dark btn-sm" disabled={pdfBusy} aria-busy={pdfBusy} onClick={convertToPdf}>
          <Download size={14} aria-hidden="true" />{pdfBusy ? 'Preparing…' : 'Convert to PDF'}
        </button>
      </header>

      <section className="an-filter-card" aria-label="Analytics filters">
        <div className="an-filter-grid">
          {FILTER_FIELDS.map(([key, label]) => (
            <label className="an-field" key={key}>
              <span>{label}</span>
              <select value={filters[key]} onChange={(event) => setFilter(key, event.target.value)}>
                {ANALYTICS_FILTER_OPTIONS[key].map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          ))}
        </div>
        <button type="button" className="btn btn-light btn-sm" onClick={resetFilters}>
          <RotateCcw size={14} aria-hidden="true" />Reset filters
        </button>
      </section>

      <section className="an-kpi-grid" aria-label="Performance KPIs">
        {kpis.map((card) => {
          const Icon = KPI_ICONS[card.id];
          return (
            <Link key={card.id} to={propertyAnalyticsSectionPath(propertyId ?? 'sample', card.section)}
              className={`an-kpi ${card.section === activeSection ? 'is-active' : ''}`}
              aria-current={card.section === activeSection ? 'page' : undefined}>
              <span className="an-kpi-icon"><Icon size={18} aria-hidden="true" /></span>
              <span className="an-kpi-label">{card.label}</span>
              <strong>{card.display}</strong>
              <span className="an-kpi-foot"><span className="an-growth">+{card.growth}%</span><span>{card.competitorShare}% market share</span></span>
            </Link>
          );
        })}
      </section>

      <nav className="an-tabs" role="tablist" aria-label="Analytics sections">
        {ANALYTICS_SECTIONS.map((section) => (
          <Link key={section.id} role="tab" aria-selected={section.id === activeSection}
            to={propertyAnalyticsSectionPath(propertyId ?? 'sample', section.id)}
            className={`an-tab ${section.id === activeSection ? 'is-current' : ''}`}>
            {section.label}
          </Link>
        ))}
      </nav>

      {activeSection === 'asp' ? (
        <AspPanel model={model} weekIndex={weekIndex} weekCount={ASP_WEEKS.length}
          csvBusy={csvBusy} onWeekChange={setWeekIndex} onDownload={downloadSectionCsv} />
      ) : (
        <AnalyticsPanel model={model} csvBusy={csvBusy} onDownload={downloadSectionCsv} />
      )}
    </div>
  );
}
