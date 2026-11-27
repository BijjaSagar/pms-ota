import { useEffect, useMemo, useState } from 'react';
import {
  Baby,
  Ban,
  BellRing,
  CheckCircle2,
  ClipboardList,
  ShieldCheck,
  UserRoundPen,
} from 'lucide-react';
import { loadMasters, policiesFromApi, savePolicies } from '../../lib/api/properties.js';
import {
  CANCELLATION_OPTIONS,
  EXTRA_BED_TYPE_OPTIONS,
  IDENTITY_PROOF_OPTIONS,
  POLICY_YES_NO_FIELDS,
} from '../../lib/data/partner.js';
import {
  CANCELLATION_POLICY_FALLBACK,
  CHANNEL_PREVIEW,
  EXTRA_BED_TYPE_FALLBACK,
  FAQ_CONTENT,
  IDENTITY_PROOF_FALLBACK,
  RULES_TABS,
  buildRatePlanOptions,
  createInitialRulesPoliciesState,
  normalizeRulesPoliciesState,
  optionList,
} from '../../lib/data/rulesPolicies.js';
import RulesCancellationPoliciesTab from './RulesCancellationPoliciesTab.jsx';
import RulesPropertyRulesTab from './RulesPropertyRulesTab.jsx';
import RulesNoticesTab from './RulesNoticesTab.jsx';
import RulesChildAgeTab from './RulesChildAgeTab.jsx';
import RulesPostBookingTab from './RulesPostBookingTab.jsx';
import RulesFaqPanel from './RulesFaqPanel.jsx';
import '../../styles/partner-rules-policies.css';

const STORAGE_KEY = 'triponx.partner.rulesPolicies';

const TAB_ICONS = {
  cancellation: Ban,
  'property-rules': ClipboardList,
  notices: BellRing,
  'child-age': Baby,
  'post-booking': UserRoundPen,
};

const loadStoredState = (id) => {
  try {
    const stored = window.sessionStorage.getItem(`${STORAGE_KEY}.${id}.v1`);
    return stored ? normalizeRulesPoliciesState(JSON.parse(stored)) : createInitialRulesPoliciesState();
  } catch {
    return createInitialRulesPoliciesState();
  }
};

const persistState = (id, state) => {
  try {
    window.sessionStorage.setItem(`${STORAGE_KEY}.${id}.v1`, JSON.stringify(state));
  } catch {
    return;
  }
};

const validateRuleForm = (form) => {
  const errors = {};
  POLICY_YES_NO_FIELDS.forEach((field) => {
    if (form[field] !== 'yes' && form[field] !== 'no') errors[field] = 'Choose Yes or No.';
  });
  if (!Array.isArray(form.identityProofs) || form.identityProofs.length === 0) errors.identityProofs = 'Select at least one identity proof.';
  if (form.includeInfant === 'yes' && form.infantFoodProvided !== 'yes' && form.infantFoodProvided !== 'no') errors.infantFoodProvided = 'Choose Yes or No.';
  if (form.infantFoodProvided === 'yes' && !String(form.infantFoodItems ?? '').trim()) errors.infantFoodItems = 'Mention the complimentary food items.';
  if (form.extraBedForAdults === 'yes' && !form.adultExtraBedType) errors.adultExtraBedType = 'Choose an extra bed type.';
  return errors;
};

