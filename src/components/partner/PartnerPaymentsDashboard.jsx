import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle2, ChevronLeft, ChevronRight, Clock3, CreditCard, Download,
  FileText, Landmark, Receipt, Search, SlidersHorizontal, Users, Wallet,
} from 'lucide-react';
import {
  BOOKING_PAYMENTS, BOOKING_STATUSES, BOOKING_TYPES, BRANDS, DATE_RANGES,
  EARNINGS_SUMMARY, INITIAL_EARNINGS_FILTERS, INITIAL_PAYOUT_FILTERS,
  PAYMENT_STATUSES, PAYMENT_TABS, PAYMENT_VIEWS, PAYOUTS, PAYOUTS_SUMMARY,
  PAGE_SIZE, filterBookingPayments, filterPayouts,
} from '../../lib/data/paymentsData.js';
import { formatStayDate, inr } from '../../lib/data/sampleBookings.js';
import {
  downloadDetailedStatementPdf, downloadPaymentsPdf, downloadPayoutReportPdf, pdfMoney,
} from '../../lib/utils/paymentPdf.js';
import '../../styles/partner-payments.css';

function StatusChip({ status }) {
  const tone = status === 'Settled' ? 'settled' : status === 'Pending' ? 'pending' : 'neutral';
  return <span className={`pm-status is-${tone}`}>{status}</span>;
}

function MetricCard({ icon: Icon, label, value, note }) {
  return (
    <article className="pm-metric">
      <div className="pm-metric-top">
        <span className="pm-metric-label">{label}</span>
        <span className="pm-metric-icon"><Icon size={16} aria-hidden="true" /></span>
      </div>
      <strong className="pm-metric-value">{value}</strong>
      {note ? <span className="pm-metric-note">{note}</span> : null}
    </article>
  );
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <label className="pm-field">
      <span>{label}</span>
      <select className="pm-input" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function SearchField({ value, onChange, placeholder, label }) {
  return (
    <label className="pm-search">
      <Search size={16} aria-hidden="true" />
      <span className="sr-only">{label}</span>
      <input type="search" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SettlementSplit({ summary, open, onToggle }) {
  return (
    <div className="pm-split">
      <button type="button" className="pm-split-head" aria-expanded={open} onClick={onToggle}>
        <span><Landmark size={14} aria-hidden="true" /> Payment Settled breakdown</span>
        <strong>{inr(summary.settled)} <span>{open ? 'Hide details' : 'View Details'}</span></strong>
      </button>
      {open ? (
        <div className="pm-split-body">
          <span>Amount Transferred <strong>{inr(summary.transferred)}</strong></span>
          <span>Amount Adjusted <strong>{inr(summary.adjusted)}</strong></span>
        </div>
      ) : null}
    </div>
  );
}

function Pagination({ page, totalPages, onChange }) {
  return (
    <nav className="pm-pagination" aria-label="Report pages">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={14} aria-hidden="true" /> Previous
      </button>
      <div className="pm-page-numbers">
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
          <button type="button" key={number} aria-current={number === page ? 'page' : undefined}
            className={number === page ? 'is-current' : ''} onClick={() => onChange(number)}>
            {number}
          </button>
        ))}
      </div>
      <button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next <ChevronRight size={14} aria-hidden="true" />
      </button>
    </nav>
  );
}

function EarningsFilters({ filters, setFilters, query, setQuery, hasActive, onClear }) {
  const set = (key) => (value) => setFilters((current) => ({ ...current, [key]: value }));
  return (
    <section className="pm-card pm-filters" aria-label="Net earnings filters">
      <div className="pm-filters-head">
        <span><SlidersHorizontal size={15} aria-hidden="true" /> Filters</span>
        <button type="button" className="pm-clear" disabled={!hasActive} onClick={onClear}>Clear All</button>
      </div>
      <div className="pm-filter-grid">
        <FilterSelect label="Check-in Date Range" value={filters.range} options={DATE_RANGES} onChange={set('range')} />
        <FilterSelect label="Booking Status" value={filters.bookingStatus} options={BOOKING_STATUSES} onChange={set('bookingStatus')} />
        <FilterSelect label="Booking Type" value={filters.bookingType} options={BOOKING_TYPES} onChange={set('bookingType')} />
        <FilterSelect label="Payment Status" value={filters.paymentStatus} options={PAYMENT_STATUSES} onChange={set('paymentStatus')} />
        <FilterSelect label="Brand" value={filters.brand} options={BRANDS} onChange={set('brand')} />
        <SearchField label="Search bookings" value={query} onChange={setQuery}
          placeholder="Search PNR / Booking ID / Guest Name" />
      </div>
    </section>
  );
}

