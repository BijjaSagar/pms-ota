import { Fragment, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight, Building2, Check, ChevronDown, ChevronRight, Coffee, Image as ImageIcon, Info,
  RefreshCw, ShieldCheck, Sparkles, TrendingUp, X,
} from 'lucide-react';
import { getContentScore } from '../../lib/api/properties.js';
import { propertyInformationSectionPath } from './paths.js';
import '../../styles/partner-content-score.css';

// Content Score, calculated by the server from the saved listing. Every
// point comes from one check; an unmet check is a task that links to the
// section that fixes it.

const SECTION_ICONS = { photos: ImageIcon, amenities: Coffee, 'property-details': Building2, policies: ShieldCheck };
const LEVEL_TONE = { Excellent: 'complete', Good: 'complete', 'Needs work': 'partial', Incomplete: 'empty' };
const fmt = (value, decimals = 1) => Number(value).toFixed(decimals).replace(/\.0+$/, '');
const pct = (earned, maximum) => Math.max(0, Math.min(100, maximum ? (earned / maximum) * 100 : 0));

const FAQS = [
  { question: 'How can I increase my score?', answer: 'Work through Next best actions. Each one says exactly what is missing and opens the section that fixes it. The score updates as soon as you save there.' },
  { question: 'How is the score calculated?', answer: 'Photos are worth 45 points, amenities 30, property details 15 and policies 10. Each area is made of checks; partly done work earns part of the points.' },
  { question: 'Why does my area comparison not show?', answer: 'It compares you with other live listings in your city, and needs at least 3 of them to be meaningful.' },
];

/** Status of an area from its points. */
function statusOf(area) {
  if (area.earned >= area.maximum) return { label: 'Complete', tone: 'complete' };
  if (area.earned > 0) return { label: 'In progress', tone: 'partial' };
  return { label: 'Not started', tone: 'empty' };
}