export default function RulesPoliciesWorkspace({ property }) {
  const [activeTab, setActiveTab] = useState('cancellation');
  const [faqHidden, setFaqHidden] = useState(false);
  const [previewChannel, setPreviewChannel] = useState('MMT');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [errors, setErrors] = useState({});
  const [ruleForm, setRuleForm] = useState(() => policiesFromApi(property.policies));
  const [state, setState] = useState(() => loadStoredState(property.id));
  const [masterTick, setMasterTick] = useState(0);

  useEffect(() => {
    let active = true;
    loadMasters()
      .then(() => { if (active) setMasterTick((tick) => tick + 1); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const ratePlanOptions = useMemo(() => buildRatePlanOptions(property), [property]);
  const ruleOptions = useMemo(() => ({
    identityProofs: optionList(IDENTITY_PROOF_OPTIONS, IDENTITY_PROOF_FALLBACK),
    extraBedTypes: optionList(EXTRA_BED_TYPE_OPTIONS, EXTRA_BED_TYPE_FALLBACK),
    cancellationPolicies: optionList(CANCELLATION_OPTIONS, CANCELLATION_POLICY_FALLBACK),
  }), [masterTick]);

  const update = (patch) => {
    setState((current) => {
      const next = typeof patch === 'function' ? patch(current) : { ...current, ...patch };
      persistState(property.id, next);
      return next;
    });
  };

  const changeRuleField = (field, value) => {
    if (field in ruleForm) setRuleForm((current) => ({ ...current, [field]: value }));
    else update((current) => ({ ...current, propertyRuleExtras: { ...current.propertyRuleExtras, [field]: value } }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const savePropertyRules = async () => {
    const nextErrors = validateRuleForm(ruleForm);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setStatus({ type: 'error', message: 'Complete the highlighted property rules before saving.' });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      await savePolicies(property.id, ruleForm);
      persistState(property.id, state);
      setStatus({ type: 'success', message: 'Property rules saved successfully.' });
    } catch (problem) {
      setStatus({ type: 'error', message: problem?.message || 'Could not save property rules. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const saveWithoutApi = (message) => setStatus({ type: 'success', message });

  const activeTabMeta = RULES_TABS.find((tab) => tab.id === activeTab) ?? RULES_TABS[0];
  const faqs = FAQ_CONTENT[activeTab] ?? [];

  return (
    <div className="rpw-workspace">
      <header className="rpw-head">
        <div>
          <span className="rpw-eyebrow"><ShieldCheck size={14} aria-hidden="true" />Property configuration</span>
          <h2>Rules &amp; Policies</h2>
          <p>Manage cancellation terms, stay rules, notices and guest policies from one place.</p>
        </div>
        <div className="rpw-channel-switch" role="group" aria-label="Channel preview">
          {Object.keys(CHANNEL_PREVIEW).map((channel) => (
            <button type="button" key={channel} className={previewChannel === channel ? 'is-active' : ''} onClick={() => setPreviewChannel(channel)}>{channel === 'GO' ? 'Goibibo' : 'MakeMyTrip'}</button>
          ))}
        </div>
      </header>

      {status ? <div className={`rpw-status-banner is-${status.type}`} role="status">{status.message}</div> : null}

      <div className={`rpw-layout ${faqHidden ? 'faq-hidden' : ''}`}>
        <nav className="rpw-nav" aria-label="Rules and policy sections">
          <p>SECTIONS</p>
          {RULES_TABS.map((tab, index) => {
            const Icon = TAB_ICONS[tab.id] ?? ClipboardList;
            return (
              <button
                type="button"
                key={tab.id}
                className={activeTab === tab.id ? 'is-active' : ''}
                aria-current={activeTab === tab.id ? 'page' : undefined}
                onClick={() => { setActiveTab(tab.id); setStatus(null); setErrors({}); }}
              >
                <span className="rpw-nav-index">{String(index + 1).padStart(2, '0')}</span>
                <Icon size={15} aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <main className="rpw-content">
          <div className="rpw-content-head">
            <span>{activeTabMeta.shortLabel}</span>
            <h3>{activeTabMeta.label}</h3>
            <p>{activeTabMeta.description}</p>
          </div>

          {activeTab === 'cancellation' ? (
            <RulesCancellationPoliciesTab
              gracePeriod={state.gracePeriod}
              policies={state.cancellationPolicies}
              ratePlanOptions={ratePlanOptions}
              onChangeGracePeriod={(next) => update({ gracePeriod: next })}
              onSavePolicy={(policy) => update((current) => {
                const exists = current.cancellationPolicies.some((item) => item.id === policy.id);
                return {
                  ...current,
                  cancellationPolicies: exists
                    ? current.cancellationPolicies.map((item) => (item.id === policy.id ? policy : item))
                    : [...current.cancellationPolicies, policy],
                };
              })}
              onDeletePolicy={(id) => update((current) => ({ ...current, cancellationPolicies: current.cancellationPolicies.filter((policy) => policy.id !== id) }))}
              onTogglePolicyStatus={(id) => update((current) => ({
                ...current,
                cancellationPolicies: current.cancellationPolicies.map((policy) => (policy.id === id ? { ...policy, status: policy.status === 'active' ? 'inactive' : 'active' } : policy)),
              }))}
            />
          ) : null}

          {activeTab === 'property-rules' ? (
            <RulesPropertyRulesTab
              ruleForm={ruleForm}
              extras={state.propertyRuleExtras}
              options={ruleOptions}
              errors={errors}
              onChange={changeRuleField}
              onSave={savePropertyRules}
              saving={saving}
            />
          ) : null}

          {activeTab === 'notices' ? (
            <RulesNoticesTab
              notices={state.notices}
              onSaveNotice={(notice) => update((current) => {
                const exists = current.notices.some((item) => item.id === notice.id);
                return {
                  ...current,
                  notices: exists ? current.notices.map((item) => (item.id === notice.id ? notice : item)) : [...current.notices, notice],
                };
              })}
              onDeleteNotice={(id) => update((current) => ({ ...current, notices: current.notices.filter((notice) => notice.id !== id) }))}
              onToggleNoticeStatus={(id) => update((current) => ({
                ...current,
                notices: current.notices.map((notice) => (notice.id === id ? { ...notice, status: notice.status === 'active' ? 'deactivated' : 'active' } : notice)),
              }))}
            />
          ) : null}

          {activeTab === 'child-age' ? (
            <RulesChildAgeTab
              value={state.childAge}
              onChange={(next) => { update({ childAge: next }); setStatus(null); }}
              onSave={() => saveWithoutApi('Child age policy saved for this browser session.')}
              saving={false}
            />
          ) : null}

          {activeTab === 'post-booking' ? (
            <RulesPostBookingTab
              value={state.postBooking}
              onChange={(next) => { update({ postBooking: next }); setStatus(null); }}
              onSave={() => saveWithoutApi('Post booking policy saved for this browser session.')}
              saving={false}
            />
          ) : null}
        </main>

        <RulesFaqPanel
          faqs={faqs}
          hidden={faqHidden}
          onToggle={() => setFaqHidden((current) => !current)}
          previewChannel={previewChannel === 'GO' ? 'Goibibo' : 'MakeMyTrip'}
          previewText={CHANNEL_PREVIEW[previewChannel]}
        />
      </div>

      <footer className="rpw-foot"><CheckCircle2 size={14} aria-hidden="true" /><span>Property rules sync with the property API. Other sections are saved in this browser session until dedicated endpoints are available.</span></footer>
    </div>
  );
}
