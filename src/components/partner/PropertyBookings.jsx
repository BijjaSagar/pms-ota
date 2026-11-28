// Partner Hub > a property > Bookings: every booking made for the property on TriponX (from the API),
// with arrivals / in-house / 30-day numbers, search & filters, payment details, the hotelier voucher,
// and the stay actions: Check in, Check out, Mark no-show, Cancel (the server decides what is allowed).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  BedDouble,
  CalendarCheck,
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  CircleCheck,
  CircleX,
  Clock3,
  Download,
  LogIn,
  LogOut,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  UserX,
  SlidersHorizontal,
  Wallet,
  X,
} from 'lucide-react';
import { bookingAction, listPropertyBookings } from '../../lib/api/bookings.js';
import {
  BOOKING_SOURCES, BOOKING_STATUSES, BOOKING_TYPES, CHANNELS,
  GST_INVOICE_STATUSES, PAYMENT_STATUSES, formatStayDate, inr,
} from '../../lib/data/sampleBookings.js';
import { buildVoucher } from '../../lib/utils/voucher.js';
import { downloadVoucherPdf } from '../../lib/utils/voucherPdf.js';
import '../../styles/partner-properties.css';
import '../../styles/partner-bookings.css';

const STATUS_META = {
  Confirmed: { tone: 'good', Icon: CircleCheck },
  'Checked-in': { tone: 'info', Icon: CalendarCheck },
  Pending: { tone: 'wait', Icon: Clock3 },
  Completed: { tone: 'done', Icon: CheckCircle2 },
  'No-show': { tone: 'bad', Icon: UserX },
  Cancelled: { tone: 'bad', Icon: CircleX },
};

/** Buttons for the actions the server allows on a booking today. */
const ACTIONS = {
  'check-in': { label: 'Check in', Icon: LogIn, confirm: 'Check this guest in now?' },
  'check-out': { label: 'Check out', Icon: LogOut, confirm: 'Check this guest out? Any amount still due is recorded as paid at the property.' },
  'no-show': { label: 'No-show', Icon: UserX, confirm: 'Mark this booking as a no-show? The guest did not arrive.' },
  cancel: { label: 'Cancel', Icon: CircleX, confirm: 'Cancel this booking? The guest will see it as cancelled.', reason: true },
};

const DAY_MS = 24 * 60 * 60 * 1000;
/** Days from the hotel's today to the check-in day (0 = arriving today). */
const offsetFrom = (today) => (iso) => Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY_MS);

const GROUPS = [
  { key: 'today', label: 'Arriving today', match: (b) => b.arrivalOffset === 0 },
  { key: 'tomorrow', label: 'Tomorrow', match: (b) => b.arrivalOffset === 1 },
  { key: 'upcoming', label: 'Upcoming', match: (b) => b.arrivalOffset > 1 },
  { key: 'recent', label: 'Recent', match: (b) => b.arrivalOffset < 0 },
];

const groupDateLabel = (group, bookings) => {
  if (group.key === 'today' || !bookings.length) return group.label;
  const dates = bookings.map((booking) => booking.checkIn).sort();
  const first = formatStayDate(dates[0]);
  const last = formatStayDate(dates[dates.length - 1]);
  return first === last ? first : `${first} – ${last}`;
};

const dateFiltersFor = (bookings) => [
  { key: 'all', label: 'All dates' },
  ...GROUPS.map((group) => ({
    key: group.key,
    label: group.key === 'today' ? 'Today' : groupDateLabel(group, bookings.filter(group.match)),
  })),
];

const INITIAL_FILTERS = {
  channels: [], source: 'All sources', dateKey: 'all', status: 'All',
  payment: 'All', gst: 'All', bookingType: 'All',
};

const TABLE_COLUMNS = [
  'Booking ID', 'Name', 'Check-in / out', 'Room & meal plan', 'Guest contact', 'Amount',
];

const toggleChannel = (channels, channel) => (
  channels.includes(channel) ? channels.filter((value) => value !== channel) : [...channels, channel]
);

function Status({ status }) {
  const { tone, Icon } = STATUS_META[status] ?? { tone: 'wait', Icon: Clock3 };
  return <span className={`bk-status is-${tone}`}><Icon size={12} aria-hidden="true" />{status}</span>;
}