function PayoutFilters({ filters, setFilters, query, setQuery, hasActive, onClear }) {
  const set = (key) => (value) => setFilters((current) => ({ ...current, [key]: value }));
  return (
    <section className="pm-card pm-filters" aria-label="Payout filters">
      <div className="pm-filters-head">
        <span><SlidersHorizontal size={15} aria-hidden="true" /> Filters</span>
        <button type="button" className="pm-clear" disabled={!hasActive} onClick={onClear}>Clear All</button>
      </div>
      <div className="pm-filter-grid pm-filter-grid-two">
        <FilterSelect label="Payment Date Range" value={filters.range} options={DATE_RANGES} onChange={set('range')} />
        <SearchField label="Search payment reference" value={query} onChange={setQuery}
          placeholder="Search by Payment Reference Number" />
      </div>
    </section>
  );
}

function EarningsSummary({ open, onToggle }) {
  return (
    <section className="pm-summary" aria-label="Earnings summary">
      <MetricCard icon={Users} label="Net Bookings" value={EARNINGS_SUMMARY.netBookings} note="Eligible bookings" />
      <MetricCard icon={Wallet} label="Payable to Property" value={inr(EARNINGS_SUMMARY.payable)} note="After deductions" />
      <MetricCard icon={CheckCircle2} label="Payment Settled" value={inr(EARNINGS_SUMMARY.settled)} note="Completed transfers" />
      <MetricCard icon={Clock3} label="Payment Pending" value={inr(EARNINGS_SUMMARY.pending)} note="Awaiting transfer" />
      <SettlementSplit summary={EARNINGS_SUMMARY} open={open} onToggle={onToggle} />
    </section>
  );
}

function PayoutSummary({ open, onToggle }) {
  return (
    <section className="pm-summary pm-summary-three" aria-label="Payout summary">
      <MetricCard icon={Receipt} label="Payments Made" value={PAYOUTS_SUMMARY.paymentsMade} note="Settlement records" />
      <MetricCard icon={Users} label="Bookings Count" value={PAYOUTS_SUMMARY.bookingsCount} note="Bookings covered" />
      <MetricCard icon={Landmark} label="Payment Settled" value={inr(PAYOUTS_SUMMARY.settled)} note="Total settled" />
      <SettlementSplit summary={PAYOUTS_SUMMARY} open={open} onToggle={onToggle} />
    </section>
  );
}

