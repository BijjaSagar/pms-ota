import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Baby, Ban, BellRing, CheckCircle2, ClipboardList, ShieldCheck, UserRoundPen } from 'lucide-react';
import {
  createCancellationPolicy, createNotice, deleteCancellationPolicy, deleteNotice, getRules, loadMasters,
  saveChildAge, saveGracePeriod, savePostBooking, savePropertyRules, setCancellationPolicyActive,
  setDefaultCancellationPolicy, setNoticeActive, updateCancellationPolicy, updateNotice,
} from '../../lib/api/properties.js';
import { CHANNEL_PREVIEW, FAQ_CONTENT, RULES_TABS } from '../../lib/data/rulesPolicies.js';
import RulesCancellationPoliciesTab from './RulesCancellationPoliciesTab.jsx';
import RulesPropertyRulesTab, { checkRulesForm, formToBody, rulesToForm } from './RulesPropertyRulesTab.jsx';
import RulesNoticesTab from './RulesNoticesTab.jsx';
import RulesChildAgeTab from './RulesChildAgeTab.jsx';
import RulesPostBookingTab from './RulesPostBookingTab.jsx';
import RulesFaqPanel from './RulesFaqPanel.jsx';
import '../../styles/partner-rules-policies.css';

// Rules & Policies, saved on the server. Every save answers with the whole
// Rules view, which replaces what is shown.

const TAB_ICONS = { cancellation: Ban, 'property-rules': ClipboardList, notices: BellRing, 'child-age': Baby, 'post-booking': UserRoundPen };

/** Server field errors -> { field: 'This must be …' }. */
const fieldErrors = (problem) => Object.fromEntries(Object.entries(problem?.fieldErrors ?? {})
  .map(([field, message]) => [field, /^[A-Z]/.test(message) ? message : `This ${message}.`]));