function Kpis({ stats }) {
  const show = (value, money) => (stats ? (money ? inr(value) : value) : '–');
  const items = [
    { label: 'Arrivals today', value: show(stats?.arrivalsToday), note: 'expected check-ins', Icon: CalendarDays },
    { label: 'In house', value: show(stats?.inHouse), note: stats?.departuresToday ? `${stats.departuresToday} leaving today` : 'currently staying', Icon: BedDouble },
    { label: 'Net bookings', value: show(stats?.netBookings), note: 'last 30 days', Icon: Receipt },
    { label: 'Net earnings', value: show(stats?.netEarnings, true), note: 'last 30 days', Icon: Wallet },
  ];
  return (
    <section className="bk-kpis" aria-label="Booking numbers">
      {items.map(({ label, value, note, Icon }) => (
        <article key={label} className="bk-kpi">
          <span className="bk-kpi-icon"><Icon size={18} aria-hidden="true" /></span>
          <span className="bk-kpi-text">
            <span className="bk-kpi-label">{label}</span>
            <strong className="bk-kpi-value">{value}</strong>
            <span className="bk-kpi-note">{note}</span>
          </span>
        </article>
      ))}
    </section>
  );
}

function BookingRow({ booking, onPaymentDetails, onVoucher, onAction, busy }) {
  const visibleActions = booking.actions.filter((action) => !['check-in', 'no-show', 'cancel'].includes(action));
  return (
    <tr className="bk-row">
      <td data-label="Booking ID"><span className="ref-code">{booking.reference}</span></td>
      <td data-label="Name"><span className="bk-cell-main"><strong>{booking.guest.name}</strong></span></td>
      <td data-label="Check-in / out">
        <span className="bk-cell-main">
          <CalendarDays size={13} aria-hidden="true" />
          {formatStayDate(booking.checkIn)} <ArrowRight size={12} aria-hidden="true" /> {formatStayDate(booking.checkOut)}
        </span>
        <span className="bk-cell-sub">{booking.nights} {booking.nights === 1 ? 'night' : 'nights'} · {booking.adults + booking.kids} guests</span>
      </td>
      <td data-label="Room & meal plan">
        <span className="bk-cell-main">{booking.room}</span>
        <span className="bk-cell-sub">{booking.plan}</span>
      </td>
      <td data-label="Guest contact">
        <span className="bk-cell-main">{booking.guest.email}</span>
        <span className="bk-cell-sub">{booking.guest.phone}</span>
      </td>
      <td data-label="Amount">
        <span className="bk-cell-main"><strong>{inr(booking.amount)}</strong></span>
        <span className="bk-cell-sub">{booking.payment.state}</span>
        {visibleActions.length > 0 && (
          <div className="bk-row-actions bk-stay-actions">
            {visibleActions.map((action) => {
              const { label, Icon } = ACTIONS[action];
              return (
                <button key={action} type="button" className={`bk-pay-btn bk-act-btn ${action === 'cancel' || action === 'no-show' ? 'is-danger' : ''}`}
                  disabled={busy} onClick={() => onAction(booking, action)}>
                  <Icon size={13} aria-hidden="true" />{label}
                </button>
              );
            })}
          </div>
        )}
        <div className="bk-row-actions">
          <button type="button" className="bk-pay-btn" onClick={() => onPaymentDetails(booking)}>Payment details</button>
          <button type="button" className="bk-pay-btn bk-voucher-btn" onClick={() => onVoucher(booking)}>Voucher</button>
        </div>
      </td>
    </tr>
  );
}

function FilterSection({ title, hint, children }) {
  return (
    <section className="bk-filter-section">
      <div className="bk-filter-heading">
        <h4>{title}</h4>
        {hint && <span className="bk-filter-hint">{hint}</span>}
      </div>
      <div className="bk-filter-options">{children}</div>
    </section>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <button type="button" className={`bk-filter ${active ? 'is-on' : ''}`}
      aria-pressed={active} onClick={onClick}>{label}</button>
  );
}

