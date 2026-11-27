import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Check, ChevronDown, ChevronRight, Gift, Info, Package, Pencil, Plus, RotateCcw, Trash2, X,
} from 'lucide-react';
import { masterLabel } from '../../lib/data/partner.js';
import {
  addPlanInclusion, createRatePlan, deletePlanInclusion, deleteRatePlan, getInclusions, loadMasters,
  setPlanInclusions, updatePlanInclusion, updateRatePlan,
} from '../../lib/api/properties.js';

// Inclusions & Packages, saved on the server. Rooms and their rate plans are
// the property's own (Rooms & Rateplans); each plan offers inclusions from
// the shared list, with the property's wording and optional dates. A
// package is an extra rate plan with its own price and inclusions.

const FAMILIES = [['EP', 'EP – room only'], ['CP', 'CP – one meal'], ['MAP', 'MAP – two meals'], ['AP', 'AP – all meals']];
const STATUS_LABEL = { active: 'Active', scheduled: 'Starts later', expired: 'Expired', deactivated: 'Deactivated' };
const MONEY = /^\d{1,8}(\.\d{1,2})?$/;
const LIVE = (row) => row.status === 'active' || row.status === 'scheduled';
const fmtDate = (iso) => (iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '');
const dates = (row) => [row.startsOn && `from ${fmtDate(row.startsOn)}`, row.endsOn && `until ${fmtDate(row.endsOn)}`].filter(Boolean).join(' ');

/** Server field errors -> { field: message } for the form. */
const fieldErrors = (problem) => Object.fromEntries(Object.entries(problem?.fieldErrors ?? {})
  .map(([field, message]) => [field.split('.')[0], /^[A-Z]/.test(message) ? message : `This ${message}.`]));

function ModalShell({ title, subtitle, children, onClose, wide }) {
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; };
  }, [onClose]);
  return (
    <div className="ipw-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`ipw-modal ${wide ? 'is-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="ipw-modal-title">
        <header className="ipw-modal-head">
          <div>
            <h3 id="ipw-modal-title">{title}</h3>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button type="button" className="ipw-icon-btn" onClick={onClose} aria-label="Close dialog"><X size={18} aria-hidden="true" /></button>
        </header>
        <div className="ipw-modal-body">{children}</div>
      </section>
    </div>
  );
}

function Field({ label, error, children, full, hint }) {
  return (
    <label className={`ipw-field ${full ? 'is-full' : ''}`}>
      <span>{label}</span>
      {children}
      {hint && !error ? <small className="ipw-hint">{hint}</small> : null}
      {error ? <small className="ipw-error" role="alert">{error}</small> : null}
    </label>
  );
}

