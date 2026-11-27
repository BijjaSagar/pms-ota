import { useEffect, useState } from 'react';
import { Ban, CalendarDays, Check, Clock3, Link2, MoreVertical, Pencil, Plus, Star, Trash2, X } from 'lucide-react';
import RulesModalShell from './RulesModalShell.jsx';

// Cancellation policies, saved on the server. A rule "H hours, P%" means:
// cancelling at least H hours before check-in refunds P%. Read from the most
// hours down; the 0-hour rule covers the time up to check-in.

const fmtDate = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const hoursText = (hours) => (hours === 0 ? 'Up to check-in' : hours % 24 === 0 ? `${hours / 24} day${hours === 24 ? '' : 's'} (${hours} h) or more before check-in` : `${hours} hours or more before check-in`);
const refundText = (percent) => (percent === 100 ? 'Full refund' : percent === 0 ? 'No refund' : `${percent}% refund`);
const sortRules = (rules) => [...rules].sort((a, b) => Number(b.hoursBeforeCheckIn) - Number(a.hoursBeforeCheckIn));
const int = (value) => (String(value).trim() === '' ? NaN : Number(value));
let key = 0;
const rowKey = () => { key += 1; return `row-${key}`; };

const emptyForm = () => ({
  policyId: null,
  name: '',
  active: true,
  rules: [
    { key: rowKey(), hoursBeforeCheckIn: '48', refundPercent: '100' },
    { key: rowKey(), hoursBeforeCheckIn: '0', refundPercent: '0' },
  ],
  blackouts: [],
  ratePlanIds: [],
});
const formOf = (policy) => ({
  policyId: policy.id,
  name: policy.name,
  active: policy.active,
  isDefault: policy.isDefault,
  rules: policy.rules.map((rule) => ({ key: rowKey(), hoursBeforeCheckIn: String(rule.hoursBeforeCheckIn), refundPercent: String(rule.refundPercent) })),
  blackouts: policy.blackouts.map((item) => ({ key: rowKey(), label: item.label ?? '', fromDate: item.fromDate, toDate: item.toDate, refundPercent: String(item.refundPercent) })),
  ratePlanIds: [...policy.ratePlanIds],
});

/** The server's rules, so mistakes show before saving. */
function checkForm(form, today) {
  const errors = {};
  const name = form.name.trim();
  if (name.length < 3 || name.length > 80) errors.name = 'Enter a name (3–80 characters).';
  const hours = new Map();
  form.rules.forEach((rule, index) => {
    const h = int(rule.hoursBeforeCheckIn);
    const p = int(rule.refundPercent);
    if (!Number.isInteger(h) || h < 0 || h > 8760) errors[`rules.${index}.hoursBeforeCheckIn`] = 'Hours: 0 to 8760.';
    else if (hours.has(h)) errors[`rules.${index}.hoursBeforeCheckIn`] = 'Another rule uses these hours.';
    else hours.set(h, index);
    if (!Number.isInteger(p) || p < 0 || p > 100) errors[`rules.${index}.refundPercent`] = 'Refund: 0 to 100%.';
  });
  if (!form.rules.length) errors.rules = 'Add at least one rule.';
  else if (!Object.keys(errors).some((field) => field.startsWith('rules.')) && !hours.has(0)) errors.rules = 'Add a rule for 0 hours: what guests get back when cancelling close to check-in.';
  if (!Object.keys(errors).some((field) => field.startsWith('rules'))) {
    const sorted = form.rules.map((rule, index) => ({ h: int(rule.hoursBeforeCheckIn), p: int(rule.refundPercent), index })).sort((a, b) => b.h - a.h);
    for (let i = 1; i < sorted.length; i += 1) {
      if (sorted[i].p > sorted[i - 1].p) errors[`rules.${sorted[i].index}.refundPercent`] = `Can not be more than the ${sorted[i - 1].p}% for cancelling earlier.`;
    }
  }
  const ranges = [];
  form.blackouts.forEach((item, index) => {
    const at = (field) => `blackouts.${index}.${field}`;
    if (!item.fromDate) errors[at('fromDate')] = 'Choose a start date.';
    if (!item.toDate) errors[at('toDate')] = 'Choose an end date.';
    else if (item.fromDate && item.toDate < item.fromDate) errors[at('toDate')] = 'Ends before it starts.';
    else if (item.toDate < today) errors[at('toDate')] = 'This range is in the past.';
    else if (item.fromDate) ranges.push({ index, from: item.fromDate, to: item.toDate });
    const p = int(item.refundPercent);
    if (!Number.isInteger(p) || p < 0 || p > 100) errors[at('refundPercent')] = 'Refund: 0 to 100%.';
    if ((item.label ?? '').length > 60) errors[at('label')] = 'Up to 60 characters.';
  });
  ranges.sort((a, b) => a.from.localeCompare(b.from)).forEach((range, i, all) => {
    if (i > 0 && range.from <= all[i - 1].to) errors[`blackouts.${range.index}.fromDate`] = 'Overlaps another range.';
  });
  return errors;
}

