import { useState } from 'react';
import {
  Ban,
  CalendarDays,
  Check,
  Clock3,
  Eye,
  Link2,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import RulesModalShell from './RulesModalShell.jsx';
import { makeRulesId } from '../../lib/data/rulesPolicies.js';

const newRefundRule = () => ({ id: makeRulesId('rule'), label: 'Before check-in', beforeHours: 24, refundPercent: 100, kind: 'free' });
const newBlackoutDate = () => ({ id: makeRulesId('blackout'), label: 'Peak period', from: '', to: '', condition: 'Non-refundable' });

const emptyPolicy = () => ({
  id: '',
  name: '',
  status: 'active',
  refundRules: [newRefundRule()],
  ratePlanIds: [],
  blackoutDates: [],
});

const clonePolicy = (policy) => ({
  ...emptyPolicy(),
  ...policy,
  refundRules: (policy?.refundRules ?? []).map((rule) => ({ ...rule })),
  ratePlanIds: [...(policy?.ratePlanIds ?? [])],
  blackoutDates: (policy?.blackoutDates ?? []).map((date) => ({ ...date })),
});

export default function RulesCancellationPoliciesTab({
  gracePeriod,
  policies,
  ratePlanOptions,
  onChangeGracePeriod,
  onSavePolicy,
  onDeletePolicy,
  onTogglePolicyStatus,
}) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [error, setError] = useState('');

  const closeModal = () => {
    setModal(null);
    setForm(null);
    setError('');
  };

  const openPolicyForm = (policy) => {
    setForm(clonePolicy(policy));
    setModal({ type: 'policy', policyId: policy?.id ?? null });
    setMenuId(null);
    setError('');
  };

  const savePolicy = () => {
    if (!form?.name?.trim()) {
      setError('Enter a policy name.');
      return;
    }
    if (!form.refundRules.length) {
      setError('Add at least one refund condition.');
      return;
    }
    if (form.refundRules.some((rule) => Number(rule.beforeHours) < 0 || Number(rule.refundPercent) < 0 || Number(rule.refundPercent) > 100)) {
      setError('Deadlines must be 0 or more and refund must be between 0 and 100%.');
      return;
    }
    onSavePolicy({
      ...form,
      id: form.id || makeRulesId('policy'),
      name: form.name.trim(),
      refundRules: form.refundRules.map((rule) => ({ ...rule, id: rule.id || makeRulesId('rule') })),
      blackoutDates: form.blackoutDates.filter((date) => date.from && date.to),
    });
    closeModal();
  };

  const updateRefundRule = (id, patch) => {
    setForm((current) => ({ ...current, refundRules: current.refundRules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)) }));
  };

  const groupedRatePlans = ratePlanOptions.reduce((groups, option) => {
    groups[option.roomName] = groups[option.roomName] ?? [];
    groups[option.roomName].push(option);
    return groups;
  }, {});

  return (
    <div className="rpw-tab-panel">
      <section className="rpw-card">
        <div className="rpw-card-head">
          <div>
            <h3>Grace Period for Non-Refundable Bookings</h3>
            <p>Guests can cancel within a short window for a full refund when check-in is far enough away.</p>
          </div>
          <span className={`rpw-status ${gracePeriod.enabled ? 'is-on' : ''}`}>{gracePeriod.enabled ? 'Enabled' : 'Disabled'}</span>
        </div>
        <div className="rpw-grace-grid">
          <label className="rpw-field">
            <span>Grace window</span>
            <select value={gracePeriod.hours} onChange={(event) => onChangeGracePeriod({ ...gracePeriod, hours: Number(event.target.value) })}>
              <option value={12}>12 hours</option>
              <option value={24}>24 hours</option>
              <option value={48}>48 hours</option>
            </select>
          </label>
          <label className="rpw-field">
            <span>Minimum lead time</span>
            <select value={gracePeriod.minCheckInDays} onChange={(event) => onChangeGracePeriod({ ...gracePeriod, minCheckInDays: Number(event.target.value) })}>
              <option value={3}>3 days before check-in</option>
              <option value={7}>7 days before check-in</option>
              <option value={14}>14 days before check-in</option>
            </select>
          </label>
          <label className="rpw-switch-row">
            <span>
              <strong>Enable grace period</strong>
              <small>Applies only to non-refundable bookings.</small>
            </span>
            <button type="button" role="switch" aria-checked={gracePeriod.enabled} aria-label="Enable grace period" className={`rpw-switch ${gracePeriod.enabled ? 'is-on' : ''}`} onClick={() => onChangeGracePeriod({ ...gracePeriod, enabled: !gracePeriod.enabled })}><span /></button>
          </label>
        </div>
      </section>

      <section className="rpw-card">
        <div className="rpw-card-head">
          <div>
            <h3>Cancellation Policies</h3>
            <p>{policies.length} active and configured policies for this property.</p>
          </div>
          <button type="button" className="rpw-btn is-primary" onClick={() => openPolicyForm(null)}><Plus size={15} aria-hidden="true" />Create New Policy</button>
        </div>

        {policies.length ? (
          <div className="rpw-policy-list">
            {policies.map((policy) => (
              <article className={`rpw-policy-card ${policy.status === 'inactive' ? 'is-inactive' : ''}`} key={policy.id}>
                <div className="rpw-policy-top">
                  <div>
                    <h4>{policy.name}</h4>
                    <span className={`rpw-pill ${policy.status === 'active' ? 'is-active' : ''}`}>{policy.status === 'active' ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className="rpw-policy-menu">
                    <button type="button" className="rpw-icon-btn" onClick={() => setMenuId(menuId === policy.id ? null : policy.id)} aria-label={`More actions for ${policy.name}`}><MoreVertical size={17} aria-hidden="true" /></button>
                    {menuId === policy.id ? (
                      <div className="rpw-menu" role="menu">
                        <button type="button" onClick={() => openPolicyForm(policy)} role="menuitem"><Pencil size={14} aria-hidden="true" />Edit policy</button>
                        <button type="button" onClick={() => { setModal({ type: 'ratePlans', policyId: policy.id }); setMenuId(null); }} role="menuitem"><Eye size={14} aria-hidden="true" />View rate plans</button>
                        <button type="button" onClick={() => { onTogglePolicyStatus(policy.id); setMenuId(null); }} role="menuitem">{policy.status === 'active' ? <Ban size={14} aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}{policy.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                        <button type="button" className="is-danger" onClick={() => { onDeletePolicy(policy.id); setMenuId(null); }} role="menuitem"><Trash2 size={14} aria-hidden="true" />Delete policy</button>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rpw-condition-list">
                  {policy.refundRules.map((rule) => (
                    <div className="rpw-condition" key={rule.id}>
                      <Clock3 size={14} aria-hidden="true" />
                      <span>{rule.label}</span>
                      <strong>{rule.refundPercent}% refund</strong>
                    </div>
                  ))}
                </div>

                <div className="rpw-timeline">
                  <div className="rpw-timeline-points"><span>Booking</span><span>Refund eligibility</span><span>Cancellation deadline</span><span>Check-in</span></div>
                  <div className="rpw-timeline-track">
                    <span className="is-refund" style={{ flex: Math.max(1, policy.refundRules[0]?.refundPercent ?? 0) }} />
                    <span className="is-deadline" style={{ flex: Math.max(1, 100 - (policy.refundRules[0]?.refundPercent ?? 0)) }} />
                  </div>
                </div>

                <div className="rpw-policy-foot">
                  <span><Link2 size={14} aria-hidden="true" />{policy.ratePlanIds.length} rate plans mapped</span>
                  <span><CalendarDays size={14} aria-hidden="true" />{policy.blackoutDates.length} blackout ranges</span>
                  <button type="button" onClick={() => setModal({ type: 'ratePlans', policyId: policy.id })}>View mapping</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rpw-empty"><Plus size={22} aria-hidden="true" /><strong>No cancellation policies yet.</strong><span>Create your first policy to define refund windows.</span></div>
        )}
      </section>

      {modal?.type === 'policy' && form ? (
        <RulesModalShell
          title={modal.policyId ? 'Edit cancellation policy' : 'Create cancellation policy'}
          subtitle="Add refund conditions, rate plans and blackout dates."
          wide
          onClose={closeModal}
          footer={<><button type="button" className="rpw-btn" onClick={closeModal}>Cancel</button><button type="button" className="rpw-btn is-primary" onClick={savePolicy}>Save policy</button></>}
        >
          {error ? <div className="rpw-inline-error" role="alert">{error}</div> : null}
          <div className="rpw-form-grid">
            <label className="rpw-field is-full"><span>Policy name</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Free Cancellation up to 48 Hours" /></label>
            <label className="rpw-field"><span>Status</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
          </div>

          <div className="rpw-subsection">
            <div className="rpw-subsection-head"><h4>Refund conditions</h4><button type="button" className="rpw-btn is-small" onClick={() => setForm({ ...form, refundRules: [...form.refundRules, newRefundRule()] })}><Plus size={13} aria-hidden="true" />Add condition</button></div>
            <div className="rpw-rule-list">
              {form.refundRules.map((rule) => (
                <div className="rpw-rule-row" key={rule.id}>
                  <input aria-label="Condition label" value={rule.label} onChange={(event) => updateRefundRule(rule.id, { label: event.target.value })} />
                  <label><span>Hours before check-in</span><input type="number" min="0" value={rule.beforeHours} onChange={(event) => updateRefundRule(rule.id, { beforeHours: event.target.value })} /></label>
                  <label><span>Refund %</span><input type="number" min="0" max="100" value={rule.refundPercent} onChange={(event) => updateRefundRule(rule.id, { refundPercent: event.target.value })} /></label>
                  <select aria-label="Condition type" value={rule.kind} onChange={(event) => updateRefundRule(rule.id, { kind: event.target.value })}><option value="free">Free cancellation</option><option value="partial">Partial refund</option><option value="non-refundable">Non-refundable</option></select>
                  <button type="button" className="rpw-icon-btn is-danger" onClick={() => setForm({ ...form, refundRules: form.refundRules.filter((entry) => entry.id !== rule.id) })} aria-label="Remove condition"><X size={15} aria-hidden="true" /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="rpw-subsection">
            <div className="rpw-subsection-head"><h4>Rate plan mapping</h4><span>Group rates and hourly stays are excluded.</span></div>
            <div className="rpw-rate-grid">
              {Object.entries(groupedRatePlans).map(([roomName, options]) => (
                <div className="rpw-rate-group" key={roomName}>
                  <strong>{roomName}</strong>
                  <div className="rpw-rate-options">
                    {options.map((option) => {
                      const checked = form.ratePlanIds.includes(option.id);
                      return (
                        <label className={checked ? 'is-checked' : ''} key={option.id}>
                          <input type="checkbox" checked={checked} onChange={() => setForm({ ...form, ratePlanIds: checked ? form.ratePlanIds.filter((id) => id !== option.id) : [...form.ratePlanIds, option.id] })} />
                          <span>{option.planName}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rpw-subsection">
            <div className="rpw-subsection-head"><h4>Blackout dates</h4><button type="button" className="rpw-btn is-small" onClick={() => setForm({ ...form, blackoutDates: [...form.blackoutDates, newBlackoutDate()] })}><Plus size={13} aria-hidden="true" />Add dates</button></div>
            <div className="rpw-blackout-list">
              {form.blackoutDates.map((date) => (
                <div className="rpw-blackout-row" key={date.id}>
                  <input aria-label="Blackout label" value={date.label} onChange={(event) => setForm({ ...form, blackoutDates: form.blackoutDates.map((entry) => (entry.id === date.id ? { ...entry, label: event.target.value } : entry)) })} placeholder="Holiday or festival" />
                  <input type="date" aria-label="Start date" value={date.from} onChange={(event) => setForm({ ...form, blackoutDates: form.blackoutDates.map((entry) => (entry.id === date.id ? { ...entry, from: event.target.value } : entry)) })} />
                  <input type="date" aria-label="End date" value={date.to} onChange={(event) => setForm({ ...form, blackoutDates: form.blackoutDates.map((entry) => (entry.id === date.id ? { ...entry, to: event.target.value } : entry)) })} />
                  <select aria-label="Special condition" value={date.condition} onChange={(event) => setForm({ ...form, blackoutDates: form.blackoutDates.map((entry) => (entry.id === date.id ? { ...entry, condition: event.target.value } : entry)) })}><option>Non-refundable</option><option>50% refund</option><option>Free cancellation</option></select>
                  <button type="button" className="rpw-icon-btn is-danger" onClick={() => setForm({ ...form, blackoutDates: form.blackoutDates.filter((entry) => entry.id !== date.id) })} aria-label="Remove blackout range"><X size={15} aria-hidden="true" /></button>
                </div>
              ))}
            </div>
          </div>
        </RulesModalShell>
      ) : null}

      {modal?.type === 'ratePlans' ? (
        <RulesModalShell title="Linked rate plans" subtitle="Room and rate plans using this cancellation policy." wide onClose={closeModal}>
          <div className="rpw-mapping-list">
            {ratePlanOptions.filter((option) => policies.find((policy) => policy.id === modal.policyId)?.ratePlanIds.includes(option.id)).map((option) => (
              <div className="rpw-mapping-row" key={option.id}>
                <strong>{option.roomName}</strong>
                <span>{option.planName}</span>
                <span className="rpw-pill is-active">Assigned</span>
              </div>
            ))}
          </div>
        </RulesModalShell>
      ) : null}
    </div>
  );
}