export default function RulesPoliciesWorkspace({ property }) {
  const propertyId = property.id;
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState('cancellation');
  const [faqHidden, setFaqHidden] = useState(false);
  const [previewChannel, setPreviewChannel] = useState('MMT');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [rulesForm, setRulesForm] = useState(null);
  const [rulesErrors, setRulesErrors] = useState({});
  const [childAge, setChildAge] = useState(null);
  const [nameChange, setNameChange] = useState('');
  const bannerRef = useRef(null);

  /** New server data: the forms follow it. */
  const accept = useCallback((next) => {
    setData(next);
    setRulesForm(rulesToForm(next.propertyRules));
    setChildAge(next.childAge);
    setNameChange(next.postBooking.allowGuestNameChange ? 'yes' : 'no');
  }, []);

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const [, next] = await Promise.all([loadMasters(), getRules(propertyId)]);
      accept(next);
    } catch (problem) {
      setLoadError(problem?.message || 'Rules & Policies could not be loaded.');
    }
  }, [propertyId, accept]);
  useEffect(() => { load(); }, [load]);

  const api = useMemo(() => ({
    saveGracePeriod: (body) => saveGracePeriod(propertyId, body),
    createCancellationPolicy: (body) => createCancellationPolicy(propertyId, body),
    updateCancellationPolicy: (policyId, body) => updateCancellationPolicy(propertyId, policyId, body),
    setCancellationPolicyActive: (policyId, active) => setCancellationPolicyActive(propertyId, policyId, active),
    setDefaultCancellationPolicy: (policyId) => setDefaultCancellationPolicy(propertyId, policyId),
    deleteCancellationPolicy: (policyId) => deleteCancellationPolicy(propertyId, policyId),
    createNotice: (body) => createNotice(propertyId, body),
    updateNotice: (noticeId, body) => updateNotice(propertyId, noticeId, body),
    setNoticeActive: (noticeId, active) => setNoticeActive(propertyId, noticeId, active),
    deleteNotice: (noticeId) => deleteNotice(propertyId, noticeId),
  }), [propertyId]);

  const show = (next) => {
    setStatus(next);
    requestAnimationFrame(() => bannerRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  };

  /** Runs a save. Field errors go back to the caller's form; others show on top. */
  const run = async (action, success) => {
    setBusy(true);
    setStatus(null);
    try {
      accept(await action(api));
      show({ type: 'success', message: success });
      return { ok: true };
    } catch (problem) {
      const fields = fieldErrors(problem);
      if (Object.keys(fields).length) return { ok: false, fields };
      show({ type: 'error', message: problem?.message || 'That did not save. Please try again.' });
      return { ok: false };
    } finally {
      setBusy(false);
    }
  };

  const changeTab = (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setStatus(null);
    showFromTop(document.querySelector('.pii-section-body'));
  };

  if (!data) {
    return loadError ? (
      <div className="rpw-status-banner is-error" role="alert">{loadError} <button type="button" className="rpw-btn is-small" onClick={load}>Try again</button></div>
    ) : <div className="rpw-loading" role="status">Loading Rules &amp; Policies…</div>;
  }

  const rulesDirty = JSON.stringify(rulesForm) !== JSON.stringify(rulesToForm(data.propertyRules));
  const childDirty = JSON.stringify(childAge) !== JSON.stringify(data.childAge);
  const nameDirty = nameChange !== (data.postBooking.allowGuestNameChange ? 'yes' : 'no');
  const dirtyTabs = { 'property-rules': rulesDirty, 'child-age': childDirty, 'post-booking': nameDirty };

  const saveRules = async () => {
    const problems = checkRulesForm(rulesForm);
    setRulesErrors(problems);
    if (Object.keys(problems).length) {
      show({ type: 'error', message: `Answer the ${Object.keys(problems).length} highlighted question${Object.keys(problems).length === 1 ? '' : 's'} before saving.` });
      requestAnimationFrame(() => document.getElementById(`rule-${Object.keys(problems)[0]}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
      return;
    }
    const result = await run(() => savePropertyRules(propertyId, formToBody(rulesForm)), 'Property rules saved.');
    if (result.fields) {
      setRulesErrors(result.fields);
      show({ type: 'error', message: 'Fix the highlighted answers.' });
    }
  };

  const activeTabMeta = RULES_TABS.find((tab) => tab.id === activeTab) ?? RULES_TABS[0];

  return (
    <div className="rpw-workspace">
      <header className="rpw-head">
        <div>
          <span className="rpw-eyebrow"><ShieldCheck size={14} aria-hidden="true" />Property configuration</span>
          <h2>Rules &amp; Policies</h2>
          <p>Cancellation terms, stay rules, notices and guest policies, in one place.</p>
        </div>
        <div className="rpw-channel-switch" role="group" aria-label="Channel preview">
          {Object.keys(CHANNEL_PREVIEW).map((channel) => (
            <button type="button" key={channel} className={previewChannel === channel ? 'is-active' : ''} onClick={() => setPreviewChannel(channel)}>{channel === 'GO' ? 'Goibibo' : 'MakeMyTrip'}</button>
          ))}
        </div>
      </header>

      <div ref={bannerRef}>
        {status ? <div className={`rpw-status-banner is-${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>{status.message}</div> : null}
      </div>

      <div className={`rpw-layout ${faqHidden ? 'faq-hidden' : ''}`}>
        <nav className="rpw-nav" aria-label="Rules and policy sections">
          <p>SECTIONS</p>
          {RULES_TABS.map((tab, index) => {
            const Icon = TAB_ICONS[tab.id] ?? ClipboardList;
            return (
              <button type="button" key={tab.id} className={activeTab === tab.id ? 'is-active' : ''} aria-current={activeTab === tab.id ? 'page' : undefined} onClick={() => changeTab(tab.id)}>
                <span className="rpw-nav-index">{String(index + 1).padStart(2, '0')}</span>
                <Icon size={15} aria-hidden="true" />
                <span>{tab.label}</span>
                {dirtyTabs[tab.id] ? <span className="rpw-nav-dirty" title="Unsaved changes" aria-label="Unsaved changes" /> : null}
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

          {activeTab === 'cancellation' ? <RulesCancellationPoliciesTab data={data} busy={busy} onRun={run} /> : null}

          {activeTab === 'property-rules' ? (
            <RulesPropertyRulesTab
              form={rulesForm}
              errors={rulesErrors}
              dirty={rulesDirty}
              saving={busy}
              onChange={(field, value) => {
                setRulesForm((current) => ({ ...current, [field]: value }));
                setRulesErrors((current) => { if (!current[field]) return current; const next = { ...current }; delete next[field]; return next; });
              }}
              onDiscard={() => { setRulesForm(rulesToForm(data.propertyRules)); setRulesErrors({}); setStatus(null); }}
              onSave={saveRules}
            />
          ) : null}

          {activeTab === 'notices' ? <RulesNoticesTab data={data} busy={busy} onRun={run} /> : null}

          {activeTab === 'child-age' ? (
            <RulesChildAgeTab
              value={childAge}
              dirty={childDirty}
              saving={busy}
              onChange={(next) => { setChildAge(next); setStatus(null); }}
              onDiscard={() => setChildAge(data.childAge)}
              onSave={() => run(() => saveChildAge(propertyId, childAge), 'Child age policy saved.').then((result) => {
                if (result.fields) show({ type: 'error', message: Object.values(result.fields)[0] });
              })}
            />
          ) : null}

          {activeTab === 'post-booking' ? (
            <RulesPostBookingTab
              value={nameChange}
              dirty={nameDirty}
              saving={busy}
              onChange={(next) => { setNameChange(next); setStatus(null); }}
              onDiscard={() => setNameChange(data.postBooking.allowGuestNameChange ? 'yes' : 'no')}
              onSave={() => run(() => savePostBooking(propertyId, { allowGuestNameChange: nameChange === 'yes' }), 'Post booking policy saved.')}
            />
          ) : null}
        </main>

        <RulesFaqPanel
          faqs={FAQ_CONTENT[activeTab] ?? []}
          hidden={faqHidden}
          onToggle={() => setFaqHidden((current) => !current)}
          previewChannel={previewChannel === 'GO' ? 'Goibibo' : 'MakeMyTrip'}
          previewText={CHANNEL_PREVIEW[previewChannel]}
        />
      </div>

      <footer className="rpw-foot"><CheckCircle2 size={14} aria-hidden="true" /><span>Every section is saved to your property. Unsaved tabs are marked with a dot.</span></footer>
    </div>
  );
}