function FilterPanel({ filters, setFilters, onClear, hasActive, dateFilters }) {
  const set = (key, value) => setFilters((previous) => ({ ...previous, [key]: value }));
  return (
    <aside className="bk-filters-panel" aria-label="Booking filters">
      <div className="bk-filter-panel-head">
        <span className="bk-filter-panel-title"><SlidersHorizontal size={16} aria-hidden="true" />Filters</span>
        <button type="button" className="bk-clear" onClick={onClear} disabled={!hasActive}>Clear all</button>
      </div>

      <FilterSection title="Channels" hint="Where the booking came from">
        <div className="bk-channel-list">
          {CHANNELS.map((channel) => (
            <label key={channel} className="bk-channel">
              <input type="checkbox" checked={filters.channels.includes(channel)}
                onChange={() => set('channels', toggleChannel(filters.channels, channel))} />
              <span>{channel}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Bookings From">
        <select className="bk-select" aria-label="Bookings from" value={filters.source}
          onChange={(event) => set('source', event.target.value)}>
          {BOOKING_SOURCES.map((source) => <option key={source} value={source}>{source}</option>)}
        </select>
      </FilterSection>

      <FilterSection title="Date Filters">
        {dateFilters.map(({ key, label }) => (
          <FilterChip key={key} label={label} active={filters.dateKey === key}
            onClick={() => set('dateKey', key)} />
        ))}
      </FilterSection>

      <FilterSection title="Booking Status">
        {BOOKING_STATUSES.map((option) => (
          <FilterChip key={option} label={option} active={filters.status === option}
            onClick={() => set('status', option)} />
        ))}
      </FilterSection>

      <FilterSection title="Payment Status">
        {PAYMENT_STATUSES.map((option) => (
          <FilterChip key={option} label={option} active={filters.payment === option}
            onClick={() => set('payment', option)} />
        ))}
      </FilterSection>

      <FilterSection title="GST Invoice Status">
        {GST_INVOICE_STATUSES.map((option) => (
          <FilterChip key={option} label={option} active={filters.gst === option}
            onClick={() => set('gst', option)} />
        ))}
      </FilterSection>

      <FilterSection title="Booking Type">
        {BOOKING_TYPES.map((option) => (
          <FilterChip key={option} label={option} active={filters.bookingType === option}
            onClick={() => set('bookingType', option)} />
        ))}
      </FilterSection>
    </aside>
  );
}

function PaymentModal({ booking, property, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="bk-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div className="bk-modal" role="dialog" aria-modal="true" aria-labelledby="bk-payment-title">
        <div className="bk-modal-head">
          <span className="bk-eyebrow">Reservation payment</span>
          <button type="button" className="bk-modal-close" aria-label="Close payment details" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <h3 id="bk-payment-title">Payment details</h3>

        <div className="bk-voucher">
          <div className="bk-voucher-head">
            <span className="bk-voucher-mark"><Receipt size={18} aria-hidden="true" /></span>
            <span className="bk-voucher-title">
              <span className="bk-eyebrow">Payment Receipt</span>
              <strong className="ref-code">{booking.reference}</strong>
            </span>
          </div>
          <dl className="bk-voucher-facts">
            <div><dt>Property</dt><dd>{property.propertyName ?? 'this property'}</dd></div>
            <div><dt>Guest</dt><dd>{booking.guest.name}</dd></div>
            <div><dt>Stay</dt><dd>{formatStayDate(booking.checkIn)} – {formatStayDate(booking.checkOut)}</dd></div>
            <div><dt>Room</dt><dd>{booking.room}</dd></div>
            <div><dt>Payment mode</dt><dd>{booking.payment.mode}{booking.payment.last4 ? ` · ••${booking.payment.last4}` : ''}</dd></div>
            <div><dt>Status</dt><dd>{booking.payment.state}</dd></div>
          </dl>
          <div className="bk-voucher-total"><span>Total booking value</span><strong>{inr(booking.amount)}</strong></div>
        </div>

        <div className="bk-modal-actions">
          <button type="button" className="btn btn-light btn-sm" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function VoucherDrawer({ booking, property, onClose }) {
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (typeof document === 'undefined') return null;
  const voucher = buildVoucher(booking, property);
  const savePdf = async () => {
    setPdfBusy(true);
    try {
      await downloadVoucherPdf(booking, property);
    } finally {
      setPdfBusy(false);
    }
  };

  return createPortal(
    <div className="bk-voucher-root">
      <div className="bk-drawer-backdrop" onMouseDown={onClose} />
      <aside className="bk-voucher-drawer" role="dialog" aria-modal="true" aria-labelledby="bk-voucher-title">
        <header className="bk-drawer-head">
          <div>
            <span className="bk-eyebrow">Booking voucher</span>
            <h3 id="bk-voucher-title">Hotelier Voucher</h3>
          </div>
          <button type="button" className="bk-drawer-close" aria-label="Close hotelier voucher" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className="bk-drawer-actions">
          <button type="button" className="btn btn-light btn-sm" onClick={() => window.print()}>
            <Printer size={14} aria-hidden="true" />Print
          </button>
          <button type="button" className="btn btn-dark btn-sm" onClick={savePdf} disabled={pdfBusy} aria-busy={pdfBusy}>
            <Download size={14} aria-hidden="true" />{pdfBusy ? 'Preparing…' : 'PDF'}
          </button>
        </div>

        <div className="bk-voucher-drawer-body">
          <div className="bk-hvoucher">
            <div className="bk-hvoucher-top">
              <span className="bk-voucher-mark"><Receipt size={18} aria-hidden="true" /></span>
              <span className="bk-hvoucher-id">
                <strong>{voucher.otaName}</strong>
                <span>{voucher.propertyName}{voucher.propertyCity ? ` · ${voucher.propertyCity}` : ''} · {voucher.reference}</span>
              </span>
              <Status status={voucher.bookingStatus} />
            </div>

            <div className="bk-voucher-top-grid">
              <section className="bk-voucher-section">
                <h4>Booking details</h4>
                <dl className="bk-hvoucher-facts">
                  <div><dt>OTA name</dt><dd>{voucher.otaName}</dd></div>
                  <div><dt>Guest name</dt><dd>{voucher.guestName}</dd></div>
                  <div><dt>Check-in / out</dt><dd>{voucher.checkIn} – {voucher.checkOut}</dd></div>
                  <div><dt>Total guests</dt><dd>{voucher.guestCount}</dd></div>
                  <div><dt>Booking ID</dt><dd className="ref-code">{voucher.reference}</dd></div>
                  <div><dt>Booking on</dt><dd>{voucher.bookedOn}</dd></div>
                  <div><dt>Booking status</dt><dd><Status status={voucher.bookingStatus} /></dd></div>
                  <div><dt>Payment status</dt><dd>{voucher.paymentStatus}</dd></div>
                  <div><dt>Booked via</dt><dd>{voucher.bookedVia}</dd></div>
                  <div><dt>PNR</dt><dd className="ref-code">{voucher.pnr}</dd></div>
                  <div><dt>Booking type</dt><dd>{voucher.bookingType}</dd></div>
                  <div><dt>GST invoice</dt><dd>{voucher.gstInvoice}</dd></div>
                </dl>
              </section>

              <section className="bk-voucher-section">
                <h4>Room details</h4>
                {voucher.rooms.map((room, index) => (
                  <article className="bk-voucher-room" key={`${room.name}-${index}`}>
                    <div className="bk-voucher-room-head">
                      <strong>{room.name}</strong>
                      <span>{room.type}</span>
                    </div>
                    <dl className="bk-hvoucher-facts">
                      <div><dt>Room type</dt><dd>{room.type}</dd></div>
                      <div><dt>Adults</dt><dd>{room.adults}</dd></div>
                      <div><dt>Children</dt><dd>{room.kids}</dd></div>
                      <div><dt>Meal plan</dt><dd>{room.mealPlan}</dd></div>
                      <div><dt>Inclusions</dt><dd>{voucher.inclusions.join(', ')}</dd></div>
                      <div><dt>Cancellation policy</dt><dd>{voucher.cancellationPolicy}</dd></div>
                    </dl>
                  </article>
                ))}
              </section>
            </div>

            <section className="bk-voucher-section">
              <h4>Payment summary</h4>
              <div className="bk-voucher-pay-grid">
                <div><small>Gross payment</small><strong>{inr(voucher.grossPayment)}</strong></div>
                <div><small>Payable to property</small><strong>{inr(voucher.payableToProperty)}</strong></div>
              </div>
              <div className="bk-voucher-table-wrap">
                <table className="bk-voucher-table">
                  <thead>
                    <tr>
                      <th>Room</th><th>Charges</th><th>Extras</th><th>Taxes</th><th>Service</th><th>Promo</th><th>Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {voucher.rooms.map((room, index) => (
                      <tr key={`${room.name}-breakup-${index}`}>
                        <td data-label="Room">{room.name}</td>
                        <td data-label="Charges">{inr(room.roomCharges)}</td>
                        <td data-label="Extras">{inr(room.extraAdultChildCharges)}</td>
                        <td data-label="Taxes">{inr(room.propertyTaxes)}</td>
                        <td data-label="Service">{inr(room.serviceCharges)}</td>
                        <td data-label="Promo">{inr(room.promotion)}</td>
                        <td data-label="Net">{inr(room.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bk-hvoucher-total"><span>Grand total</span><strong>{inr(voucher.grandTotal)}</strong></div>
              <div className="bk-voucher-promo">Promotion applied: <strong>{voucher.promotion.label}</strong> · {inr(voucher.promotion.amount)}</div>
            </section>

            <section className="bk-voucher-section">
              <h4>Final calculation</h4>
              <dl className="bk-voucher-calc">
                <div><dt>Room charges</dt><dd>{inr(voucher.roomCharges)}</dd></div>
                <div><dt>Extra adult / child charges</dt><dd>{inr(voucher.extraAdultChildCharges)}</dd></div>
                <div><dt>Property taxes</dt><dd>{inr(voucher.propertyTaxes)}</dd></div>
                <div><dt>Service charges</dt><dd>{inr(voucher.serviceCharges)}</dd></div>
                <div className="is-group"><dt>a) Property gross charges</dt><dd>{inr(voucher.propertyGrossCharges)}</dd></div>
                <div><dt>TriponX commission</dt><dd>{inr(voucher.commission)}</dd></div>
                <div><dt>GST on commission</dt><dd>{inr(voucher.gstOnCommission)}</dd></div>
                <div className="is-group"><dt>b) TriponX commission (incl GST)</dt><dd>{inr(voucher.commissionInclGst)}</dd></div>
                <div><dt>TCS (payable to property)</dt><dd>{inr(voucher.tcs)}</dd></div>
                <div><dt>TDS (payable to property)</dt><dd>{inr(voucher.tds)}</dd></div>
                <div className="is-total"><dt>Payable to property</dt><dd>{inr(voucher.payableToProperty)}</dd></div>
              </dl>
            </section>

            <section className="bk-voucher-section">
              <h4>OTA contact info</h4>
              <dl className="bk-hvoucher-facts">
                <div><dt>Name</dt><dd>{voucher.contact.name}</dd></div>
                <div><dt>Email</dt><dd>{voucher.contact.email}</dd></div>
                <div><dt>Phone</dt><dd>{voucher.contact.phone}</dd></div>
              </dl>
            </section>
          </div>
        </div>
      </aside>
    </div>,
    document.body,
  );
}

function ActionModal({ booking, action, busy, error, onConfirm, onClose }) {
  const { label, confirm, reason: needsReason } = ACTIONS[action];
  const [reason, setReason] = useState('');
  useEffect(() => {
    const handleKeyDown = (event) => { if (event.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [busy, onClose]);

  if (typeof document === 'undefined') return null;
  const tooShort = needsReason && reason.trim().length < 3;
  return createPortal(
    <div className="bk-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <form className="bk-modal" role="dialog" aria-modal="true" aria-labelledby="bk-action-title"
        onSubmit={(event) => { event.preventDefault(); if (!tooShort) onConfirm(reason.trim()); }}>
        <div className="bk-modal-head">
          <span className="bk-eyebrow">{booking.reference} · {booking.guest.name}</span>
          <button type="button" className="bk-modal-close" aria-label="Close" onClick={onClose} disabled={busy}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <h3 id="bk-action-title">{label}</h3>
        <p className="muted-sm">{confirm}</p>
        <p className="muted-sm">{booking.room} · {formatStayDate(booking.checkIn)} – {formatStayDate(booking.checkOut)} · {inr(booking.amount)}</p>
        {needsReason && (
          <label className="bk-reason">
            <span>Reason (shown in the booking history)</span>
            <textarea value={reason} maxLength={300} rows={3} required autoFocus
              placeholder="e.g. Room under maintenance" onChange={(event) => setReason(event.target.value)} />
          </label>
        )}
        {error && <p className="field-error" role="alert">{error}</p>}
        <div className="bk-modal-actions">
          <button type="button" className="btn btn-light btn-sm" onClick={onClose} disabled={busy}>Back</button>
          <button type="submit" className={`btn btn-sm ${action === 'cancel' || action === 'no-show' ? 'bk-btn-danger' : 'btn-dark'}`}
            disabled={busy || tooShort} aria-busy={busy}>
            {busy ? 'Saving…' : label}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}

export function PropertyBookings({ property }) {
  const [params] = useSearchParams();
  const requestedGst = params.get('gst');
  const requestedBookingType = params.get('bookingType');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(() => ({
    ...INITIAL_FILTERS,
    gst: GST_INVOICE_STATUSES.includes(requestedGst) ? requestedGst : INITIAL_FILTERS.gst,
    bookingType: BOOKING_TYPES.includes(requestedBookingType) ? requestedBookingType : INITIAL_FILTERS.bookingType,
  }));
  const [paymentBooking, setPaymentBooking] = useState(null);
  const [voucherBooking, setVoucherBooking] = useState(null);
  const [data, setData] = useState(null); // { bookings, stats } from the API
  const [loadError, setLoadError] = useState('');
  const [pending, setPending] = useState(null); // { booking, action } waiting for confirmation
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoadError('');
    try {
      setData(await listPropertyBookings(property.id));
    } catch (problem) {
      setLoadError(problem.message);
    }
  }, [property.id]);
  useEffect(() => { setData(null); load(); }, [load]);

  // Each booking with its day offset from the hotel's today (0 = arriving today).
  const all = useMemo(() => {
    if (!data) return [];
    const offset = offsetFrom(data.stats.today);
    return data.bookings.map((booking) => ({ ...booking, arrivalOffset: offset(booking.checkIn) }));
  }, [data]);
  const dateFilters = useMemo(() => dateFiltersFor(all), [all]);

  const hasActive = Boolean(query.trim()) || filters.channels.length > 0
    || Object.entries(filters).some(([key, value]) => key !== 'channels' && value !== INITIAL_FILTERS[key]);

  const clearAll = () => {
    setQuery('');
    setFilters(INITIAL_FILTERS);
  };

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return all.filter((booking) => {
      if (filters.channels.length && !filters.channels.includes(booking.channel)) return false;
      if (filters.source !== 'All sources' && booking.source !== filters.source) return false;
      if (filters.dateKey !== 'all' && !GROUPS.find((group) => group.key === filters.dateKey)?.match(booking)) return false;
      if (filters.status !== 'All' && booking.status !== filters.status) return false;
      if (filters.payment !== 'All' && booking.payment.state !== filters.payment) return false;
      if (filters.gst !== 'All' && booking.gstInvoice !== filters.gst) return false;
      if (filters.bookingType !== 'All' && booking.bookingType !== filters.bookingType) return false;
      if (!needle) return true;
      return [booking.guest.name, booking.reference, booking.room, booking.payment.mode, booking.guest.email, booking.guest.phone]
        .some((value) => String(value ?? '').toLowerCase().includes(needle));
    });
  }, [all, query, filters]);

  const closeAction = useCallback(() => { setPending(null); setActionError(''); }, []);
  const runAction = async (reason) => {
    if (!pending) return;
    setActing(true);
    setActionError('');
    try {
      await bookingAction(property.id, pending.booking.reference, pending.action, reason);
      setPending(null);
      await load(); // fresh list, buttons and numbers
    } catch (problem) {
      setActionError(problem.message);
      if (problem.status === 409) load(); // changed meanwhile: show the current state
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="bk-page">
      <div className="bk-head">
        <div>
          <span className="bk-eyebrow">Reservations</span>
          <h2 className="bk-title">Bookings for {property.propertyName ?? 'this property'}</h2>
          <p className="bk-sub">Arrivals, stays and reservations made on TriponX. Check guests in and out here.</p>
        </div>
        <button type="button" className="btn btn-light btn-sm" onClick={load} aria-label="Refresh bookings">
          <RefreshCw size={14} aria-hidden="true" />Refresh
        </button>
      </div>

      <Kpis stats={data?.stats} />

      <div className="bk-workspace">
        <FilterPanel filters={filters} setFilters={setFilters} onClear={clearAll} hasActive={hasActive} dateFilters={dateFilters} />

        <section className="bk-list-panel" aria-labelledby="bk-list-title">
          <div className="bk-toolbar">
            <div className="bk-toolbar-top">
              <h3 id="bk-list-title">All reservations</h3>
              <span className="bk-count" aria-live="polite">{filtered.length} booking{filtered.length === 1 ? '' : 's'}</span>
            </div>
            <label className="bk-search">
              <Search size={16} aria-hidden="true" />
              <span className="sr-only">Search bookings</span>
              <input type="search" value={query} placeholder="Search guest, reference, room or phone"
                onChange={(event) => setQuery(event.target.value)} />
            </label>
          </div>

          {loadError && (
            <div className="pi-notice is-error" role="alert">
              <span>{loadError}</span>
              <button type="button" className="btn btn-light btn-sm" onClick={load}>Try again</button>
            </div>
          )}

          {!data && !loadError ? (
            <div className="pv-empty bk-empty" role="status"><p className="muted-sm">Loading bookings…</p></div>
          ) : data && all.length === 0 ? (
            <div className="pv-empty bk-empty">
              <span className="pv-empty-icon"><CalendarX2 size={24} aria-hidden="true" /></span>
              <h4 className="pv-empty-title">No bookings yet</h4>
              <p className="muted-sm">When guests book this property on TriponX, their reservations appear here.</p>
            </div>
          ) : data && filtered.length === 0 ? (
            <div className="pv-empty bk-empty">
              <span className="pv-empty-icon"><CalendarX2 size={24} aria-hidden="true" /></span>
              <h4 className="pv-empty-title">No bookings found</h4>
              <p className="muted-sm">Try another name, reference or status.</p>
              <button type="button" className="btn btn-light btn-sm" onClick={clearAll}>Clear filters</button>
            </div>
          ) : data ? (
            <div className="bk-groups">
              {GROUPS.map((group) => {
                const bookings = filtered.filter(group.match);
                if (!bookings.length) return null;
                const label = groupDateLabel(group, bookings);
                return (
                  <section key={group.key} className="bk-group" aria-label={label}>
                    <div className="bk-group-head">
                      <h4>{label}</h4>
                      <span>{bookings.length} booking{bookings.length === 1 ? '' : 's'}</span>
                    </div>
                    <div className="bk-table-wrap">
                      <table className="bk-table">
                        <thead>
                          <tr>
                            {TABLE_COLUMNS.map((column) => <th key={column} scope="col">{column}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.map((booking) => (
                            <BookingRow key={booking.id} booking={booking} busy={acting}
                              onPaymentDetails={setPaymentBooking} onVoucher={setVoucherBooking}
                              onAction={(target, action) => { setActionError(''); setPending({ booking: target, action }); }} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                );
              })}
            </div>
          ) : null}
        </section>
      </div>

      {paymentBooking && (
        <PaymentModal booking={paymentBooking} property={property} onClose={() => setPaymentBooking(null)} />
      )}
      {voucherBooking && (
        <VoucherDrawer booking={voucherBooking} property={property} onClose={() => setVoucherBooking(null)} />
      )}
      {pending && (
        <ActionModal key={`${pending.booking.reference}-${pending.action}`} booking={pending.booking} action={pending.action}
          busy={acting} error={actionError} onConfirm={runAction} onClose={closeAction} />
      )}
    </div>
  );
}
