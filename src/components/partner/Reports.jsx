import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BedDouble, CalendarCheck, Download, FileText, Landmark, Receipt, Search, Tag, Wallet,
} from 'lucide-react';
import {
  INITIAL_REPORT_FILTERS, REPORT_CATEGORIES, REPORT_TYPE_OPTIONS, ROOM_TYPE_OPTIONS,
  reportCategoryById, reportColumnsFor, validateReportFilters,
} from '../../lib/data/reports.js';
import { downloadCsv } from '../../lib/utils/download.js';
import '../../styles/partner-reports.css';

const CATEGORY_ICONS = {
  inventory: BedDouble,
  rates: Tag,
  offers: Tag,
  bookings: CalendarCheck,
  plb: Landmark,
  vdi: Receipt,
  invoices: FileText,
  'advance-payment': Wallet,
};

const formatDate = (value) => {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
};

export function Reports() {
  const [params, setParams] = useSearchParams();
  const category = reportCategoryById(params.get('category'));
  const categoryId = category.id;
  const [filters, setFilters] = useState(INITIAL_REPORT_FILTERS);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(null);

  useEffect(() => {
    setFilters(INITIAL_REPORT_FILTERS);
    setErrors({});
    setSubmitted(null);
  }, [categoryId]);

  const setField = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (key === 'startDate' || key === 'endDate') {
        return { ...current, startDate: undefined, endDate: undefined };
      }
      return { ...current, [key]: undefined };
    });
  };

  const selectCategory = (id) => {
    if (id === categoryId) return;
    const next = new URLSearchParams(params);
    if (id === 'inventory') next.delete('category');
    else next.set('category', id);
    setParams(next);
  };

  const search = (event) => {
    event.preventDefault();
    const nextErrors = validateReportFilters(filters);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSubmitted({ ...filters });
  };

  const download = () => {
    if (!submitted) return;
    const filename = `${categoryId}-report-${submitted.startDate}-to-${submitted.endDate}.csv`;
    downloadCsv(filename, reportColumnsFor(categoryId).map((column) => column.label), []);
  };

  const CategoryIcon = CATEGORY_ICONS[categoryId] ?? FileText;
  const dateError = errors.startDate ?? errors.endDate;

  return (
    <div className="rp-page">
      <header className="rp-head">
        <div>
          <h1 className="rp-title">Reports</h1>
          <p className="rp-sub">Generate inventory, pricing, booking, and payment reports for this property.</p>
        </div>
      </header>

      <div className="rp-layout">
        <aside className="rp-sidebar" aria-label="Report categories">
          {REPORT_CATEGORIES.map((item) => {
            const Icon = CATEGORY_ICONS[item.id] ?? FileText;
            return (
              <button type="button" key={item.id}
                className={`rp-category ${item.id === categoryId ? 'is-active' : ''}`}
                aria-current={item.id === categoryId ? 'page' : undefined}
                onClick={() => selectCategory(item.id)}>
                <span className="rp-category-icon"><Icon size={17} aria-hidden="true" /></span>
                <span className="rp-category-copy">
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
              </button>
            );
          })}
        </aside>

        <div className="rp-content">
          <form className="rp-filter-card" onSubmit={search} noValidate>
            <div className="rp-filter-head">
              <h2>Apply Filters</h2>
              <p>Choose the report window and filters to generate your {category.label.toLowerCase()} report.</p>
            </div>

            <div className="rp-filter-grid">
              <fieldset className="rp-field rp-date-field">
                <legend>Select Dates <span aria-hidden="true">*</span></legend>
                <div className="rp-date-row">
                  <label className="rp-input-wrap">
                    <span className="sr-only">Start date</span>
                    <input type="date" value={filters.startDate} max={filters.endDate || undefined}
                      aria-invalid={Boolean(errors.startDate)}
                      onChange={(event) => setField('startDate', event.target.value)} />
                  </label>
                  <span className="rp-date-sep">to</span>
                  <label className="rp-input-wrap">
                    <span className="sr-only">End date</span>
                    <input type="date" value={filters.endDate} min={filters.startDate || undefined}
                      aria-invalid={Boolean(errors.endDate)}
                      onChange={(event) => setField('endDate', event.target.value)} />
                  </label>
                </div>
                {dateError ? <span className="rp-error" role="alert">{dateError}</span> : null}
              </fieldset>

              <label className="rp-field">
                <span>Room Type</span>
                <select value={filters.roomType} onChange={(event) => setField('roomType', event.target.value)}>
                  {ROOM_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>

              <label className="rp-field">
                <span>Report Type</span>
                <select value={filters.reportType} onChange={(event) => setField('reportType', event.target.value)}>
                  {REPORT_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            </div>

            <div className="rp-actions">
              <button type="submit" className="btn btn-dark btn-sm"><Search size={14} aria-hidden="true" />Search</button>
              <button type="button" className="btn btn-light btn-sm" disabled={!submitted} onClick={download}>
                <Download size={14} aria-hidden="true" />Download
              </button>
            </div>
          </form>

          <section className="rp-results" aria-live="polite">
            {submitted ? (
              <div className="rp-result-state">
                <span className="rp-result-icon"><CategoryIcon size={22} aria-hidden="true" /></span>
                <h3>No {category.label.toLowerCase()} data</h3>
                <p>No {category.label.toLowerCase()} records found for the selected filters.</p>
                <div className="rp-result-meta">
                  <span>{formatDate(submitted.startDate)} – {formatDate(submitted.endDate)}</span>
                  <span>{submitted.roomType}</span>
                  <span>{submitted.reportType}</span>
                </div>
              </div>
            ) : (
              <div className="rp-result-state">
                <span className="rp-result-icon"><Search size={22} aria-hidden="true" /></span>
                <h3>Ready to generate report</h3>
                <p>Select your date range and filters, then click Search.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
