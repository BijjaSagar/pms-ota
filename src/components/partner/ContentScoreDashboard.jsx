import { Fragment, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Coffee,
  Image as ImageIcon,
  Info,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  CONTENT_SCORE_FAQS,
  CONTENT_SCORE_INFO,
  formatScore,
  formatSectionScore,
  getSectionStatus,
  normalizeContentScoreSnapshot,
} from '../../lib/data/contentScore.js';
import { propertyInformationSectionPath } from './paths.js';
import '../../styles/partner-content-score.css';

const SECTION_ICONS = {
  photos: ImageIcon,
  amenities: Coffee,
  'property-details': Building2,
  policies: ShieldCheck,
};

const progressPercent = (section) => {
  const maximum = Number(section.maximum) || 1;
  return Math.max(0, Math.min(100, (Number(section.current) / maximum) * 100));
};

export default function ContentScoreDashboard({ property }) {
  const snapshot = useMemo(() => normalizeContentScoreSnapshot(property), [property]);
  const [expanded, setExpanded] = useState({});
  const [faqOpen, setFaqOpen] = useState(0);
  const [learnOpen, setLearnOpen] = useState(false);

  const pendingSections = snapshot.sections.filter((section) => section.pendingTasks.length);
  const pendingTasks = pendingSections.flatMap((section) => section.pendingTasks.map((task) => ({ section, task })));
  const completedSections = snapshot.sections.length - pendingSections.length;
  const overallPercent = Math.max(0, Math.min(100, snapshot.total));
  const aheadBy = snapshot.total - snapshot.areaAverage;

  useEffect(() => {
    if (!learnOpen) return undefined;
    const onKeyDown = (event) => { if (event.key === 'Escape') setLearnOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [learnOpen]);

  const toggleSection = (id) => setExpanded((current) => ({ ...current, [id]: !current[id] }));

  return (
    <div className="csd-dashboard">
      <header className="csd-hero">
        <div className="csd-hero-copy">
          <span className="csd-eyebrow"><Sparkles size={14} aria-hidden="true" />{snapshot.channel} content quality</span>
          <h2>Your listing, measured</h2>
          <p>See how complete your property information is and where a small update can make a difference.</p>
          <div className="csd-hero-meta">
            <span><Check size={13} aria-hidden="true" />{completedSections} of {snapshot.sections.length} sections complete</span>
            <button type="button" className="csd-learn-btn" onClick={() => setLearnOpen(true)}><Info size={14} aria-hidden="true" />Learn More</button>
          </div>
        </div>

        <div className="csd-score-block">
          <div className="csd-ring" style={{ '--score': `${overallPercent}%` }}>
            <strong>{formatScore(snapshot.total)}</strong>
            <span>/ 100</span>
          </div>
          <div className="csd-score-copy">
            <span className="csd-pill is-complete">Almost optimized</span>
            <p>{pendingTasks.length ? `Finish ${pendingTasks.length} remaining task${pendingTasks.length === 1 ? '' : 's'} to reach a perfect score.` : 'Everything is complete. Great work!'}</p>
            <div className="csd-banner-bar" role="progressbar" aria-label="Overall content score" aria-valuemin="0" aria-valuemax="100" aria-valuenow={snapshot.total}>
              <i style={{ width: `${overallPercent}%` }} />
            </div>
          </div>
        </div>
      </header>

      <div className="csd-grid">
        <main className="csd-main">
          <section className="csd-card csd-breakdown">
            <div className="csd-card-head">
              <div>
                <h3>Score breakdown</h3>
                <p>Four weighted areas make up the overall content score.</p>
              </div>
              <span className="csd-count-pill">{snapshot.sections.length} sections</span>
            </div>

            <div className="csd-table-scroll">
              <table className="csd-table">
                <thead>
                  <tr>
                    <th>Section</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Points</th>
                    <th><span className="csd-sr-only">Details</span></th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.sections.map((section) => {
                    const Icon = SECTION_ICONS[section.id] ?? Sparkles;
                    const status = getSectionStatus(section);
                    const isOpen = Boolean(expanded[section.id]);
                    const percent = progressPercent(section);
                    return (
                      <Fragment key={section.id}>
                        <tr className={isOpen ? 'is-open' : ''}>
                          <th data-label="Section">
                            <div className="csd-section-name">
                              <span className="csd-section-icon"><Icon size={16} aria-hidden="true" /></span>
                              <span><strong>{section.label}</strong><small>{section.summary}</small></span>
                            </div>
                          </th>
                          <td data-label="Status"><span className={`csd-pill is-${status.tone}`}>{status.label}</span></td>
                          <td data-label="Progress">
                            <div className="csd-progress-cell">
                              <div className="csd-bar" role="progressbar" aria-label={`${section.label} progress`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(percent)}>
                                <i style={{ width: `${percent}%` }} />
                              </div>
                              <small>{Math.round(percent)}%</small>
                            </div>
                          </td>
                          <td data-label="Points"><strong>{formatSectionScore(section.current)}</strong><span> / {formatSectionScore(section.maximum)}</span></td>
                          <td className="csd-row-action">
                            <button type="button" onClick={() => toggleSection(section.id)} aria-expanded={isOpen}>
                              {isOpen ? 'Hide' : 'Show'}
                              {isOpen ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
                            </button>
                          </td>
                        </tr>
                        {isOpen ? (
                          <tr className="csd-detail-row">
                            <td colSpan="5">
                              <div className="csd-detail">
                                <p>{section.detail}</p>
                                {section.pendingTasks.length ? (
                                  <ul>
                                    {section.pendingTasks.map((task) => <li key={task}><span />{task}</li>)}
                                  </ul>
                                ) : (
                                  <span className="csd-done"><Check size={13} aria-hidden="true" />No pending tasks in this section.</span>
                                )}
                                <Link to={propertyInformationSectionPath(property.id, section.sectionId)}>Open {section.label} <ArrowUpRight size={13} aria-hidden="true" /></Link>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <th>Total</th>
                    <td />
                    <td />
                    <td><strong>{formatScore(snapshot.total)}</strong><span> / 100</span></td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          <section className="csd-card csd-purpose">
            <div className="csd-card-head">
              <div>
                <h3>Why this matters</h3>
                <p>A complete listing presents better information to potential guests.</p>
              </div>
            </div>
            <div className="csd-purpose-grid">
              <div><span>01</span><strong>Understand quality</strong><small>See which parts of your listing are already strong.</small></div>
              <div><span>02</span><strong>Find gaps</strong><small>Spot missing property information before guests do.</small></div>
              <div><span>03</span><strong>Improve presentation</strong><small>Use the next actions to polish photos and amenities.</small></div>
              <div><span>04</span><strong>Stay ready</strong><small>Keep details and policies current as your property changes.</small></div>
            </div>
          </section>
        </main>

        <aside className="csd-rail">
          <section className="csd-card csd-insights">
            <div className="csd-card-head">
              <div>
                <h3>Area insights</h3>
                <p>How this property compares nearby.</p>
              </div>
              <TrendingUp size={17} aria-hidden="true" />
            </div>
            <div className="csd-insight-body">
              <div className="csd-insight-scores">
                <div><span>This property</span><strong>{formatScore(snapshot.total)}</strong></div>
                <div><span>Area average</span><strong>{formatScore(snapshot.areaAverage)}</strong></div>
              </div>
              <div className="csd-compare-track" aria-hidden="true">
                <i style={{ width: `${Math.min(100, snapshot.areaAverage)}%` }} />
                <b style={{ left: `${overallPercent}%` }} />
              </div>
              <p className="csd-insight-note">
                {aheadBy >= 0
                  ? `You are ${formatScore(aheadBy)} points ahead of the area average. Complete the remaining task to extend that lead.`
                  : `You are ${formatScore(Math.abs(aheadBy))} points behind the area average. Completing pending tasks will close the gap.`}
              </p>
            </div>
          </section>

          <section className="csd-card csd-actions">
            <div className="csd-card-head">
              <div>
                <h3>Next best actions</h3>
                <p>Small updates with the biggest score impact.</p>
              </div>
              <span className="csd-count-pill">{pendingTasks.length}</span>
            </div>
            <div className="csd-action-list">
              {pendingTasks.length ? pendingTasks.map(({ section, task }) => (
                <div className="csd-action-item" key={`${section.id}-${task}`}>
                  <span className="csd-action-dot" />
                  <div><strong>{section.label}</strong><p>{task}</p></div>
                  <Link to={propertyInformationSectionPath(property.id, section.sectionId)} aria-label={`Open ${section.label}`}><ArrowUpRight size={15} aria-hidden="true" /></Link>
                </div>
              )) : (
                <div className="csd-action-empty"><Check size={18} aria-hidden="true" /><strong>All caught up</strong><span>No pending tasks remain.</span></div>
              )}
            </div>
          </section>

          <section className="csd-card csd-faq">
            <div className="csd-card-head">
              <div>
                <h3>Frequently asked questions</h3>
                <p>Understand how the score works.</p>
              </div>
            </div>
            <div className="csd-faq-list">
              {CONTENT_SCORE_FAQS.map((faq, index) => {
                const isOpen = faqOpen === index;
                return (
                  <div className={`csd-faq-item ${isOpen ? 'is-open' : ''}`} key={faq.question}>
                    <button type="button" onClick={() => setFaqOpen(isOpen ? -1 : index)} aria-expanded={isOpen}>
                      <span>{faq.question}</span>
                      {isOpen ? <ChevronDown size={15} aria-hidden="true" /> : <ChevronRight size={15} aria-hidden="true" />}
                    </button>
                    {isOpen ? <p>{faq.answer}</p> : null}
                  </div>
                );
              })}
            </div>
          </section>
        </aside>
      </div>

      <footer className="csd-foot"><Info size={14} aria-hidden="true" /><span>Scores shown are a demo snapshot and will update automatically when a content-score endpoint is connected.</span></footer>

      {learnOpen && typeof document !== 'undefined' ? createPortal(
        <div className="csd-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLearnOpen(false); }}>
          <section className="csd-modal" role="dialog" aria-modal="true" aria-label={CONTENT_SCORE_INFO.title}>
            <header className="csd-modal-head">
              <div>
                <span className="csd-eyebrow"><Sparkles size={13} aria-hidden="true" />Content score guide</span>
                <h3>{CONTENT_SCORE_INFO.title}</h3>
              </div>
              <button type="button" className="csd-icon-btn" onClick={() => setLearnOpen(false)} aria-label="Close dialog"><X size={17} aria-hidden="true" /></button>
            </header>
            <div className="csd-modal-body">
              <p className="csd-modal-intro">{CONTENT_SCORE_INFO.intro}</p>
              <ul className="csd-modal-points">
                {CONTENT_SCORE_INFO.points.map((point) => <li key={point}><Check size={14} aria-hidden="true" /><span>{point}</span></li>)}
              </ul>
              <p className="csd-modal-note"><Info size={14} aria-hidden="true" />{CONTENT_SCORE_INFO.note}</p>
            </div>
            <footer className="csd-modal-foot"><button type="button" className="csd-learn-btn" onClick={() => setLearnOpen(false)}>Got it</button></footer>
          </section>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}