function BookingTable({ rows }) {
  return (
    <div className="pm-table-wrap">
      <table className="pm-table">
        <thead>
          <tr>
            <th>Booking ID</th><th>Guest Name</th><th>Stay Duration</th><th>Booking Status</th>
            <th>Booking Amount</th><th>Payable to Property</th><th>Payment Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td data-label="Booking ID"><strong>{row.id}</strong><span className="pm-cell-sub">{row.pnr}</span></td>
              <td data-label="Guest Name">{row.guest}</td>
              <td data-label="Stay Duration">{row.stay}</td>
              <td data-label="Booking Status"><StatusChip status={row.bookingStatus} /></td>
              <td data-label="Booking Amount">{inr(row.bookingAmount)}</td>
              <td data-label="Payable to Property">{inr(row.payable)}</td>
              <td data-label="Payment Status">
                <StatusChip status={row.paymentStatus} />
                <span className="pm-cell-sub">
                  {row.paymentStatus === 'Pending'
                    ? `Due ${formatStayDate(row.dueDate)}`
                    : `${inr(row.transferred)} transferred · ${inr(row.adjusted)} adjusted`}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PayoutTable({ rows, onReport, pdfBusy }) {
  return (
    <div className="pm-table-wrap">
      <table className="pm-table">
        <thead>
          <tr>
            <th>Payment Reference Number</th><th>Payment Date</th><th>Number of Bookings</th>
            <th>Payments Settled</th><th>Amount Transferred</th><th>Amount Adjusted</th><th>Reports</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((payout) => (
            <tr key={payout.reference}>
              <td data-label="Payment Reference Number"><strong>{payout.reference}</strong></td>
              <td data-label="Payment Date">{formatStayDate(payout.date)}</td>
              <td data-label="Number of Bookings">{payout.bookings}</td>
              <td data-label="Payments Settled">{inr(payout.settled)}</td>
              <td data-label="Amount Transferred">{inr(payout.transferred)}</td>
              <td data-label="Amount Adjusted">{inr(payout.adjusted)}</td>
              <td data-label="Reports">
                <button type="button" className="pm-link" disabled={pdfBusy} onClick={() => onReport(payout)}>
                  <FileText size={13} aria-hidden="true" /> Reports
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OldBookingTable({ rows }) {
  return (
    <div className="pm-table-wrap">
      <table className="pm-table pm-table-old">
        <thead>
          <tr><th>Booking ID</th><th>Guest</th><th>Check-in</th><th>Amount</th><th>Status</th></tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td data-label="Booking ID">{row.id}</td>
              <td data-label="Guest">{row.guest}</td>
              <td data-label="Check-in">{formatStayDate(row.checkIn)}</td>
              <td data-label="Amount">{inr(row.payable)}</td>
              <td data-label="Status"><StatusChip status={row.paymentStatus} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OldPayoutTable({ rows }) {
  return (
    <div className="pm-table-wrap">
      <table className="pm-table pm-table-old">
        <thead>
          <tr><th>Payment Reference</th><th>Payment Date</th><th>Bookings</th><th>Settled</th><th>Status</th></tr>
        </thead>
        <tbody>
          {rows.map((payout) => (
            <tr key={payout.reference}>
              <td data-label="Payment Reference">{payout.reference}</td>
              <td data-label="Payment Date">{formatStayDate(payout.date)}</td>
              <td data-label="Bookings">{payout.bookings}</td>
              <td data-label="Settled">{inr(payout.settled)}</td>
              <td data-label="Status"><StatusChip status="Settled" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PartnerPaymentsDashboard() {
  const [params, setParams] = useSearchParams();
  const requestedTab = params.get('tab');
  const requestedView = params.get('view');
  const tab = PAYMENT_TABS.some((item) => item.id === requestedTab) ? requestedTab : 'earnings';
  const view = PAYMENT_VIEWS.some((item) => item.id === requestedView) ? requestedView : 'new';
  const [earningsFilters, setEarningsFilters] = useState(INITIAL_EARNINGS_FILTERS);
  const [payoutFilters, setPayoutFilters] = useState(INITIAL_PAYOUT_FILTERS);
  const [earningsQuery, setEarningsQuery] = useState('');
  const [payoutQuery, setPayoutQuery] = useState('');
  const [earningsPage, setEarningsPage] = useState(1);
  const [payoutPage, setPayoutPage] = useState(1);
  const [settlementOpen, setSettlementOpen] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    next.set(key, value);
    setParams(next);
  };

  useEffect(() => { setEarningsPage(1); }, [earningsFilters, earningsQuery, tab]);
  useEffect(() => { setPayoutPage(1); }, [payoutFilters, payoutQuery, tab]);

  const filteredBookings = useMemo(
    () => filterBookingPayments(BOOKING_PAYMENTS, earningsFilters, earningsQuery),
    [earningsFilters, earningsQuery],
  );
  const filteredPayouts = useMemo(
    () => filterPayouts(PAYOUTS, payoutFilters, payoutQuery),
    [payoutFilters, payoutQuery],
  );
  const bookingPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE));
  const payoutPages = Math.max(1, Math.ceil(filteredPayouts.length / PAGE_SIZE));
  const safeEarningsPage = Math.min(earningsPage, bookingPages);
  const safePayoutPage = Math.min(payoutPage, payoutPages);
  const bookingRows = filteredBookings.slice((safeEarningsPage - 1) * PAGE_SIZE, safeEarningsPage * PAGE_SIZE);
  const payoutRows = filteredPayouts.slice((safePayoutPage - 1) * PAGE_SIZE, safePayoutPage * PAGE_SIZE);
  const earningsActive = earningsQuery !== ''
    || Object.keys(INITIAL_EARNINGS_FILTERS).some((key) => earningsFilters[key] !== INITIAL_EARNINGS_FILTERS[key]);
  const payoutActive = payoutQuery !== '' || payoutFilters.range !== INITIAL_PAYOUT_FILTERS.range;

  const runPdf = async (task) => {
    setPdfBusy(true);
    try { await task(); } finally { setPdfBusy(false); }
  };

  const downloadCurrent = () => runPdf(() => (tab === 'earnings'
    ? downloadPaymentsPdf({
      title: 'Net Earnings Report',
      subtitle: 'Booking-wise earnings and payable amounts · Month Till Date',
      summary: [
        { label: 'Net bookings', value: EARNINGS_SUMMARY.netBookings },
        { label: 'Payable to property', value: pdfMoney(EARNINGS_SUMMARY.payable) },
        { label: 'Payment settled', value: pdfMoney(EARNINGS_SUMMARY.settled) },
        { label: 'Payment pending', value: pdfMoney(EARNINGS_SUMMARY.pending) },
      ],
      columns: [
        { key: 'id', label: 'Booking ID', width: 1.5 },
        { key: 'guest', label: 'Guest', width: 1.5 },
        { key: 'stay', label: 'Stay', width: 1.6 },
        { key: 'bookingAmount', label: 'Booking amount', width: 1.3 },
        { key: 'payable', label: 'Payable', width: 1.3 },
        { key: 'paymentStatus', label: 'Payment status', width: 1.2 },
      ],
      rows: filteredBookings.map((row) => ({
        ...row,
        bookingAmount: pdfMoney(row.bookingAmount),
        payable: pdfMoney(row.payable),
      })),
      filename: 'net-earnings-report.pdf',
    })
    : downloadDetailedStatementPdf({ summary: PAYOUTS_SUMMARY, payouts: filteredPayouts })));

  const downloadReport = (payout) => runPdf(() => downloadPayoutReportPdf(payout));
  const downloadStatement = () => runPdf(() => downloadDetailedStatementPdf({ summary: PAYOUTS_SUMMARY, payouts: PAYOUTS }));

  return (
    <div className="pm-page">
      <header className="pm-head">
        <div>
          <span className="pm-eyebrow">Payments management</span>
          <h2 className="pm-title">Payments</h2>
          <p className="pm-sub">Track booking revenue, settlements, pending payments and payout history in one place.</p>
        </div>
        <div className="pm-head-actions">
          <div className="pm-view-switch" role="group" aria-label="Dashboard view">
            {PAYMENT_VIEWS.map((item) => (
              <button type="button" key={item.id} aria-pressed={view === item.id}
                className={view === item.id ? 'is-current' : ''}
                onClick={() => updateParam('view', item.id)}>
                {item.label}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-dark btn-sm" disabled={pdfBusy} onClick={downloadCurrent}>
            <Download size={14} aria-hidden="true" /> {pdfBusy ? 'Preparing…' : 'Convert to PDF'}
          </button>
        </div>
      </header>

      <div className="pm-tabs" role="tablist" aria-label="Payments sections">
        {PAYMENT_TABS.map((item) => (
          <button type="button" role="tab" key={item.id} aria-selected={tab === item.id}
            className={tab === item.id ? 'is-current' : ''} onClick={() => updateParam('tab', item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'earnings' ? (
        <>
          <EarningsFilters filters={earningsFilters} setFilters={setEarningsFilters} query={earningsQuery}
            setQuery={setEarningsQuery} hasActive={earningsActive}
            onClear={() => { setEarningsFilters(INITIAL_EARNINGS_FILTERS); setEarningsQuery(''); }} />
          {view === 'new' ? (
            <EarningsSummary open={settlementOpen} onToggle={() => setSettlementOpen((open) => !open)} />
          ) : null}
          <section className="pm-card">
            <div className="pm-results-head">
              <div>
                <h3>{view === 'new' ? 'Booking-wise earnings' : 'Net earnings (compact view)'}</h3>
                <p>{filteredBookings.length} booking payment records</p>
              </div>
              <span className="pm-badge"><CreditCard size={13} aria-hidden="true" /> INR</span>
            </div>
            {view === 'new'
              ? <BookingTable rows={bookingRows} />
              : <OldBookingTable rows={bookingRows} />}
            <Pagination page={safeEarningsPage} totalPages={bookingPages} onChange={setEarningsPage} />
          </section>
        </>
      ) : (
        <>
          <PayoutFilters filters={payoutFilters} setFilters={setPayoutFilters} query={payoutQuery}
            setQuery={setPayoutQuery} hasActive={payoutActive}
            onClear={() => { setPayoutFilters(INITIAL_PAYOUT_FILTERS); setPayoutQuery(''); }} />
          {view === 'new' ? (
            <>
              <div className="pm-statement-action">
                <button type="button" className="btn btn-dark btn-sm" disabled={pdfBusy} onClick={downloadStatement}>
                  <Download size={14} aria-hidden="true" /> Download Detailed Statement
                </button>
              </div>
              <PayoutSummary open={settlementOpen} onToggle={() => setSettlementOpen((open) => !open)} />
            </>
          ) : null}
          <section className="pm-card">
            <div className="pm-results-head">
              <div>
                <h3>{view === 'new' ? 'Payment settlement details' : 'Payout history (compact view)'}</h3>
                <p>{filteredPayouts.length} settlement records</p>
              </div>
              <span className="pm-badge"><Receipt size={13} aria-hidden="true" /> Payouts</span>
            </div>
            {view === 'new'
              ? <PayoutTable rows={payoutRows} onReport={downloadReport} pdfBusy={pdfBusy} />
              : <OldPayoutTable rows={payoutRows} />}
            <Pagination page={safePayoutPage} totalPages={payoutPages} onChange={setPayoutPage} />
          </section>
        </>
      )}
    </div>
  );
}