export default function ContentScoreDashboard({ property }) {
  const [score, setScore] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [faqOpen, setFaqOpen] = useState(0);
  const [learnOpen, setLearnOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setScore(await getContentScore(property.id));
    } catch (problem) {
      setError(problem?.message || 'The content score could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [property.id]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!learnOpen) return undefined;
    const onKeyDown = (event) => { if (event.key === 'Escape') setLearnOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKeyDown); document.body.style.overflow = overflow; };
  }, [learnOpen]);

  if (!score) {
    return error ? (
      <div className="csd-error" role="alert"><Info size={15} aria-hidden="true" /> {error} <button type="button" className="csd-learn-btn" onClick={load}>Try again</button></div>
    ) : <div className="csd-loading" role="status">Calculating your content score…</div>;
  }

  const areas = score.areas;
  const tasks = areas.flatMap((area) => area.checks.filter((item) => item.task).map((item) => ({ area, item, gain: item.points - item.earned })))
    .sort((a, b) => b.gain - a.gain);
  const complete = areas.filter((area) => area.earned >= area.maximum).length;
  const total = Math.max(0, Math.min(100, score.total));
  const { comparison } = score;
  const ahead = comparison.average === null ? null : score.total - comparison.average;
  const sectionLink = (area) => propertyInformationSectionPath(property.id, area.sectionId);

  return (
    <div className="csd-dashboard">
      <header className="csd-hero">
        <div className="csd-hero-copy">
          <span className="csd-eyebrow"><Sparkles size={14} aria-hidden="true" />Listing content quality</span>
          <h2>Your listing, measured</h2>
          <p>How complete your property information is, calculated from what you have saved, and the updates that raise it most.</p>
          <div className="csd-hero-meta">
            <span><Check size={13} aria-hidden="true" />{complete} of {areas.length} areas complete</span>
            <button type="button" className="csd-learn-btn" onClick={() => setLearnOpen(true)}><Info size={14} aria-hidden="true" />How it works</button>
            <button type="button" className="csd-learn-btn" onClick={load} disabled={loading}><RefreshCw size={14} aria-hidden="true" className={loading ? 'csd-spin' : ''} />{loading ? 'Updating…' : 'Refresh'}</button>
          </div>
        </div>

        <div className="csd-score-block">
          <div className="csd-ring" style={{ '--score': `${total}%` }}>
            <strong>{fmt(score.total, 2)}</strong>
            <span>/ 100</span>
          </div>
          <div className="csd-score-copy">
            <span className={`csd-pill is-${LEVEL_TONE[score.level] ?? 'partial'}`}>{score.level}</span>
            <p>{tasks.length ? `${tasks.length} task${tasks.length === 1 ? '' : 's'} left; the first one is worth ${fmt(tasks[0].gain)} point${tasks[0].gain === 1 ? '' : 's'}.` : 'Everything is complete. Great work!'}</p>
            <div className="csd-banner-bar" role="progressbar" aria-label="Overall content score" aria-valuemin="0" aria-valuemax="100" aria-valuenow={score.total}>
              <i style={{ width: `${total}%` }} />
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
                <p>Four weighted areas make up the score. Open one to see each check.</p>
              </div>
              <span className="csd-count-pill">{areas.length} areas</span>
            </div>

            <div className="csd-table-scroll">
              <table className="csd-table">
                <thead>
                  <tr>
                    <th>Area</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Points</th>
                    <th><span className="csd-sr-only">Details</span></th>
                  </tr>
                </thead>
                <tbody>
                  {areas.map((area) => {
                    const Icon = SECTION_ICONS[area.id] ?? Sparkles;
                    const status = statusOf(area);
                    const isOpen = Boolean(expanded[area.id]);
                    const percent = pct(area.earned, area.maximum);
                    const open = area.checks.filter((item) => item.task).length;
                    return (
                      <Fragment key={area.id}>
                        <tr className={isOpen ? 'is-open' : ''}>
                          <th data-label="Area">
                            <div className="csd-section-name">
                              <span className="csd-section-icon"><Icon size={16} aria-hidden="true" /></span>
                              <span><strong>{area.label}</strong><small>{open ? `${open} of ${area.checks.length} checks to finish` : `All ${area.checks.length} checks done`}</small></span>
                            </div>
                          </th>
                          <td data-label="Status"><span className={`csd-pill is-${status.tone}`}>{status.label}</span></td>
                          <td data-label="Progress">
                            <div className="csd-progress-cell">
                              <div className="csd-bar" role="progressbar" aria-label={`${area.label} progress`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(percent)}><i style={{ width: `${percent}%` }} /></div>
                              <small>{Math.round(percent)}%</small>
                            </div>
                          </td>
                          <td data-label="Points"><strong>{fmt(area.earned)}</strong><span> / {area.maximum}</span></td>
                          <td className="csd-row-action">
                            <button type="button" onClick={() => setExpanded((current) => ({ ...current, [area.id]: !current[area.id] }))} aria-expanded={isOpen}>
                              {isOpen ? 'Hide' : 'Show'}{isOpen ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
                            </button>
                          </td>
                        </tr>
                        {isOpen ? (
                          <tr className="csd-detail-row">
                            <td colSpan="5">
                              <div className="csd-detail">
                                <ul className="csd-check-list">
                                  {area.checks.map((item) => (
                                    <li key={item.id} className={item.task ? 'is-open' : 'is-done'}>
                                      <span className="csd-check-mark" aria-hidden="true">{item.task ? null : <Check size={12} />}</span>
                                      <span className="csd-check-copy"><strong>{item.label}</strong>{item.task ? <small>{item.task}</small> : null}</span>
                                      <span className="csd-check-points">{fmt(item.earned)} / {item.points}</span>
                                    </li>
                                  ))}
                                </ul>
                                <Link to={sectionLink(area)}>Open {area.label} <ArrowUpRight size={13} aria-hidden="true" /></Link>
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
                    <td><strong>{fmt(score.total, 2)}</strong><span> / 100</span></td>
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
                <p>A complete listing gives guests what they need to choose you.</p>
              </div>
            </div>
            <div className="csd-purpose-grid">
              <div><span>01</span><strong>Understand quality</strong><small>See which parts of your listing are already strong.</small></div>
              <div><span>02</span><strong>Find gaps</strong><small>Spot missing information before guests do.</small></div>
              <div><span>03</span><strong>Improve presentation</strong><small>Photos and amenities carry the most points.</small></div>
              <div><span>04</span><strong>Stay ready</strong><small>Keep details and policies current as things change.</small></div>
            </div>
          </section>
        </main>

        <aside className="csd-rail">
          <section className="csd-card csd-insights">
            <div className="csd-card-head">
              <div>
                <h3>Area insights</h3>
                <p>{comparison.city ? `Live listings in ${comparison.city}.` : 'Your city is not set yet.'}</p>
              </div>
              <TrendingUp size={17} aria-hidden="true" />
            </div>
            <div className="csd-insight-body">
              {comparison.average === null ? (
                <p className="csd-insight-note">
                  {comparison.city
                    ? `Not enough live listings in ${comparison.city} to compare yet (${comparison.properties} of ${comparison.minimum} needed).`
                    : 'Add your location in Basic Information to compare with nearby listings.'}
                </p>
              ) : (
                <>
                  <div className="csd-insight-scores">
                    <div><span>This property</span><strong>{fmt(score.total, 2)}</strong></div>
                    <div><span>City average</span><strong>{fmt(comparison.average, 2)}</strong></div>
                  </div>
                  <div className="csd-compare-track" aria-hidden="true">
                    <i style={{ width: `${Math.min(100, comparison.average)}%` }} />
                    <b style={{ left: `${total}%` }} />
                  </div>
                  <p className="csd-insight-note">
                    {ahead >= 0
                      ? `You are ${fmt(ahead, 2)} points ahead of the ${comparison.properties} live listings in ${comparison.city}.`
                      : `You are ${fmt(-ahead, 2)} points behind the ${comparison.properties} live listings in ${comparison.city}. The tasks below close the gap.`}
                  </p>
                </>
              )}
            </div>
          </section>

          <section className="csd-card csd-actions">
            <div className="csd-card-head">
              <div>
                <h3>Next best actions</h3>
                <p>Biggest score gain first.</p>
              </div>
              <span className="csd-count-pill">{tasks.length}</span>
            </div>
            <div className="csd-action-list">
              {tasks.length ? tasks.map(({ area, item, gain }) => (
                <Link className="csd-action-item" key={`${area.id}-${item.id}`} to={sectionLink(area)}>
                  <span className="csd-action-dot" />
                  <div><strong>{area.label} · +{fmt(gain)}</strong><p>{item.task}</p></div>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              )) : (
                <div className="csd-action-empty"><Check size={18} aria-hidden="true" /><strong>All caught up</strong><span>No tasks left.</span></div>
              )}
            </div>
          </section>

          <section className="csd-card csd-faq">
            <div className="csd-card-head">
              <div>
                <h3>Frequently asked questions</h3>
                <p>How the score works.</p>
              </div>
            </div>
            <div className="csd-faq-list">
              {FAQS.map((faq, index) => {
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

      <footer className="csd-foot"><Info size={14} aria-hidden="true" /><span>Calculated from your saved listing each time you open this page.</span></footer>

      {learnOpen ? createPortal(
        <div className="csd-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLearnOpen(false); }}>
          <section className="csd-modal" role="dialog" aria-modal="true" aria-label="How the content score is calculated">
            <header className="csd-modal-head">
              <div>
                <span className="csd-eyebrow"><Sparkles size={13} aria-hidden="true" />Content score guide</span>
                <h3>How the content score is calculated</h3>
              </div>
              <button type="button" className="csd-icon-btn" onClick={() => setLearnOpen(false)} aria-label="Close dialog"><X size={17} aria-hidden="true" /></button>
            </header>
            <div className="csd-modal-body">
              <p className="csd-modal-intro">Your score measures how complete your listing is across the four areas guests rely on most. Every point comes from one of these checks:</p>
              {areas.map((area) => (
                <div className="csd-guide-area" key={area.id}>
                  <h4>{area.label} <span>{area.maximum} points</span></h4>
                  <ul className="csd-modal-points">
                    {area.checks.map((item) => <li key={item.id}><Check size={14} aria-hidden="true" /><span>{item.label} ({item.points})</span></li>)}
                  </ul>
                </div>
              ))}
            </div>
            <footer className="csd-modal-foot"><button type="button" className="csd-learn-btn" onClick={() => setLearnOpen(false)}>Got it</button></footer>
          </section>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}