export default function RulesCancellationPoliciesTab({ data, busy, onRun }) {
  const [grace, setGrace] = useState(data.gracePeriod);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [menuId, setMenuId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => { setGrace(data.gracePeriod); }, [data.gracePeriod]);
  useEffect(() => {
    if (!menuId) return undefined;
    const close = (event) => { if (!event.target.closest?.('.rpw-policy-menu')) setMenuId(null); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuId]);

  const graceDirty = grace.enabled !== data.gracePeriod.enabled || grace.hours !== data.gracePeriod.hours || grace.minLeadDays !== data.gracePeriod.minLeadDays;
  const plans = data.ratePlans.filter((plan) => plan.kind !== 'DAY_USE');
  const policyName = (policyId) => data.policies.find((policy) => policy.id === policyId)?.name;
  const defaultPolicy = data.policies.find((policy) => policy.isDefault);
  const byRoom = plans.reduce((groups, plan) => ({ ...groups, [plan.roomName]: [...(groups[plan.roomName] ?? []), plan] }), {});

  const close = () => { setModal(null); setForm(null); setErrors({}); };
  const open = (policy) => { setForm(policy ? formOf(policy) : emptyForm()); setErrors({}); setModal({ type: 'policy' }); setMenuId(null); };
  const setRow = (list, rowKeyValue, patch) => setForm((current) => ({ ...current, [list]: current[list].map((row) => (row.key === rowKeyValue ? { ...row, ...patch } : row)) }));
  const clearError = (field) => setErrors((current) => { if (!current[field] && !current.rules) return current; const next = { ...current }; delete next[field]; delete next.rules; return next; });

  const save = async () => {
    const problems = checkForm(form, data.today);
    setErrors(problems);
    if (Object.keys(problems).length) return;
    const body = {
      name: form.name.trim(),
      active: form.active,
      rules: sortRules(form.rules).map((rule) => ({ hoursBeforeCheckIn: int(rule.hoursBeforeCheckIn), refundPercent: int(rule.refundPercent) })),
      blackouts: form.blackouts.map((item) => ({ ...(item.label.trim() && { label: item.label.trim() }), fromDate: item.fromDate, toDate: item.toDate, refundPercent: int(item.refundPercent) })),
      ratePlanIds: form.active ? form.ratePlanIds : [],
    };
    const result = await onRun(
      (api) => (form.policyId ? api.updateCancellationPolicy(form.policyId, body) : api.createCancellationPolicy(body)),
      form.policyId ? 'Policy saved.' : 'Policy created.',
    );
    if (result.ok) close();
    else if (result.fields) setErrors(result.fields);
  };

  return (
    <div className="rpw-tab-panel">
      <section className="rpw-card">
        <div className="rpw-card-head">
          <div>
            <h3>Grace Period for Non-Refundable Bookings</h3>
            <p>Guests can cancel a non-refundable booking for free within a short window after booking, when check-in is far enough away.</p>
          </div>
          <span className={`rpw-status ${data.gracePeriod.enabled ? 'is-on' : ''}`}>{data.gracePeriod.enabled ? 'On' : 'Off'}</span>
        </div>
        <div className="rpw-grace-grid">
          <label className="rpw-field">
            <span>Free cancellation window</span>
            <select value={grace.hours} disabled={!grace.enabled} onChange={(event) => setGrace({ ...grace, hours: Number(event.target.value) })}>
              {[...new Set([6, 12, 24, 48, 72, grace.hours])].sort((a, b) => a - b).map((hours) => <option key={hours} value={hours}>{hours} hours after booking</option>)}
            </select>
          </label>
          <label className="rpw-field">
            <span>Only if check-in is at least</span>
            <select value={grace.minLeadDays} disabled={!grace.enabled} onChange={(event) => setGrace({ ...grace, minLeadDays: Number(event.target.value) })}>
              {[...new Set([1, 3, 7, 14, 30, grace.minLeadDays])].sort((a, b) => a - b).map((days) => <option key={days} value={days}>{days} day{days === 1 ? '' : 's'} away</option>)}
            </select>
          </label>
          <div className="rpw-switch-row">
            <span><strong>Grace period</strong><small>Applies only to non-refundable bookings.</small></span>
            <button type="button" role="switch" aria-checked={grace.enabled} aria-label="Grace period" className={`rpw-switch ${grace.enabled ? 'is-on' : ''}`} onClick={() => setGrace({ ...grace, enabled: !grace.enabled })}><span /></button>
          </div>
        </div>
        {graceDirty ? (
          <div className="rpw-save-bar">
            <button type="button" className="rpw-btn" onClick={() => setGrace(data.gracePeriod)} disabled={busy}>Discard</button>
            <button type="button" className="rpw-btn is-primary" disabled={busy} onClick={() => onRun((api) => api.saveGracePeriod(grace), 'Grace period saved.')}><Check size={15} aria-hidden="true" />{busy ? 'Saving…' : 'Save grace period'}</button>
          </div>
        ) : null}
      </section>

      <section className="rpw-card">
        <div className="rpw-card-head">
          <div>
            <h3>Cancellation Policies</h3>
            <p>{data.policies.filter((policy) => policy.active).length} on, {data.policies.length} in all. Rate plans without their own policy use the default{defaultPolicy ? `: ${defaultPolicy.name}` : ''}.</p>
          </div>
          <button type="button" className="rpw-btn is-primary" onClick={() => open(null)} disabled={busy}><Plus size={15} aria-hidden="true" />Create New Policy</button>
        </div>

        {data.policies.length ? (
          <div className="rpw-policy-list">
            {[...data.policies].sort((a, b) => Number(b.isDefault) - Number(a.isDefault)).map((policy) => (
              <article className={`rpw-policy-card ${policy.active ? '' : 'is-inactive'}`} key={policy.id}>
                <div className="rpw-policy-top">
                  <div>
                    <h4>{policy.name}</h4>
                    <span className={`rpw-pill ${policy.active ? 'is-active' : ''}`}>{policy.active ? 'On' : 'Off'}</span>
                    {policy.isDefault ? <span className="rpw-pill is-default"><Star size={11} aria-hidden="true" />Default</span> : null}
                  </div>
                  <div className="rpw-policy-menu">
                    <button type="button" className="rpw-icon-btn" aria-haspopup="menu" aria-expanded={menuId === policy.id} onClick={() => setMenuId(menuId === policy.id ? null : policy.id)} aria-label={`Actions for ${policy.name}`}><MoreVertical size={17} aria-hidden="true" /></button>
                    {menuId === policy.id ? (
                      <div className="rpw-menu" role="menu">
                        <button type="button" role="menuitem" onClick={() => open(policy)}><Pencil size={14} aria-hidden="true" />Edit policy</button>
                        <button type="button" role="menuitem" onClick={() => { setModal({ type: 'plans', policyId: policy.id }); setMenuId(null); }}><Link2 size={14} aria-hidden="true" />View rate plans</button>
                        {!policy.isDefault && policy.active ? <button type="button" role="menuitem" onClick={() => { setMenuId(null); onRun((api) => api.setDefaultCancellationPolicy(policy.id), `${policy.name} is now the default.`); }}><Star size={14} aria-hidden="true" />Make default</button> : null}
                        {!policy.isDefault ? <button type="button" role="menuitem" onClick={() => { setMenuId(null); onRun((api) => api.setCancellationPolicyActive(policy.id, !policy.active), policy.active ? `${policy.name} switched off; its rate plans now use the default.` : `${policy.name} switched on.`); }}>{policy.active ? <Ban size={14} aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}{policy.active ? 'Switch off' : 'Switch on'}</button> : null}
                        {!policy.isDefault ? <button type="button" role="menuitem" className="is-danger" onClick={() => { setMenuId(null); setConfirmId(policy.id); }}><Trash2 size={14} aria-hidden="true" />Delete policy</button> : null}
                        {policy.isDefault ? <p className="rpw-menu-note">The default can not be switched off or deleted. Make another policy the default first.</p> : null}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rpw-condition-list">
                  {policy.rules.map((rule) => (
                    <div className="rpw-condition" key={rule.hoursBeforeCheckIn}>
                      <Clock3 size={14} aria-hidden="true" />
                      <span>{hoursText(rule.hoursBeforeCheckIn)}</span>
                      <strong className={rule.refundPercent === 0 ? 'is-none' : ''}>{refundText(rule.refundPercent)}</strong>
                    </div>
                  ))}
                </div>

                {confirmId === policy.id ? (
                  <div className="rpw-danger-box" role="alertdialog" aria-label={`Delete ${policy.name}`}>
                    <div>
                      <strong>Delete “{policy.name}”?</strong>
                      <p>{policy.ratePlanIds.length ? `Its ${policy.ratePlanIds.length} rate plan${policy.ratePlanIds.length === 1 ? '' : 's'} will use the default policy. ` : ''}This can not be undone.</p>
                    </div>
                    <div className="rpw-danger-actions">
                      <button type="button" className="rpw-btn" autoFocus onClick={() => setConfirmId(null)}>No, keep it</button>
                      <button type="button" className="rpw-btn is-solid-danger" disabled={busy} onClick={async () => { if ((await onRun((api) => api.deleteCancellationPolicy(policy.id), `${policy.name} deleted.`)).ok) setConfirmId(null); }}><Trash2 size={14} aria-hidden="true" />Yes, delete</button>
                    </div>
                  </div>
                ) : null}

                <div className="rpw-policy-foot">
                  <span><Link2 size={14} aria-hidden="true" />{policy.isDefault ? `${policy.ratePlanIds.length} mapped + every unmapped plan` : `${policy.ratePlanIds.length} rate plan${policy.ratePlanIds.length === 1 ? '' : 's'}`}</span>
                  <span><CalendarDays size={14} aria-hidden="true" />{policy.blackouts.length} blackout range{policy.blackouts.length === 1 ? '' : 's'}</span>
                  <button type="button" onClick={() => setModal({ type: 'plans', policyId: policy.id })}>View mapping</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rpw-empty"><Plus size={22} aria-hidden="true" /><strong>No cancellation policies yet.</strong><span>Create one to set refund windows.</span></div>
        )}
      </section>

      {modal?.type === 'policy' && form ? (
        <RulesModalShell
          title={form.policyId ? 'Edit cancellation policy' : 'Create cancellation policy'}
          subtitle="Refund rules, blackout dates and the rate plans that use it."
          wide
          onClose={busy ? () => {} : close}
          footer={<><button type="button" className="rpw-btn" onClick={close} disabled={busy}>Cancel</button><button type="button" className="rpw-btn is-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save policy'}</button></>}
        >
          {Object.keys(errors).length ? <div className="rpw-inline-error" role="alert">{errors.rules || 'Fix the highlighted fields.'}</div> : null}
          <div className="rpw-form-grid">
            <label className="rpw-field is-full">
              <span>Policy name</span>
              <input value={form.name} maxLength={80} aria-invalid={Boolean(errors.name)} onChange={(event) => { setForm({ ...form, name: event.target.value }); clearError('name'); }} placeholder="e.g. Free cancellation till 48 hours" />
              {errors.name ? <small className="rpw-field-error">{errors.name}</small> : null}
            </label>
            {!form.isDefault ? (
              <label className="rpw-field">
                <span>Status</span>
                <select value={form.active ? 'on' : 'off'} onChange={(event) => setForm({ ...form, active: event.target.value === 'on' })}><option value="on">On</option><option value="off">Off (its rate plans use the default)</option></select>
              </label>
            ) : null}
          </div>

          <div className="rpw-subsection">
            <div className="rpw-subsection-head">
              <h4>Refund rules</h4>
              <button type="button" className="rpw-btn is-small" disabled={form.rules.length >= 6} onClick={() => setForm({ ...form, rules: [...form.rules, { key: rowKey(), hoursBeforeCheckIn: '', refundPercent: '' }] })}><Plus size={13} aria-hidden="true" />Add rule</button>
            </div>
            <p className="rpw-muted">Cancelling at least this many hours before check-in refunds this much. Include a 0-hours rule for late cancellations.</p>
            <div className="rpw-rule-list">
              {form.rules.map((rule, index) => (
                <div className="rpw-rule-row is-compact" key={rule.key}>
                  <label>
                    <span>Hours before check-in</span>
                    <input type="number" min="0" max="8760" inputMode="numeric" value={rule.hoursBeforeCheckIn} aria-invalid={Boolean(errors[`rules.${index}.hoursBeforeCheckIn`])} onChange={(event) => { setRow('rules', rule.key, { hoursBeforeCheckIn: event.target.value }); clearError(`rules.${index}.hoursBeforeCheckIn`); }} />
                    {errors[`rules.${index}.hoursBeforeCheckIn`] ? <small className="rpw-field-error">{errors[`rules.${index}.hoursBeforeCheckIn`]}</small> : null}
                  </label>
                  <label>
                    <span>Refund %</span>
                    <input type="number" min="0" max="100" inputMode="numeric" value={rule.refundPercent} aria-invalid={Boolean(errors[`rules.${index}.refundPercent`])} onChange={(event) => { setRow('rules', rule.key, { refundPercent: event.target.value }); clearError(`rules.${index}.refundPercent`); }} />
                    {errors[`rules.${index}.refundPercent`] ? <small className="rpw-field-error">{errors[`rules.${index}.refundPercent`]}</small> : null}
                  </label>
                  <span className="rpw-rule-summary">{Number.isInteger(int(rule.hoursBeforeCheckIn)) && Number.isInteger(int(rule.refundPercent)) ? `${hoursText(int(rule.hoursBeforeCheckIn))}: ${refundText(int(rule.refundPercent))}` : ''}</span>
                  <button type="button" className="rpw-icon-btn is-danger" disabled={form.rules.length === 1} onClick={() => { setForm({ ...form, rules: form.rules.filter((row) => row.key !== rule.key) }); setErrors({}); }} aria-label="Remove rule"><X size={15} aria-hidden="true" /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="rpw-subsection">
            <div className="rpw-subsection-head">
              <h4>Rate plans</h4>
              <span>{form.active ? 'Tick the rate plans that use this policy.' : 'A switched-off policy has no rate plans.'}</span>
            </div>
            {plans.length ? (
              <div className="rpw-rate-grid">
                {Object.entries(byRoom).map(([roomName, roomPlans]) => (
                  <div className="rpw-rate-group" key={roomName}>
                    <strong>{roomName}</strong>
                    <div className="rpw-rate-options">
                      {roomPlans.map((plan) => {
                        const checked = form.ratePlanIds.includes(plan.id);
                        const elsewhere = !checked && plan.cancellationPolicyId && plan.cancellationPolicyId !== form.policyId ? policyName(plan.cancellationPolicyId) : '';
                        return (
                          <label className={checked ? 'is-checked' : ''} key={plan.id} title={elsewhere ? `Now uses ${elsewhere}` : undefined}>
                            <input type="checkbox" checked={checked} disabled={!form.active} onChange={() => setForm({ ...form, ratePlanIds: checked ? form.ratePlanIds.filter((planId) => planId !== plan.id) : [...form.ratePlanIds, plan.id] })} />
                            <span>{plan.name}{elsewhere ? <small> · moves from {elsewhere}</small> : null}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="rpw-muted">No rate plans yet. Add rooms and rate plans first.</p>}
          </div>

          <div className="rpw-subsection">
            <div className="rpw-subsection-head">
              <h4>Blackout dates</h4>
              <button type="button" className="rpw-btn is-small" disabled={form.blackouts.length >= 10} onClick={() => setForm({ ...form, blackouts: [...form.blackouts, { key: rowKey(), label: '', fromDate: '', toDate: '', refundPercent: '0' }] })}><Plus size={13} aria-hidden="true" />Add dates</button>
            </div>
            <p className="rpw-muted">For stays in these dates (festivals, peak season) a different refund applies. Up to 90 nights each, not overlapping.</p>
            <div className="rpw-blackout-list">
              {form.blackouts.map((item, index) => {
                const err = (field) => errors[`blackouts.${index}.${field}`];
                return (
                  <div className="rpw-blackout-row" key={item.key}>
                    <label><span>Name (optional)</span><input value={item.label} maxLength={60} onChange={(event) => setRow('blackouts', item.key, { label: event.target.value })} placeholder="e.g. Diwali" /></label>
                    <label><span>From</span><input type="date" min={data.today} value={item.fromDate} aria-invalid={Boolean(err('fromDate'))} onChange={(event) => { setRow('blackouts', item.key, { fromDate: event.target.value }); clearError(`blackouts.${index}.fromDate`); }} />{err('fromDate') ? <small className="rpw-field-error">{err('fromDate')}</small> : null}</label>
                    <label><span>To</span><input type="date" min={item.fromDate || data.today} value={item.toDate} aria-invalid={Boolean(err('toDate'))} onChange={(event) => { setRow('blackouts', item.key, { toDate: event.target.value }); clearError(`blackouts.${index}.toDate`); }} />{err('toDate') ? <small className="rpw-field-error">{err('toDate')}</small> : null}</label>
                    <label><span>Refund %</span><input type="number" min="0" max="100" value={item.refundPercent} aria-invalid={Boolean(err('refundPercent'))} onChange={(event) => setRow('blackouts', item.key, { refundPercent: event.target.value })} />{err('refundPercent') ? <small className="rpw-field-error">{err('refundPercent')}</small> : null}</label>
                    <button type="button" className="rpw-icon-btn is-danger" onClick={() => { setForm({ ...form, blackouts: form.blackouts.filter((row) => row.key !== item.key) }); setErrors({}); }} aria-label="Remove these dates"><X size={15} aria-hidden="true" /></button>
                  </div>
                );
              })}
            </div>
          </div>
        </RulesModalShell>
      ) : null}

      {modal?.type === 'plans' ? (() => {
        const policy = data.policies.find((item) => item.id === modal.policyId);
        const mapped = plans.filter((plan) => plan.cancellationPolicyId === modal.policyId);
        const fallback = policy?.isDefault ? plans.filter((plan) => !plan.cancellationPolicyId) : [];
        return (
          <RulesModalShell title="Rate plans using this policy" subtitle={policy?.name} wide onClose={close}>
            {[...mapped.map((plan) => [plan, 'Mapped']), ...fallback.map((plan) => [plan, 'Default'])].map(([plan, how]) => (
              <div className="rpw-mapping-row" key={plan.id}>
                <strong>{plan.roomName}</strong>
                <span>{plan.name}</span>
                <span className={`rpw-pill ${how === 'Mapped' ? 'is-active' : ''}`}>{how === 'Mapped' ? 'Mapped' : 'Uses default'}</span>
              </div>
            ))}
            {!mapped.length && !fallback.length ? <p className="rpw-muted">No rate plan uses this policy.</p> : null}
          </RulesModalShell>
        );
      })() : null}
    </div>
  );
}

export { fmtDate };
