import { useState } from 'react';
import { CalendarDays, Check, Eye, Pencil, Plus, Trash2, X } from 'lucide-react';
import RulesModalShell from './RulesModalShell.jsx';
import {
  ASSOCIATED_WITH_OPTIONS,
  NOTICE_CATEGORIES,
  formatDateRange,
  getNoticeStatus,
  makeRulesId,
} from '../../lib/data/rulesPolicies.js';

const emptyNotice = () => ({
  id: '',
  category: NOTICE_CATEGORIES[0],
  associatedWith: ASSOCIATED_WITH_OPTIONS[0],
  startDate: '',
  endDate: '',
  details: '',
  status: 'active',
});

const cloneNotice = (notice) => ({ ...emptyNotice(), ...notice });

export default function RulesNoticesTab({ notices, onSaveNotice, onDeleteNotice, onToggleNoticeStatus }) {
  const [view, setView] = useState('active');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');

  const active = notices.filter((notice) => getNoticeStatus(notice) === 'active');
  const inactive = notices.filter((notice) => getNoticeStatus(notice) !== 'active');
  const visible = view === 'active' ? active : inactive;

  const closeModal = () => {
    setModal(null);
    setForm(null);
    setError('');
  };

  const openNotice = (notice, mode) => {
    setForm(cloneNotice(notice));
    setModal({ mode, noticeId: notice?.id ?? null });
    setError('');
  };

  const saveNotice = () => {
    if (!form.details.trim()) {
      setError('Enter the notice details.');
      return;
    }
    if (!form.startDate || !form.endDate) {
      setError('Choose both a start date and an end date.');
      return;
    }
    if (new Date(`${form.endDate}T00:00:00`) < new Date(`${form.startDate}T00:00:00`)) {
      setError('The end date must be after the start date.');
      return;
    }
    onSaveNotice({ ...form, id: form.id || makeRulesId('notice'), details: form.details.trim() });
    closeModal();
  };

  const statusLabel = (notice) => {
    const status = getNoticeStatus(notice);
    return status === 'expired' ? 'Expired' : status === 'deactivated' ? 'Deactivated' : 'Active';
  };

  return (
    <div className="rpw-tab-panel">
      <section className="rpw-card">
        <div className="rpw-card-head">
          <div>
            <h3>Customer Notices</h3>
            <p>Announce renovations, service changes, weather and festival updates.</p>
          </div>
          <button type="button" className="rpw-btn is-primary" onClick={() => openNotice(null, 'edit')}><Plus size={15} aria-hidden="true" />Create Notice</button>
        </div>
        <div className="rpw-view-tabs" role="tablist" aria-label="Notice status">
          <button type="button" role="tab" aria-selected={view === 'active'} className={view === 'active' ? 'is-active' : ''} onClick={() => setView('active')}>Active <span>{active.length}</span></button>
          <button type="button" role="tab" aria-selected={view === 'inactive'} className={view === 'inactive' ? 'is-active' : ''} onClick={() => setView('inactive')}>Expired / Deactivated <span>{inactive.length}</span></button>
        </div>

        {visible.length ? (
          <div className="rpw-notice-list">
            {visible.map((notice) => (
              <article className="rpw-notice-row" key={notice.id}>
                <div className="rpw-notice-date"><CalendarDays size={15} aria-hidden="true" /><span>{formatDateRange(notice.startDate, notice.endDate)}</span></div>
                <div className="rpw-notice-main">
                  <strong>{notice.category}</strong>
                  <span>{notice.associatedWith}</span>
                  <p>{notice.details}</p>
                </div>
                <div className="rpw-notice-actions">
                  <span className={`rpw-pill ${getNoticeStatus(notice) === 'active' ? 'is-active' : ''}`}>{statusLabel(notice)}</span>
                  <button type="button" className="rpw-icon-btn" onClick={() => openNotice(notice, 'view')} aria-label="View notice"><Eye size={15} aria-hidden="true" /></button>
                  <button type="button" className="rpw-icon-btn" onClick={() => openNotice(notice, 'edit')} aria-label="Edit notice"><Pencil size={15} aria-hidden="true" /></button>
                  <button type="button" className="rpw-icon-btn" onClick={() => onToggleNoticeStatus(notice.id)} aria-label={getNoticeStatus(notice) === 'active' ? 'Deactivate notice' : 'Activate notice'}>{getNoticeStatus(notice) === 'active' ? <X size={15} aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}</button>
                  <button type="button" className="rpw-icon-btn is-danger" onClick={() => onDeleteNotice(notice.id)} aria-label="Delete notice"><Trash2 size={15} aria-hidden="true" /></button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rpw-empty"><CalendarDays size={22} aria-hidden="true" /><strong>No notices in this view.</strong><span>Create a notice or switch between status tabs.</span></div>
        )}
      </section>

      {modal ? (
        <RulesModalShell
          title={modal.mode === 'view' ? 'Notice details' : modal.noticeId ? 'Edit notice' : 'Create notice'}
          subtitle="Choose the stay dates and who this notice applies to."
          onClose={closeModal}
          footer={modal.mode === 'view'
            ? <button type="button" className="rpw-btn" onClick={closeModal}>Close</button>
            : <><button type="button" className="rpw-btn" onClick={closeModal}>Cancel</button><button type="button" className="rpw-btn is-primary" onClick={saveNotice}>Save notice</button></>}
        >
          {error ? <div className="rpw-inline-error" role="alert">{error}</div> : null}
          <div className="rpw-form-grid">
            <label className="rpw-field"><span>Category</span><select disabled={modal.mode === 'view'} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{NOTICE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
            <label className="rpw-field"><span>Associated with</span><select disabled={modal.mode === 'view'} value={form.associatedWith} onChange={(event) => setForm({ ...form, associatedWith: event.target.value })}>{ASSOCIATED_WITH_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
            <label className="rpw-field"><span>Start date</span><input type="date" disabled={modal.mode === 'view'} value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} /></label>
            <label className="rpw-field"><span>End date</span><input type="date" disabled={modal.mode === 'view'} value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} /></label>
            <label className="rpw-field is-full"><span>Notice details</span><textarea rows="4" disabled={modal.mode === 'view'} value={form.details} onChange={(event) => setForm({ ...form, details: event.target.value })} placeholder="What should guests know?" /></label>
            {modal.mode === 'edit' ? (
              <label className="rpw-field is-full"><span>Status</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="active">Active</option><option value="deactivated">Deactivated</option></select></label>
            ) : null}
          </div>
        </RulesModalShell>
      ) : null}
    </div>
  );
}