/** The shared inclusion list, grouped by category, as a checklist. */
function InclusionChecklist({ catalogue, selected, onToggle, disabledCodes = [] }) {
  const groups = useMemo(() => {
    const byCategory = new Map();
    catalogue.forEach((item) => byCategory.set(item.category, [...(byCategory.get(item.category) ?? []), item]));
    return [...byCategory];
  }, [catalogue]);
  return (
    <div className="ipw-check-section">
      {groups.map(([category, items]) => (
        <div key={category} className="ipw-check-group">
          <h5>{masterLabel('inclusionCategory', category)}</h5>
          <div className="ipw-check-grid">
            {items.map((item) => {
              const checked = selected.includes(item.code);
              const disabled = disabledCodes.includes(item.code);
              return (
                <label key={item.code} className={`${checked ? 'is-checked' : ''} ${disabled ? 'is-disabled' : ''}`} title={item.description}>
                  <input type="checkbox" checked={checked} disabled={disabled} onChange={() => onToggle(item.code)} />
                  <span>{item.name}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function InclusionsPackagesWorkspace({ property, onPropertyChange }) {
  const propertyId = property.id;
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'expired' ? 'expired' : 'active';
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [openPlanIds, setOpenPlanIds] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [confirm, setConfirm] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const [, next] = await Promise.all([loadMasters(), getInclusions(propertyId)]);
      setData(next);
      setSelectedRoomId((current) => current || next.rooms[0]?.id || '');
    } catch (problem) {
      setLoadError(problem?.message || 'Could not load the inclusions.');
    }
  }, [propertyId]);
  useEffect(() => { load(); }, [load]);

  const rooms = data?.rooms ?? [];
  const catalogue = data?.catalogue ?? [];
  const allRows = useMemo(() => rooms.flatMap((room) => room.plans.flatMap((plan) => plan.inclusions.map((row) => ({ ...row, room, plan })))), [rooms]);
  const liveCount = allRows.filter(LIVE).length;
  const pastRows = allRows.filter((row) => !LIVE(row));
  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) ?? rooms[0];

  const changeTab = (next) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'active') params.delete('tab');
    else params.set('tab', next);
    setSearchParams(params, { replace: true });
    setNotice(null);
    setConfirm(null);
  };

  const close = () => { setModal(null); setForm(null); setErrors({}); setConfirm(null); };
  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  /** Runs a change; the server answers with the whole Inclusions view. */
  const run = async (action, success) => {
    setBusy(true);
    setNotice(null);
    try {
      const next = await action();
      if (next?.rooms && next?.catalogue) setData(next);
      if (success) setNotice({ kind: 'success', text: success });
      return true;
    } catch (problem) {
      const fields = fieldErrors(problem);
      if (Object.keys(fields).length && modal) setErrors(fields);
      else setNotice({ kind: 'error', text: problem?.message || 'That did not work. Please try again.' });
      return false;
    } finally {
      setBusy(false);
    }
  };

  // ------------------------------------------------------------- inclusions
  const openOffer = (roomId, planId) => {
    const room = rooms.find((item) => item.id === (roomId ?? selectedRoom?.id)) ?? rooms[0];
    setForm({ roomId: room?.id ?? '', planId: planId ?? room?.plans[0]?.id ?? '', code: '', details: '', startsOn: '', endsOn: '' });
    setErrors({});
    setModal({ kind: 'offer' });
  };
  const formRoom = rooms.find((room) => room.id === form?.roomId);
  const formPlan = formRoom?.plans.find((plan) => plan.id === form?.planId);

  const saveOffer = async (event) => {
    event.preventDefault();
    const problems = {};
    if (!form.planId) problems.planId = 'Choose a rate plan.';
    if (!form.code) problems.code = 'Choose what to include.';
    if (form.details.length > 300) problems.details = 'Keep it under 300 characters.';
    if (form.startsOn && form.endsOn && form.endsOn < form.startsOn) problems.endsOn = 'The end can not be before the start.';
    setErrors(problems);
    if (Object.keys(problems).length) return;
    const name = catalogue.find((item) => item.code === form.code)?.name;
    if (await run(() => addPlanInclusion(propertyId, form.planId, {
      code: form.code,
      details: form.details.trim() || undefined,
      startsOn: form.startsOn || undefined,
      endsOn: form.endsOn || undefined,
    }), `${name} offered on ${formPlan?.name}.`)) {
      setOpenPlanIds((current) => [...new Set([...current, form.planId])]);
      close();
    }
  };

  const openEdit = (row) => {
    setForm({ rowId: row.id, name: row.name, details: row.details ?? '', startsOn: row.startsOn ?? '', endsOn: row.endsOn ?? '', active: row.active });
    setErrors({});
    setModal({ kind: 'edit' });
  };
  const saveEdit = async (event) => {
    event.preventDefault();
    const problems = {};
    if (form.details.length > 300) problems.details = 'Keep it under 300 characters.';
    if (form.startsOn && form.endsOn && form.endsOn < form.startsOn) problems.endsOn = 'The end can not be before the start.';
    setErrors(problems);
    if (Object.keys(problems).length) return;
    if (await run(() => updatePlanInclusion(propertyId, form.rowId, {
      details: form.details.trim() || null,
      startsOn: form.startsOn || null,
      endsOn: form.endsOn || null,
      active: form.active,
    }), `${form.name} updated.`)) close();
  };

  const switchOff = (row) => run(() => updatePlanInclusion(propertyId, row.id, { active: false }), `${row.name} moved to Expired / Deactivated.`);
  const restore = (row) => run(() => updatePlanInclusion(propertyId, row.id, {
    active: true, ...(row.status === 'expired' && { endsOn: null }),
  }), `${row.name} is active again.`);
  const removeRow = async (row) => {
    if (await run(() => deletePlanInclusion(propertyId, row.id), `${row.name} removed.`)) setConfirm(null);
  };

  // --------------------------------------------------------------- packages
  const openPackage = (room, plan) => {
    setForm(plan
      ? { mode: 'edit', roomId: room.id, planId: plan.id, standard: plan.standard, name: plan.name, codes: plan.inclusions.map((row) => row.code) }
      : { mode: 'create', roomId: (room ?? selectedRoom)?.id ?? '', name: '', code: 'CP', weekdayRate: '', weekendRate: '', codes: [] });
    setErrors({});
    setModal({ kind: 'package' });
  };
  const togglePackageCode = (code) => setField('codes', form.codes.includes(code) ? form.codes.filter((item) => item !== code) : [...form.codes, code]);

  const savePackage = async (event) => {
    event.preventDefault();
    const problems = {};
    const name = form.name.trim();
    if (!form.standard && (name.length < 2 || name.length > 60)) problems.name = 'Enter a name (2–60 characters).';
    if (form.mode === 'create') {
      if (!form.roomId) problems.roomId = 'Choose a room.';
      if (!MONEY.test(form.weekdayRate) || Number(form.weekdayRate) < 1) problems.weekdayRate = 'Enter the rate in rupees.';
      if (form.weekendRate && (!MONEY.test(form.weekendRate) || Number(form.weekendRate) < 1)) problems.weekendRate = 'Enter the rate, or leave it empty.';
    }
    if (form.codes.length > 40) problems.codes = 'A package can include at most 40 items.';
    setErrors(problems);
    if (Object.keys(problems).length) return;

    setBusy(true);
    setNotice(null);
    try {
      let planId = form.planId;
      if (form.mode === 'create') {
        const detail = await createRatePlan(propertyId, form.roomId, {
          kind: 'PACKAGE', code: form.code, name,
          weekdayRate: Number(form.weekdayRate),
          weekendRate: form.weekendRate ? Number(form.weekendRate) : undefined,
        });
        onPropertyChange?.(detail);
        planId = detail.rooms.find((room) => room.id === form.roomId)?.ratePlans.find((plan) => plan.name.toLowerCase() === name.toLowerCase())?.id;
      } else if (!form.standard && name !== rooms.find((room) => room.id === form.roomId)?.plans.find((plan) => plan.id === planId)?.name) {
        onPropertyChange?.(await updateRatePlan(propertyId, form.roomId, planId, { name }));
      }
      setData(await setPlanInclusions(propertyId, planId, form.codes));
      setNotice({ kind: 'success', text: form.mode === 'create' ? `${name} created.` : `${form.standard ? form.name : name} updated.` });
      setSelectedRoomId(form.roomId);
      setOpenPlanIds((current) => [...new Set([...current, planId])]);
      close();
    } catch (problem) {
      const fields = fieldErrors(problem);
      if (Object.keys(fields).length) setErrors(fields);
      else setNotice({ kind: 'error', text: problem?.message || 'We could not save the package.' });
    } finally {
      setBusy(false);
    }
  };

  const removePackage = async () => {
    setBusy(true);
    try {
      onPropertyChange?.(await deleteRatePlan(propertyId, form.roomId, form.planId));
      setData(await getInclusions(propertyId));
      setNotice({ kind: 'success', text: `${form.name} deleted.` });
      setConfirm(null);
      close();
    } catch (problem) {
      setErrors({ name: problem?.message || 'We could not delete the package.' });
    } finally {
      setBusy(false);
    }
  };

  // ------------------------------------------------------------------ view
  if (!data) {
    return loadError ? (
      <div className="ipw-notice error" role="alert"><Info size={15} aria-hidden="true" /> {loadError} <button type="button" className="ipw-btn" onClick={load}>Try again</button></div>
    ) : <div className="ipw-loading" role="status">Loading inclusions…</div>;
  }

  const offerDisabled = formPlan ? formPlan.inclusions.map((row) => row.code) : [];

  return (
    <div className="ipw-root">
      <header className="ipw-header">
        <div className="ipw-heading">
          <span className="ipw-heading-icon"><Gift size={20} aria-hidden="true" /></span>
          <div>
            <h2>Inclusions and Packages</h2>
            <p>What guests get with each rate plan, and packages with their own price.</p>
          </div>
        </div>
        <div className="ipw-actions">
          <button type="button" className="ipw-btn is-primary" onClick={() => openPackage(null, null)} disabled={!rooms.length}>
            <Plus size={15} aria-hidden="true" /> Create A Package
          </button>
          <button type="button" className="ipw-btn" onClick={() => openOffer()} disabled={!rooms.length}>
            <Plus size={15} aria-hidden="true" /> Offer an Inclusion
          </button>
        </div>
      </header>

      {notice ? <div className={`ipw-notice ${notice.kind}`} role="status">{notice.text}</div> : null}

      <nav className="ipw-tabs" aria-label="Inclusion status">
        <button type="button" className={tab === 'active' ? 'is-on' : ''} onClick={() => changeTab('active')}>All Customer Inclusions ({liveCount})</button>
        <button type="button" className={tab === 'expired' ? 'is-on' : ''} onClick={() => changeTab('expired')}>Expired / Deactivated ({pastRows.length})</button>
      </nav>

      {!rooms.length ? (
        <div className="ipw-empty-panel"><Gift size={24} aria-hidden="true" /><h3>No rooms yet</h3><p>Add a room in Rooms &amp; Rateplans first; inclusions belong to its rate plans.</p></div>
      ) : tab === 'active' ? (
        <div className="ipw-main">
          <aside className="ipw-room-rail" aria-label="Room categories">
            <div className="ipw-rail-head">
              <h3>Room categories</h3>
              <span>{rooms.length}</span>
            </div>
            {rooms.map((room) => {
              const selected = selectedRoom?.id === room.id;
              const count = room.plans.reduce((sum, plan) => sum + plan.inclusions.filter(LIVE).length, 0);
              return (
                <div className={`ipw-room-item ${selected ? 'is-selected' : ''}`} key={room.id}>
                  <button type="button" onClick={() => { setSelectedRoomId(room.id); setOpenPlanIds([]); setConfirm(null); }} aria-pressed={selected}>
                    <span className="ipw-room-icon"><Package size={15} aria-hidden="true" /></span>
                    <span className="ipw-room-copy">
                      <strong>{room.name}{room.active ? '' : ' (off)'}</strong>
                      <small>{count} active inclusion{count === 1 ? '' : 's'}</small>
                    </span>
                    <ChevronRight size={16} className={selected ? 'is-open' : ''} aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </aside>

          <div className="ipw-panels">
            {selectedRoom ? (
              <section className="ipw-room-panel" key={selectedRoom.id}>
                <header className="ipw-room-panel-head">
                  <div>
                    <h3>{selectedRoom.name}</h3>
                    <p>Open a rate plan to see what it includes.</p>
                  </div>
                </header>
                <div className="ipw-plan-grid">
                  {selectedRoom.plans.map((plan) => {
                    const rows = plan.inclusions.filter(LIVE);
                    const open = openPlanIds.includes(plan.id);
                    return (
                      <article className={`ipw-plan-card ${open ? 'is-open' : ''} ${plan.active ? '' : 'is-off'}`} key={plan.id}>
                        <header className="ipw-plan-head">
                          <button type="button" className="ipw-plan-toggle" aria-expanded={open}
                            onClick={() => setOpenPlanIds((current) => (current.includes(plan.id) ? current.filter((id) => id !== plan.id) : [...current, plan.id]))}>
                            <span className="ipw-plan-code">{plan.standard ? plan.code : 'PKG'}</span>
                            <span className="ipw-plan-copy">
                              <strong>{plan.name}</strong>
                              <small>{rows.length} inclusion{rows.length === 1 ? '' : 's'}{plan.active ? '' : ' · not on sale'}</small>
                            </span>
                            <span className="ipw-plan-toggle-action">{open ? 'Hide' : 'Open'}</span>
                            <ChevronDown size={16} className={`ipw-plan-chevron ${open ? 'is-open' : ''}`} aria-hidden="true" />
                          </button>
                          <button type="button" className="ipw-link" onClick={() => openPackage(selectedRoom, plan)}><Pencil size={13} aria-hidden="true" /> {plan.standard ? 'Edit inclusions' : 'Edit package'}</button>
                        </header>
                        {open ? (
                          <>
                            <div className="ipw-inclusion-list">
                              {rows.map((row) => (
                                <div className={`ipw-inclusion-card ${confirm === row.id ? 'is-confirming' : ''}`} key={row.id}>
                                  <span className="ipw-inclusion-copy">
                                    <strong>{row.name}{row.status === 'scheduled' ? <em className="ipw-status-chip">Starts later</em> : null}</strong>
                                    <small>{row.details || row.description}{dates(row) ? ` · ${dates(row)}` : ''}</small>
                                  </span>
                                  {confirm === row.id ? (
                                    <span className="ipw-inclusion-actions is-confirm">
                                      <span className="ipw-confirm-text">Remove {row.name} from this plan?</span>
                                      <button type="button" onClick={() => setConfirm(null)}>Keep</button>
                                      <button type="button" className="is-danger" disabled={busy} onClick={() => removeRow(row)}>Remove</button>
                                    </span>
                                  ) : (
                                    <span className="ipw-inclusion-actions">
                                      <button type="button" onClick={() => openEdit(row)} aria-label={`Edit ${row.name}`}><Pencil size={13} aria-hidden="true" /></button>
                                      <button type="button" onClick={() => switchOff(row)} disabled={busy} aria-label={`Deactivate ${row.name}`} title="Deactivate"><RotateCcw size={13} aria-hidden="true" /></button>
                                      <button type="button" onClick={() => setConfirm(row.id)} aria-label={`Remove ${row.name}`}><Trash2 size={13} aria-hidden="true" /></button>
                                    </span>
                                  )}
                                </div>
                              ))}
                              {!rows.length ? <p className="ipw-empty-list">Nothing is included with this rate plan yet.</p> : null}
                            </div>
                            <button type="button" className="ipw-add-inline" onClick={() => openOffer(selectedRoom.id, plan.id)}>
                              <Plus size={14} aria-hidden="true" /> Offer an Inclusion
                            </button>
                          </>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="ipw-expired-grid">
          {pastRows.map((row) => (
            <article className="ipw-expired-card" key={row.id}>
              <div className="ipw-expired-head">
                <span className={`ipw-status ${row.status}`}>{STATUS_LABEL[row.status]}</span>
                {row.endsOn ? <small>Until {fmtDate(row.endsOn)}</small> : null}
              </div>
              <h4>{row.name}</h4>
              <p className="ipw-source">{row.room.name} · {row.plan.name}</p>
              <p>{row.details || row.description}</p>
              {confirm === row.id ? (
                <div className="ipw-card-actions is-confirm">
                  <span>Remove this inclusion? This can not be undone.</span>
                  <button type="button" onClick={() => setConfirm(null)}>Keep</button>
                  <button type="button" className="is-danger" disabled={busy} onClick={() => removeRow(row)}>Remove</button>
                </div>
              ) : (
                <div className="ipw-card-actions">
                  <button type="button" onClick={() => openEdit(row)}><Pencil size={13} aria-hidden="true" /> Edit</button>
                  <button type="button" onClick={() => restore(row)} disabled={busy}><RotateCcw size={13} aria-hidden="true" /> Restore</button>
                  <button type="button" onClick={() => setConfirm(row.id)}><Trash2 size={13} aria-hidden="true" /> Remove</button>
                </div>
              )}
            </article>
          ))}
          {!pastRows.length ? <div className="ipw-empty-panel"><Gift size={24} aria-hidden="true" /><h3>Nothing here</h3><p>No inclusion has ended or been switched off.</p></div> : null}
        </div>
      )}

      {modal?.kind === 'offer' && form ? (
        <ModalShell title="Offer an inclusion" subtitle="Pick what guests get, and on which rate plan." onClose={close} wide>
          <form className="ipw-form" onSubmit={saveOffer} noValidate>
            <div className="ipw-form-grid">
              <Field label="Room category" error={errors.roomId}>
                <select value={form.roomId} onChange={(event) => {
                  const room = rooms.find((item) => item.id === event.target.value);
                  setForm((current) => ({ ...current, roomId: room.id, planId: room.plans[0]?.id ?? '', code: '' }));
                }}>
                  {rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
                </select>
              </Field>
              <Field label="Rate plan" error={errors.planId}>
                <select value={form.planId} onChange={(event) => { setField('planId', event.target.value); setField('code', ''); }}>
                  {(formRoom?.plans ?? []).map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
                </select>
              </Field>
              <Field label="Inclusion" error={errors.code} full>
                <select value={form.code} onChange={(event) => setField('code', event.target.value)}>
                  <option value="">Choose what guests get</option>
                  {[...new Set(catalogue.map((item) => item.category))].map((category) => (
                    <optgroup key={category} label={masterLabel('inclusionCategory', category)}>
                      {catalogue.filter((item) => item.category === category).map((item) => (
                        <option key={item.code} value={item.code} disabled={offerDisabled.includes(item.code)}>
                          {item.name}{offerDisabled.includes(item.code) ? ' (already offered)' : ''}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </Field>
              <Field label="Your wording (optional)" error={errors.details} full hint={catalogue.find((item) => item.code === form.code)?.description}>
                <textarea maxLength={300} value={form.details} onChange={(event) => setField('details', event.target.value)} placeholder="e.g. Fresh lime soda on arrival" />
              </Field>
              <Field label="Starts on (optional)" error={errors.startsOn}><input type="date" value={form.startsOn} onChange={(event) => setField('startsOn', event.target.value)} /></Field>
              <Field label="Ends on (optional)" error={errors.endsOn}><input type="date" value={form.endsOn} min={form.startsOn || undefined} onChange={(event) => setField('endsOn', event.target.value)} /></Field>
            </div>
            <footer className="ipw-modal-foot">
              <span />
              <div className="ipw-modal-foot-actions">
                <button type="button" className="ipw-btn" onClick={close}>Cancel</button>
                <button type="submit" className="ipw-btn is-primary" disabled={busy}><Check size={14} aria-hidden="true" /> {busy ? 'Saving…' : 'Offer inclusion'}</button>
              </div>
            </footer>
          </form>
        </ModalShell>
      ) : null}

      {modal?.kind === 'edit' && form ? (
        <ModalShell title={`Edit ${form.name}`} subtitle="Wording, dates and whether guests get it." onClose={close}>
          <form className="ipw-form" onSubmit={saveEdit} noValidate>
            <div className="ipw-form-grid">
              <Field label="Your wording (optional)" error={errors.details} full>
                <textarea maxLength={300} value={form.details} onChange={(event) => setField('details', event.target.value)} />
              </Field>
              <Field label="Starts on (optional)" error={errors.startsOn}><input type="date" value={form.startsOn} onChange={(event) => setField('startsOn', event.target.value)} /></Field>
              <Field label="Ends on (optional)" error={errors.endsOn}><input type="date" value={form.endsOn} min={form.startsOn || undefined} onChange={(event) => setField('endsOn', event.target.value)} /></Field>
              <label className="ipw-field ipw-check-row is-full">
                <input type="checkbox" checked={form.active} onChange={(event) => setField('active', event.target.checked)} />
                <span>Guests get this inclusion</span>
              </label>
            </div>
            <footer className="ipw-modal-foot">
              <span />
              <div className="ipw-modal-foot-actions">
                <button type="button" className="ipw-btn" onClick={close}>Cancel</button>
                <button type="submit" className="ipw-btn is-primary" disabled={busy}><Check size={14} aria-hidden="true" /> {busy ? 'Saving…' : 'Save'}</button>
              </div>
            </footer>
          </form>
        </ModalShell>
      ) : null}

      {modal?.kind === 'package' && form ? (
        <ModalShell
          title={form.mode === 'create' ? 'Create a package' : form.standard ? `Inclusions of ${form.name}` : 'Edit package'}
          subtitle={form.mode === 'create' ? 'A new rate plan with its own price and what it includes.' : 'Tick everything this rate plan includes.'}
          onClose={close}
          wide
        >
          <form className="ipw-form" onSubmit={savePackage} noValidate>
            <div className="ipw-form-grid">
              {!form.standard ? (
                <Field label="Package name" error={errors.name} full>
                  <input value={form.name} maxLength={60} onChange={(event) => setField('name', event.target.value)} placeholder="e.g. CP2 – Super Package" />
                </Field>
              ) : null}
              {form.mode === 'create' ? (
                <>
                  <Field label="Room category" error={errors.roomId}>
                    <select value={form.roomId} onChange={(event) => setField('roomId', event.target.value)}>
                      {rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Meals included">
                    <select value={form.code} onChange={(event) => setField('code', event.target.value)}>
                      {FAMILIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </Field>
                  <Field label="Rate Sun–Thu (₹)" error={errors.weekdayRate}>
                    <input type="number" min="1" inputMode="decimal" value={form.weekdayRate} onChange={(event) => setField('weekdayRate', event.target.value)} placeholder="e.g. 4500" />
                  </Field>
                  <Field label="Rate Fri–Sat (₹)" error={errors.weekendRate} hint="Empty: same as Sun–Thu.">
                    <input type="number" min="1" inputMode="decimal" value={form.weekendRate} onChange={(event) => setField('weekendRate', event.target.value)} />
                  </Field>
                </>
              ) : null}
            </div>
            <h4 className="ipw-section-title">Included ({form.codes.length})</h4>
            {errors.codes ? <small className="ipw-error" role="alert">{errors.codes}</small> : null}
            <InclusionChecklist catalogue={catalogue} selected={form.codes} onToggle={togglePackageCode} />
            {confirm === 'package' ? (
              <div className="ipw-danger-box" role="alertdialog" aria-labelledby="ipw-delete-title">
                <div>
                  <strong id="ipw-delete-title">Delete “{form.name}”?</strong>
                  <p>Guests will no longer be able to book this package. This can not be undone.</p>
                </div>
                <div className="ipw-danger-actions">
                  <button type="button" className="ipw-btn" autoFocus onClick={() => setConfirm(null)}>No, keep it</button>
                  <button type="button" className="ipw-btn is-solid-danger" onClick={removePackage} disabled={busy}>
                    <Trash2 size={14} aria-hidden="true" /> {busy ? 'Deleting…' : 'Yes, delete'}
                  </button>
                </div>
              </div>
            ) : null}
            <footer className="ipw-modal-foot">
              {form.mode === 'edit' && !form.standard && confirm !== 'package' ? (
                <button type="button" className="ipw-btn is-danger" onClick={() => setConfirm('package')}><Trash2 size={14} aria-hidden="true" /> Delete package</button>
              ) : <span />}
              <div className="ipw-modal-foot-actions">
                <button type="button" className="ipw-btn" onClick={close}>Cancel</button>
                <button type="submit" className="ipw-btn is-primary" disabled={busy}><Check size={14} aria-hidden="true" /> {busy ? 'Saving…' : form.mode === 'create' ? 'Create package' : 'Save'}</button>
              </div>
            </footer>
          </form>
        </ModalShell>
      ) : null}
    </div>
  );
}
