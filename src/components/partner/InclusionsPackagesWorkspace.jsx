import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  Gift,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import {
  createInitialInclusionsState,
  INCLUSION_CATEGORY_OPTIONS,
  makeInclusionId,
} from '../../lib/data/inclusionsPackages.js';

const storageKey = (propertyId) => `triponx.partner.inclusionsPackages.${propertyId}.v2`;

function readState(propertyId) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey(propertyId)));
    if (saved && Array.isArray(saved.rooms) && Array.isArray(saved.mealPlans) && Array.isArray(saved.inclusions) && saved.assignments) return saved;
  } catch {
    return createInitialInclusionsState();
  }
  return createInitialInclusionsState();
}

function findAssignment(assignments, inclusionId) {
  for (const [roomId, plans] of Object.entries(assignments ?? {})) {
    for (const [planId, ids] of Object.entries(plans ?? {})) {
      if (ids.includes(inclusionId)) return { roomId, planId };
    }
  }
  return null;
}

function removeFromAssignments(assignments, inclusionId) {
  const next = {};
  Object.entries(assignments ?? {}).forEach(([roomId, plans]) => {
    next[roomId] = {};
    Object.entries(plans ?? {}).forEach(([planId, ids]) => {
      next[roomId][planId] = ids.filter((id) => id !== inclusionId);
    });
  });
  return next;
}

function addToAssignment(assignments, roomId, planId, inclusionId) {
  if (!roomId || !planId) return assignments;
  const roomPlans = { ...(assignments[roomId] ?? {}) };
  const ids = roomPlans[planId] ?? [];
  if (!ids.includes(inclusionId)) roomPlans[planId] = [...ids, inclusionId];
  else roomPlans[planId] = ids;
  return { ...assignments, [roomId]: roomPlans };
}

function plansForRoom(state, room) {
  return (room?.mealPlanIds ?? [])
    .map((planId) => state.mealPlans.find((plan) => plan.id === planId))
    .filter(Boolean);
}

