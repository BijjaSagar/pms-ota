import { useState } from 'react';
import { CalendarDays, Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import RulesModalShell from './RulesModalShell.jsx';
import { MASTER_LISTS, masterLabel } from '../../lib/data/partner.js';

// Notices for guests, saved on the server. A notice covers stay dates and
// the whole property, all rooms, one room or one restaurant.

const STATUS = { active: 'Active', scheduled: 'Starts later', expired: 'Expired', deactivated: 'Switched off' };
const fmt = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const target = (value) => {
  if (value.startsWith('room:')) return { scope: 'ROOM', roomTypeId: value.slice(5) };
  if (value.startsWith('restaurant:')) return { scope: 'RESTAURANT', restaurantId: value.slice(11) };
  return { scope: value };
};
const targetOf = (notice) => (notice.scope === 'ROOM' ? `room:${notice.roomTypeId}` : notice.scope === 'RESTAURANT' ? `restaurant:${notice.restaurantId}` : notice.scope);
const addDays = (iso, days) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

export default function RulesNoticesTab({ data, busy, onRun }) {
  const [view, setView] = useState('live');
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [confirmId, setConfirmId] = useState(null);
  const categories = (MASTER_LISTS.noticeCategory ?? []).filter(([code]) => code);

  const live = data.notices.filter((notice) => notice.status === 'active' || notice.status === 'scheduled');
  const past = data.notices.filter((notice) => notice.status === 'expired' || notice.status === 'deactivated');
  const visible = view === 'live' ? live : past;
  const targetLabel = (notice) => {
    if (notice.scope === 'PROPERTY') return 'Whole property';
    if (notice.scope === 'ALL_ROOMS') return 'All rooms';
    if (notice.scope === 'ROOM') return data.rooms.find((room) => room.id === notice.roomTypeId)?.name ?? 'Room';
    return data.restaurants.find((item) => item.id === notice.restaurantId)?.name ?? 'Restaurant';
  };

  const open = (notice) => {
    setForm(notice
      ? { id: notice.id, category: notice.category, target: targetOf(notice), startsOn: notice.startsOn, endsOn: notice.endsOn, details: notice.details }
      : { id: null, category: '', target: 'PROPERTY', startsOn: data.today, endsOn: '', details: '' });
    setErrors({});
  };
  const close = () => { setForm(null); setErrors({}); };
  const set = (field, value) => { setForm((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: undefined, roomTypeId: undefined, restaurantId: undefined })); };

  const save = async () => {
    const problems = {};
    const details = form.details.trim();
    if (!form.category) problems.category = 'Choose a category.';
    if (!form.startsOn) problems.startsOn = 'Choose the first stay date.';
    if (!form.endsOn) problems.endsOn = 'Choose the last stay date.';
    else if (form.startsOn && form.endsOn < form.startsOn) problems.endsOn = 'Ends before it starts.';
    else if (!form.id && form.endsOn < data.today) problems.endsOn = 'This date has passed.';
    else if (form.startsOn && form.endsOn > addDays(form.startsOn, 365)) problems.endsOn = 'A notice can run for up to a year.';
    if (details.length < 10 || details.length > 500) problems.details = 'Write 10 to 500 characters.';
    setErrors(problems);
    if (Object.keys(problems).length) return;
    const body = { category: form.category, ...target(form.target), startsOn: form.startsOn, endsOn: form.endsOn, details };
    const result = await onRun((api) => (form.id ? api.updateNotice(form.id, body) : api.createNotice(body)), form.id ? 'Notice saved.' : 'Notice added.');
    if (result.ok) { close(); if (!form.id) setView('live'); } else if (result.fields) setErrors(result.fields);
  };

  return (
    <div className="rpw-tab-panel">
      <section className="rpw-card">
        <div className="rpw-card-head">
          <div>
            <h3>Notices for Guests</h3>
            <p>Renovations, service changes, weather or festival updates, shown to guests staying on those dates.</p>
          </div>
          <button type="button" className="rpw-btn is-primary" onClick={() => open(null)} disabled={busy}><Plus size={15} aria-hidden="true" />Add Notice</button>
        </div>
        <div className="rpw-view-tabs" role="tablist" aria-label="Notice status">
          <button type="button" role="tab" aria-selected={view === 'live'} className={view === 'live' ? 'is-active' : ''} onClick={() => { setView('live'); setConfirmId(null); }}>Active <span>{live.length}</span></button>
          <button type="button" role="tab" aria-selected={view === 'past'} className={view === 'past' ? 'is-active' : ''} onClick={() => { setView('past'); setConfirmId(null); }}>Expired / Switched off <span>{past.length}</span></button>
        </div>

        {visible.length ? (
          <div className="rpw-notice-list">
            {visible.map((notice) => (
              <article className="rpw-notice-row" key={notice.id}>
                <div className="rpw-notice-date"><CalendarDays size={15} aria-hidden="true" /><span>{fmt(notice.startsOn)} – {fmt(notice.endsOn)}</span></div>
                <div className="rpw-notice-main">
                  <strong>{masterLabel('noticeCategory', notice.category)}</strong>
                  <span>{targetLabel(notice)}</span>
                  <p>{notice.details}</p>
                </div>
                {confirmId === notice.id ? (
                  <div className="rpw-danger-box is-inline" role="alertdialog" aria-label="Delete notice">
                    <div><strong>Delete this notice?</strong><p>This can not be undone.</p></div>
                    <div className="rpw-danger-actions">
                      <button type="button" className="rpw-btn" autoFocus onClick={() => setConfirmId(null)}>No, keep it</button>
                      <button type="button" className="rpw-btn is-solid-danger" disabled={busy} onClick={async () => { if ((await onRun((api) => api.deleteNotice(notice.id), 'Notice deleted.')).ok) setConfirmId(null); }}><Trash2 size={14} aria-hidden="true" />Yes, delete</button>
                    </div>
                  </div>
                ) : (
                  <div className="rpw-notice-actions">
                    <span className={`rpw-pill ${notice.status === 'active' ? 'is-active' : notice.status === 'scheduled' ? 'is-scheduled' : ''}`}>{STATUS[notice.status]}</span>
                    <button type="button" className="rpw-icon-btn" onClick={() => open(notice)} aria-label="Edit notice" title="Edit"><Pencil size={15} aria-hidden="true" /></button>
                    {notice.status !== 'expired' ? (
                      <button type="button" className="rpw-icon-btn" disabled={busy} title={notice.active ? 'Switch off' : 'Switch on'} aria-label={notice.active ? 'Switch notice off' : 'Switch notice on'} onClick={() => onRun((api) => api.setNoticeActive(notice.id, !notice.active), notice.active ? 'Notice switched off.' : 'Notice switched on.')}>{notice.active ? <X size={15} aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}</button>
                    ) : null}
                    <button type="button" className="rpw-icon-btn is-danger" onClick={() => setConfirmId(notice.id)} aria-label="Delete notice" title="Delete"><Trash2 size={15} aria-hidden="true" /></button>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="rpw-empty"><CalendarDays size={22} aria-hidden="true" /><strong>{view === 'live' ? 'No active notices.' : 'Nothing has expired or been switched off.'}</strong>{view === 'live' ? <span>Add one when guests need to know something.</span> : null}</div>
        )}
      </section>

      {form ? (
        <RulesModalShell
          title={form.id ? 'Edit notice' : 'Add notice'}
          subtitle="Choose the stay dates and where it applies."
          onClose={busy ? () => {} : close}
          footer={<><button type="button" className="rpw-btn" onClick={close} disabled={busy}>Cancel</button><button type="button" className="rpw-btn is-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save notice'}</button></>}
        >
          <div className="rpw-form-grid">
            <label className="rpw-field">
              <span>Category</span>
              <select value={form.category} aria-invalid={Boolean(errors.category)} onChange={(event) => set('category', event.target.value)}>
                <option value="">Choose</option>
                {categories.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
              </select>
              {errors.category ? <small className="rpw-field-error">{errors.category}</small> : null}
            </label>
            <label className="rpw-field">
              <span>Applies to</span>
              <select value={form.target} onChange={(event) => set('target', event.target.value)}>
                <option value="PROPERTY">Whole property</option>
                <option value="ALL_ROOMS">All rooms</option>
                {data.rooms.length ? <optgroup label="One room">{data.rooms.map((room) => <option key={room.id} value={`room:${room.id}`}>{room.name}</option>)}</optgroup> : null}
                {data.restaurants.length ? <optgroup label="One restaurant">{data.restaurants.map((item) => <option key={item.id} value={`restaurant:${item.id}`}>{item.name}</option>)}</optgroup> : null}
              </select>
              {errors.roomTypeId || errors.restaurantId ? <small className="rpw-field-error">{errors.roomTypeId || errors.restaurantId}</small> : null}
            </label>
            <label className="rpw-field">
              <span>First stay date</span>
              <input type="date" value={form.startsOn} aria-invalid={Boolean(errors.startsOn)} onChange={(event) => set('startsOn', event.target.value)} />
              {errors.startsOn ? <small className="rpw-field-error">{errors.startsOn}</small> : null}
            </label>
            <label className="rpw-field">
              <span>Last stay date</span>
              <input type="date" min={form.startsOn || undefined} value={form.endsOn} aria-invalid={Boolean(errors.endsOn)} onChange={(event) => set('endsOn', event.target.value)} />
              {errors.endsOn ? <small className="rpw-field-error">{errors.endsOn}</small> : null}
            </label>
            <label className="rpw-field is-full">
              <span>What guests should know</span>
              <textarea rows="4" maxLength={500} value={form.details} aria-invalid={Boolean(errors.details)} onChange={(event) => set('details', event.target.value)} placeholder="e.g. The rooftop lounge is closed for renovation; breakfast is served in the lobby." />
              <small className="rpw-counter">{form.details.trim().length}/500</small>
              {errors.details ? <small className="rpw-field-error">{errors.details}</small> : null}
            </label>
          </div>
        </RulesModalShell>
      ) : null}
    </div>
  );
}
