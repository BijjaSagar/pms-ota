import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import '../../styles/partner-margin-offers.css';

const TABS = [
  { id: 'active', label: 'Active Offers' },
  { id: 'inactive', label: 'Inactive Offers' },
];

const COLUMNS = [
  { key: 'bookingValidity', label: 'Booking Validity' },
  { key: 'checkinValidity', label: 'Checkin Validity' },
  { key: 'relatedTo', label: 'Related To' },
  { key: 'relatedName', label: 'Related Name' },
  { key: 'availableDays', label: 'Available Days' },
  { key: 'offerInfo', label: 'Offer Info' },
  { key: 'pahApplicable', label: 'PAH Applicable' },
];

const OFFERS = { active: [], inactive: [] };
const PAGE_SIZE = 10;

function Pagination({ page, pageCount, disabled, onChange }) {
  return (
    <nav className="mo-pagination" aria-label="Promotion pages">
      <span className="mo-page-status" aria-live="polite">Page {page} of {pageCount}</span>
      <button type="button" aria-label="First page" disabled={disabled || page <= 1} onClick={() => onChange(1)}>
        <ChevronsLeft size={16} aria-hidden="true" />
      </button>
      <button type="button" aria-label="Previous page" disabled={disabled || page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={16} aria-hidden="true" />
      </button>
      <button type="button" aria-label="Next page" disabled={disabled || page >= pageCount} onClick={() => onChange(page + 1)}>
        <ChevronRight size={16} aria-hidden="true" />
      </button>
      <button type="button" aria-label="Last page" disabled={disabled || page >= pageCount} onClick={() => onChange(pageCount)}>
        <ChevronsRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}

export function MarginOffers() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'inactive' ? 'inactive' : 'active';
  const [page, setPage] = useState(1);
  const rows = OFFERS[tab];
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [tab]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const selectTab = (id) => {
    if (id === tab) return;
    const next = new URLSearchParams(params);
    if (id === 'active') next.delete('tab');
    else next.set('tab', id);
    next.delete('page');
    setParams(next);
  };

  const goToPage = (next) => setPage(Math.max(1, Math.min(pageCount, next)));

  return (
    <div className="mo-page">
      <header className="mo-head">
        <div>
          <h1 className="mo-title">Promotions</h1>
          <p className="mo-sub">Manage active and inactive promotional offers for this property.</p>
        </div>
      </header>

      <nav className="mo-tabs" role="tablist" aria-label="Promotion status">
        {TABS.map((item) => (
          <button type="button" role="tab" key={item.id} id={`mo-tab-${item.id}`}
            aria-selected={tab === item.id} aria-controls={`mo-panel-${item.id}`}
            className={tab === item.id ? 'is-current' : ''} onClick={() => selectTab(item.id)}>
            {item.label}
          </button>
        ))}
      </nav>

      <section className="mo-card" id={`mo-panel-${tab}`} role="tabpanel" aria-labelledby={`mo-tab-${tab}`}>
        <div className="mo-table-wrap">
          <table className="mo-table">
            <thead>
              <tr>
                {COLUMNS.map((column) => <th key={column.key} scope="col">{column.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td className="mo-empty-cell" colSpan={COLUMNS.length}>
                    <div className="mo-empty" role="status">No data to show</div>
                  </td>
                </tr>
              ) : pageRows.map((offer, index) => (
                <tr key={offer.id ?? index}>
                  {COLUMNS.map((column) => (
                    <td key={column.key} data-label={column.label}>{offer[column.key] ?? '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={safePage} pageCount={pageCount} disabled={rows.length === 0} onChange={goToPage} />
      </section>
    </div>
  );
}