function ModalShell({ title, subtitle, children, onClose, wide }) {
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

function Field({ label, children, full }) {
  return (
    <label className={`ipw-field ${full ? 'is-full' : ''}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function InclusionsPackagesWorkspace({ property }) {
  const propertyId = property?.id;
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'expired' ? 'expired' : 'active';
  const [state, setState] = useState(() => readState(propertyId));
  const [selectedRoomId, setSelectedRoomId] = useState(() => state.rooms[0]?.id ?? '');
  const [openPlanIds, setOpenPlanIds] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(null);
  const [notice, setNotice] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const next = readState(propertyId);
    setState(next);
    setSelectedRoomId(next.rooms[0]?.id ?? '');
    setOpenPlanIds([]);
    setModal(null);
    setForm(null);
    setNotice(null);
  }, [propertyId]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const close = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const activeCount = useMemo(() => state.inclusions.filter((item) => item.status === 'active').length, [state.inclusions]);
  const expiredCount = state.inclusions.length - activeCount;
  const visibleInclusions = useMemo(
    () => state.inclusions.filter((item) => (tab === 'active' ? item.status === 'active' : item.status !== 'active')),
    [state.inclusions, tab],
  );
  const inclusionById = useMemo(
    () => Object.fromEntries(state.inclusions.map((item) => [item.id, item])),
    [state.inclusions],
  );

  const updateState = (updater) => {
    setState((current) => {
      const next = updater(current);
      try {
        sessionStorage.setItem(storageKey(propertyId), JSON.stringify(next));
      } catch {
        return next;
      }
      return next;
    });
  };

  const changeTab = (nextTab) => {
    const params = new URLSearchParams(searchParams);
    if (nextTab === 'active') params.delete('tab');
    else params.set('tab', nextTab);
    setSearchParams(params, { replace: true });
    setNotice(null);
  };

  const selectRoom = (roomId) => {
    setSelectedRoomId(roomId);
    setOpenPlanIds([]);
  };

  const togglePlan = (planId) => {
    setOpenPlanIds((current) => (
      current.includes(planId) ? current.filter((id) => id !== planId) : [...current, planId]
    ));
  };

  const openPackageModal = (mode, sourcePlanId, roomId) => {
    const sourcePlan = state.mealPlans.find((plan) => plan.id === sourcePlanId);
    const planRoomId = roomId ?? selectedRoomId;
    const planId = mode === 'edit' ? sourcePlanId : makeInclusionId('plan');
    setForm({
      id: planId,
      name: sourcePlan?.label ?? '',
      shortLabel: sourcePlan?.shortLabel ?? '',
      roomId: planRoomId,
      inclusionIds: [...(state.assignments[planRoomId]?.[sourcePlanId] ?? [])],
    });
    setModal({ kind: 'package', mode, planId });
    setMenuOpen(false);
  };

  const openInclusionModal = (mode, inclusionId, assignment) => {
    const inclusion = state.inclusions.find((item) => item.id === inclusionId);
    const assigned = assignment ?? findAssignment(state.assignments, inclusionId);
    const formRoomId = assigned?.roomId ?? selectedRoomId;
    const formRoom = state.rooms.find((room) => room.id === formRoomId);
    setForm({
      id: mode === 'edit' ? inclusionId : makeInclusionId('inclusion'),
      name: inclusion?.name ?? '',
      category: inclusion?.category ?? INCLUSION_CATEGORY_OPTIONS[0],
      sourcePackage: inclusion?.sourcePackage ?? '',
      detail: inclusion?.detail ?? '',
      status: inclusion?.status ?? 'active',
      validUntil: inclusion?.validUntil ?? '',
      roomId: formRoomId,
      mealPlanId: assigned?.planId ?? plansForRoom(state, formRoom)[0]?.id ?? '',
    });
    setModal({ kind: 'inclusion', mode, inclusionId });
  };

  const savePackage = (event) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setNotice({ kind: 'error', text: 'Enter a package name before saving.' });
      return;
    }
    const planId = form.id;
    const shortLabel = form.shortLabel.trim() || name.slice(0, 12);
    updateState((current) => {
      const exists = current.mealPlans.some((plan) => plan.id === planId);
      const mealPlans = exists
        ? current.mealPlans.map((plan) => (plan.id === planId ? { ...plan, label: name, shortLabel } : plan))
        : [...current.mealPlans, { id: planId, label: name, shortLabel }];
      const roomPlans = { ...(current.assignments[form.roomId] ?? {}), [planId]: [...form.inclusionIds] };
      const rooms = current.rooms.map((room) => {
        if (room.id !== form.roomId || (room.mealPlanIds ?? []).includes(planId)) return room;
        return { ...room, mealPlanIds: [...(room.mealPlanIds ?? []), planId] };
      });
      return { ...current, rooms, mealPlans, assignments: { ...current.assignments, [form.roomId]: roomPlans } };
    });
    setModal(null);
    setForm(null);
    setNotice({ kind: 'success', text: modal.mode === 'edit' ? 'Package updated for this session.' : 'Package created for this session.' });
  };

  const deletePackage = (planId) => {
    if (!window.confirm('Delete this package and its assignments?')) return;
    updateState((current) => {
      const assignments = {};
      Object.entries(current.assignments).forEach(([roomId, plans]) => {
        assignments[roomId] = Object.fromEntries(Object.entries(plans).filter(([planKey]) => planKey !== planId));
      });
      return {
        ...current,
        rooms: current.rooms.map((room) => ({
          ...room,
          mealPlanIds: (room.mealPlanIds ?? []).filter((planKey) => planKey !== planId),
        })),
        mealPlans: current.mealPlans.filter((plan) => plan.id !== planId),
        assignments,
      };
    });
    setModal(null);
    setForm(null);
    setNotice({ kind: 'success', text: 'Package deleted for this session.' });
  };

  const saveInclusion = (event) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setNotice({ kind: 'error', text: 'Enter an inclusion name before saving.' });
      return;
    }
    const inclusionId = form.id;
    const record = {
      id: inclusionId,
      name,
      category: form.category,
      sourcePackage: form.sourcePackage.trim(),
      detail: form.detail.trim(),
      status: form.status,
      validUntil: form.status === 'active' ? '' : form.validUntil || new Date().toISOString().slice(0, 10),
    };
    updateState((current) => {
      const exists = current.inclusions.some((item) => item.id === inclusionId);
      const inclusions = exists
        ? current.inclusions.map((item) => (item.id === inclusionId ? { ...item, ...record } : item))
        : [...current.inclusions, record];
      let assignments = removeFromAssignments(current.assignments, inclusionId);
      if (form.status === 'active') assignments = addToAssignment(assignments, form.roomId, form.mealPlanId, inclusionId);
      return { ...current, inclusions, assignments };
    });
    setModal(null);
    setForm(null);
    setNotice({ kind: 'success', text: modal.mode === 'edit' ? 'Inclusion updated for this session.' : 'Inclusion offered for this session.' });
  };

  const deleteInclusion = (inclusionId) => {
    if (!window.confirm('Delete this inclusion everywhere?')) return;
    updateState((current) => ({
      ...current,
      inclusions: current.inclusions.filter((item) => item.id !== inclusionId),
      assignments: removeFromAssignments(current.assignments, inclusionId),
    }));
    setModal(null);
    setForm(null);
    setNotice({ kind: 'success', text: 'Inclusion deleted for this session.' });
  };

  const toggleInclusionStatus = (inclusionId) => {
    const inclusion = state.inclusions.find((item) => item.id === inclusionId);
    if (!inclusion) return;
    const activating = inclusion.status !== 'active';
    updateState((current) => {
      const previousAssignment = activating ? inclusion.previousAssignment ?? null : findAssignment(current.assignments, inclusionId);
      let assignments = current.assignments;
      if (activating && previousAssignment) {
        assignments = addToAssignment(assignments, previousAssignment.roomId, previousAssignment.planId, inclusionId);
      } else if (!activating) {
        assignments = removeFromAssignments(assignments, inclusionId);
      }
      return {
        ...current,
        assignments,
        inclusions: current.inclusions.map((item) => (
          item.id === inclusionId ? { ...item, status: activating ? 'active' : 'deactivated', previousAssignment } : item
        )),
      };
    });
    setNotice({ kind: 'success', text: activating ? 'Inclusion restored to active inclusions.' : 'Inclusion moved to Expired / Deactivated.' });
  };

  const setFormValue = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const togglePackageInclusion = (inclusionId) => {
    setForm((current) => ({
      ...current,
      inclusionIds: current.inclusionIds.includes(inclusionId)
        ? current.inclusionIds.filter((id) => id !== inclusionId)
        : [...current.inclusionIds, inclusionId],
    }));
  };

  const activeInclusions = state.inclusions.filter((item) => item.status === 'active');
  const selectedRoom = state.rooms.find((room) => room.id === selectedRoomId);
  const selectedRoomPlans = selectedRoom ? plansForRoom(state, selectedRoom) : [];

  return (
    <div className="ipw-root">
      <header className="ipw-header">
        <div className="ipw-heading">
          <span className="ipw-heading-icon"><Gift size={20} aria-hidden="true" /></span>
          <div>
            <h2>Inclusions and Packages</h2>
            <p>Create, assign, and organize complimentary services and stay packages by room and meal plan.</p>
          </div>
        </div>
        <div className="ipw-actions">
          <div className="ipw-create-wrap" ref={menuRef}>
            <button type="button" className="ipw-btn is-primary" onClick={() => setMenuOpen((open) => !open)}>
              <Plus size={15} aria-hidden="true" /> Create A Package <ChevronDown size={14} aria-hidden="true" />
            </button>
            {menuOpen ? (
              <div className="ipw-menu" role="menu">
                <button type="button" role="menuitem" onClick={() => openPackageModal('create')}><Package size={14} aria-hidden="true" /> Blank package</button>
                <button type="button" role="menuitem" onClick={() => openPackageModal('duplicate', 'cp2-super-package')}><Gift size={14} aria-hidden="true" /> Duplicate CP2 – Super Package</button>
              </div>
            ) : null}
          </div>
          <button type="button" className="ipw-btn" onClick={() => openInclusionModal('create')}>
            <Plus size={15} aria-hidden="true" /> Offer an Inclusion
          </button>
        </div>
      </header>

      {notice ? <div className={`ipw-notice ${notice.kind}`} role="status">{notice.text}</div> : null}

      <nav className="ipw-tabs" aria-label="Inclusion status">
        <button type="button" className={tab === 'active' ? 'is-on' : ''} onClick={() => changeTab('active')}>All Customer Inclusions ({activeCount})</button>
        <button type="button" className={tab === 'expired' ? 'is-on' : ''} onClick={() => changeTab('expired')}>Expired / Deactivated ({expiredCount})</button>
      </nav>

      {tab === 'active' ? (
        <div className="ipw-main">
          <aside className="ipw-room-rail" aria-label="Room categories">
            <div className="ipw-rail-head">
              <h3>Room categories</h3>
              <span>{state.rooms.length}</span>
            </div>
            {state.rooms.map((room) => {
              const selected = selectedRoomId === room.id;
              return (
                <div className={`ipw-room-item ${selected ? 'is-selected' : ''}`} key={room.id}>
                  <button type="button" onClick={() => selectRoom(room.id)} aria-pressed={selected}>
                    <span className="ipw-room-icon"><Package size={15} aria-hidden="true" /></span>
                    <span className="ipw-room-copy">
                      <strong>{room.label}</strong>
                      <small>{plansForRoom(state, room).reduce((sum, plan) => sum + (state.assignments[room.id]?.[plan.id]?.length ?? 0), 0)} active inclusions</small>
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
                    <h3>{selectedRoom.label}</h3>
                    <p>Choose a meal plan to view its inclusions.</p>
                  </div>
                </header>
                <div className="ipw-plan-grid">
                  {selectedRoomPlans.length ? selectedRoomPlans.map((plan) => {
                    const ids = state.assignments[selectedRoom.id]?.[plan.id] ?? [];
                    const open = openPlanIds.includes(plan.id);
                    return (
                      <article className={`ipw-plan-card ${open ? 'is-open' : ''}`} key={plan.id}>
                        <header className="ipw-plan-head">
                          <button type="button" className="ipw-plan-toggle" onClick={() => togglePlan(plan.id)} aria-expanded={open}>
                            <span className="ipw-plan-code">{plan.shortLabel}</span>
                            <span className="ipw-plan-copy">
                              <strong>{plan.label}</strong>
                              <small>{ids.length} inclusion{ids.length === 1 ? '' : 's'} assigned</small>
                            </span>
                            <span className="ipw-plan-toggle-action">{open ? 'Hide' : 'Open'}</span>
                            <ChevronDown size={16} className={`ipw-plan-chevron ${open ? 'is-open' : ''}`} aria-hidden="true" />
                          </button>
                          <button type="button" className="ipw-link" onClick={() => openPackageModal('edit', plan.id, selectedRoom.id)}><Pencil size={13} aria-hidden="true" /> Edit package</button>
                        </header>
                        {open ? (
                          <>
                            <div className="ipw-inclusion-list">
                              {ids.map((inclusionId) => {
                                const inclusion = inclusionById[inclusionId];
                                if (!inclusion) return null;
                                return (
                                  <div className="ipw-inclusion-card" key={inclusionId}>
                                    <span className="ipw-inclusion-copy">
                                      <strong>{inclusion.name}</strong>
                                      {inclusion.sourcePackage ? <small>{inclusion.sourcePackage}</small> : null}
                                    </span>
                                    <span className="ipw-inclusion-actions">
                                      <button type="button" onClick={() => setModal({ kind: 'view', inclusionId })} aria-label={`View ${inclusion.name}`}><Eye size={13} aria-hidden="true" /></button>
                                    </span>
                                  </div>
                                );
                              })}
                              {!ids.length ? <p className="ipw-empty-list">No inclusions assigned to this meal plan.</p> : null}
                            </div>
                            <button type="button" className="ipw-add-inline" onClick={() => openInclusionModal('create', null, { roomId: selectedRoom.id, planId: plan.id })}>
                              <Plus size={14} aria-hidden="true" /> Offer an Inclusion
                            </button>
                          </>
                        ) : null}
                      </article>
                    );
                  }) : (
                    <div className="ipw-empty-panel"><Gift size={24} aria-hidden="true" /><h3>No meal plans configured</h3><p>This room is not set up for meal plans yet.</p></div>
                  )}
                </div>
              </section>
            ) : (
              <div className="ipw-empty-panel"><Gift size={24} aria-hidden="true" /><h3>No room selected</h3><p>Choose a room category from the left to view its meal plans.</p></div>
            )}
          </div>
        </div>
      ) : (
        <div className="ipw-expired-grid">
          {visibleInclusions.map((inclusion) => {
            const assignment = findAssignment(state.assignments, inclusion.id) ?? inclusion.previousAssignment;
            return (
              <article className="ipw-expired-card" key={inclusion.id}>
                <div className="ipw-expired-head">
                  <span className={`ipw-status ${inclusion.status}`}>{inclusion.status}</span>
                  {inclusion.validUntil ? <small>Valid until {inclusion.validUntil}</small> : null}
                </div>
                <h4>{inclusion.name}</h4>
                {inclusion.sourcePackage ? <p className="ipw-source">{inclusion.sourcePackage}</p> : null}
                <p>{inclusion.detail || 'No additional details added.'}</p>
                {assignment ? <p className="ipw-last-assignment">Last assigned to {state.rooms.find((room) => room.id === assignment.roomId)?.label ?? 'a room'} · {state.mealPlans.find((plan) => plan.id === assignment.planId)?.label ?? 'a package'}</p> : null}
                <div className="ipw-card-actions">
                  <button type="button" onClick={() => setModal({ kind: 'view', inclusionId: inclusion.id })}><Eye size={13} aria-hidden="true" /> View</button>
                  <button type="button" onClick={() => openInclusionModal('edit', inclusion.id)}><Pencil size={13} aria-hidden="true" /> Edit</button>
                  <button type="button" onClick={() => toggleInclusionStatus(inclusion.id)}><RotateCcw size={13} aria-hidden="true" /> Restore</button>
                </div>
              </article>
            );
          })}
          {!visibleInclusions.length ? <div className="ipw-empty-panel"><Gift size={24} aria-hidden="true" /><h3>Nothing here</h3><p>No inclusions match this status.</p></div> : null}
        </div>
      )}

      {modal?.kind === 'view' ? (
        <ModalShell title="Inclusion details" subtitle="Read-only summary" onClose={() => setModal(null)}>
          {(() => {
            const inclusion = inclusionById[modal.inclusionId];
            if (!inclusion) return <p>Inclusion not found.</p>;
            const assignment = findAssignment(state.assignments, inclusion.id) ?? inclusion.previousAssignment;
            return (
              <dl className="ipw-detail-grid">
                <div><dt>Name</dt><dd>{inclusion.name}</dd></div>
                <div><dt>Category</dt><dd>{inclusion.category}</dd></div>
                <div><dt>Status</dt><dd>{inclusion.status}</dd></div>
                <div><dt>Source package</dt><dd>{inclusion.sourcePackage || '—'}</dd></div>
                <div><dt>Room category</dt><dd>{assignment ? state.rooms.find((room) => room.id === assignment.roomId)?.label ?? '—' : '—'}</dd></div>
                <div><dt>Meal plan</dt><dd>{assignment ? state.mealPlans.find((plan) => plan.id === assignment.planId)?.label ?? '—' : '—'}</dd></div>
                <div className="is-full"><dt>Details</dt><dd>{inclusion.detail || '—'}</dd></div>
              </dl>
            );
          })()}
        </ModalShell>
      ) : null}

      {modal?.kind === 'package' && form ? (
        <ModalShell title={modal.mode === 'edit' ? 'Edit package' : 'Create a package'} subtitle="Changes are saved for this session only." onClose={() => setModal(null)} wide>
          <form className="ipw-form" onSubmit={savePackage}>
            <div className="ipw-form-grid">
              <Field label="Package name" full><input value={form.name} onChange={(event) => setFormValue('name', event.target.value)} placeholder="e.g. CP2 – Super Package" /></Field>
              <Field label="Short label"><input value={form.shortLabel} onChange={(event) => setFormValue('shortLabel', event.target.value)} placeholder="CP2" /></Field>
              <Field label="Room category">
                <select value={form.roomId} onChange={(event) => setFormValue('roomId', event.target.value)}>
                  {state.rooms.map((room) => <option key={room.id} value={room.id}>{room.label}</option>)}
                </select>
              </Field>
            </div>
            <div className="ipw-check-section">
              <h4>Assign inclusions</h4>
              <div className="ipw-check-grid">
                {activeInclusions.map((inclusion) => (
                  <label key={inclusion.id} className={form.inclusionIds.includes(inclusion.id) ? 'is-checked' : ''}>
                    <input type="checkbox" checked={form.inclusionIds.includes(inclusion.id)} onChange={() => togglePackageInclusion(inclusion.id)} />
                    <span>{inclusion.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <footer className="ipw-modal-foot">
              {modal.mode === 'edit' ? <button type="button" className="ipw-btn is-danger" onClick={() => deletePackage(form.id)}><Trash2 size={14} aria-hidden="true" /> Delete package</button> : <span />}
              <div className="ipw-modal-foot-actions">
                <button type="button" className="ipw-btn" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="ipw-btn is-primary"><Check size={14} aria-hidden="true" /> Save package</button>
              </div>
            </footer>
          </form>
        </ModalShell>
      ) : null}

      {modal?.kind === 'inclusion' && form ? (
        <ModalShell title={modal.mode === 'edit' ? 'Edit inclusion' : 'Offer an inclusion'} subtitle="Add a guest benefit and assign it to a room and meal plan." onClose={() => setModal(null)} wide>
          <form className="ipw-form" onSubmit={saveInclusion}>
            <div className="ipw-form-grid">
              <Field label="Inclusion name" full><input value={form.name} onChange={(event) => setFormValue('name', event.target.value)} placeholder="e.g. Airport Transfer" /></Field>
              <Field label="Category">
                <select value={form.category} onChange={(event) => setFormValue('category', event.target.value)}>
                  {INCLUSION_CATEGORY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </Field>
              <Field label="Source package"><input value={form.sourcePackage} onChange={(event) => setFormValue('sourcePackage', event.target.value)} placeholder="Optional package name" /></Field>
              <Field label="Status">
                <select value={form.status} onChange={(event) => setFormValue('status', event.target.value)}>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="deactivated">Deactivated</option>
                </select>
              </Field>
              <Field label={form.status === 'active' ? 'Valid until (optional)' : 'Valid until'}>
                <input type="date" value={form.validUntil} onChange={(event) => setFormValue('validUntil', event.target.value)} />
              </Field>
              <Field label="Room category">
                <select value={form.roomId} onChange={(event) => setFormValue('roomId', event.target.value)}>
                  {state.rooms.map((room) => <option key={room.id} value={room.id}>{room.label}</option>)}
                </select>
              </Field>
              <Field label="Meal plan">
                <select value={form.mealPlanId} onChange={(event) => setFormValue('mealPlanId', event.target.value)}>
                  {plansForRoom(state, state.rooms.find((room) => room.id === form.roomId)).map((plan) => <option key={plan.id} value={plan.id}>{plan.label}</option>)}
                </select>
              </Field>
              <Field label="Details" full><textarea value={form.detail} onChange={(event) => setFormValue('detail', event.target.value)} placeholder="Describe the guest benefit." /></Field>
            </div>
            <footer className="ipw-modal-foot">
              {modal.mode === 'edit' ? <button type="button" className="ipw-btn is-danger" onClick={() => deleteInclusion(form.id)}><Trash2 size={14} aria-hidden="true" /> Delete inclusion</button> : <span />}
              <div className="ipw-modal-foot-actions">
                <button type="button" className="ipw-btn" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="ipw-btn is-primary"><Check size={14} aria-hidden="true" /> Save inclusion</button>
              </div>
            </footer>
          </form>
        </ModalShell>
      ) : null}
    </div>
  );
}
