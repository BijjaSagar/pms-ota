import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowUpRight, ChevronDown, Clock3, RefreshCw, ShieldCheck, Sparkles, Tag, Upload,
} from 'lucide-react';
import { ACTION_CATEGORIES, ACTION_FAQS } from '../../lib/data/actionCenter.js';
import {
  PARTNER_PATHS, currentPropertyId, propertyDetailsPath,
} from './paths.js';
import '../../styles/partner-action-center.css';

const STATUS_KEY = 'triponx.partner.actionCenter.statuses';

const CATEGORY_ICONS = {
  'listing-quality': ShieldCheck,
  'promotion-impact': Sparkles,
};

const ACTION_ICONS = {
  'bookings-gst': Upload,
  'margin-offers': Tag,
};

const loadStatuses = () => {
  try {
    const stored = window.sessionStorage.getItem(STATUS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveStatuses = (statuses) => {
  try {
    window.sessionStorage.setItem(STATUS_KEY, JSON.stringify(statuses));
  } catch {
    return;
  }
};

export function ActionCenter() {
  const navigate = useNavigate();
  const { propertyId } = useParams();
  const [statuses, setStatuses] = useState(loadStatuses);
  const [openCategories, setOpenCategories] = useState(() => (
    Object.fromEntries(ACTION_CATEGORIES.map((category) => [category.id, true]))
  ));
  const [openFaqs, setOpenFaqs] = useState({ 'how-works': true });
  const [refreshedAt, setRefreshedAt] = useState(() => new Date());

  const tasks = useMemo(
    () => ACTION_CATEGORIES.flatMap((category) => category.tasks.map((task) => ({ ...task, categoryId: category.id }))),
    [],
  );

  const statusFor = (id) => statuses[id] ?? 'Pending';
  const attentionCount = tasks.filter((task) => statusFor(task.id) !== 'Completed').length;
  const highPriorityCount = tasks.filter((task) => task.priority === 'High' && statusFor(task.id) !== 'Completed').length;

  const toggleCategory = (id) => setOpenCategories((current) => ({ ...current, [id]: !current[id] }));
  const toggleFaq = (id) => setOpenFaqs((current) => ({ ...current, [id]: !current[id] }));

  const refreshStatuses = () => {
    setStatuses((current) => {
      const next = { ...current };
      tasks.forEach((task) => {
        if ((next[task.id] ?? 'Pending') === 'In Progress') next[task.id] = 'Completed';
      });
      saveStatuses(next);
      return next;
    });
    setRefreshedAt(new Date());
  };

  const runAction = (task) => {
    setStatuses((current) => {
      const next = { ...current, [task.id]: 'In Progress' };
      saveStatuses(next);
      return next;
    });

    if (task.action === 'bookings-gst') {
      navigate(`${propertyDetailsPath(currentPropertyId(propertyId), 'bookings')}&gst=Pending&bookingType=Corporate`);
      return;
    }
    navigate(PARTNER_PATHS.marginOffers);
  };

  return (
    <div className="ac-page">
      <header className="ac-head">
        <div>
          <h1 className="ac-title">Action Center</h1>
          <p className="ac-sub">Recommended actions to improve visibility, bookings, revenue, and overall performance.</p>
        </div>
        <button type="button" className="ac-refresh" onClick={refreshStatuses}>
          <RefreshCw size={15} aria-hidden="true" />
          Refresh status
        </button>
      </header>

      <section className="ac-summary" aria-label="Action Center summary">
        <div className="ac-summary-item">
          <span className="ac-summary-label">Actions needed</span>
          <strong>{attentionCount}</strong>
        </div>
        <div className="ac-summary-item">
          <span className="ac-summary-label">High priority</span>
          <strong>{highPriorityCount}</strong>
        </div>
        <div className="ac-summary-item">
          <span className="ac-summary-label">Analysis window</span>
          <strong>30 days</strong>
        </div>
        <div className="ac-summary-item ac-summary-time" aria-live="polite">
          <Clock3 size={15} aria-hidden="true" />
          <span>Refreshed {refreshedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
        </div>
      </section>

      <div className="ac-layout">
        <section className="ac-board" aria-label="Recommended actions">
          {ACTION_CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category.id] ?? Sparkles;
            const open = openCategories[category.id];
            const contentId = `ac-category-${category.id}`;
            return (
              <article className={`ac-category ${open ? 'is-open' : ''}`} key={category.id}>
                <button type="button" className="ac-category-head"
                  aria-expanded={open} aria-controls={contentId}
                  onClick={() => toggleCategory(category.id)}>
                  <span className="ac-category-icon"><Icon size={19} aria-hidden="true" /></span>
                  <span className="ac-category-copy">
                    <strong>{category.title}</strong>
                    <small>{category.summary}</small>
                  </span>
                  <span className="ac-count">{category.tasks.length} task</span>
                  <ChevronDown size={18} aria-hidden="true" className={`ac-chevron ${open ? 'is-open' : ''}`} />
                </button>

                {open ? (
                  <div className="ac-task-list" id={contentId}>
                    {category.tasks.map((task) => {
                      const ActionIcon = ACTION_ICONS[task.action] ?? ArrowUpRight;
                      const taskStatus = statusFor(task.id);
                      return (
                        <div className="ac-task" key={task.id}>
                          <div className="ac-task-top">
                            <span className="ac-task-icon"><ActionIcon size={18} aria-hidden="true" /></span>
                            <span className={`ac-chip ac-priority ${task.priority.toLowerCase()}`}>{task.priority} priority</span>
                            <span className={`ac-chip ac-status ${taskStatus.toLowerCase().replace(' ', '-')}`}>{taskStatus}</span>
                          </div>
                          <h3>{task.title}</h3>
                          <p>{task.description}</p>
                          <div className="ac-task-foot">
                            <button type="button" className="ac-action" onClick={() => runAction(task)}>
                              {task.actionLabel}
                              <ArrowUpRight size={15} aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>

        <aside className="ac-rail" aria-label="Action Center information">
          <div className="ac-info-card">
            <div className="ac-info-head">
              <span>Actions needed</span>
              <strong>{attentionCount}</strong>
            </div>
            <div className="ac-info-body">
              <h2>Action Center information</h2>
              <p className="ac-info-lead">Short answers to help you use recommendations effectively.</p>

              <div className="ac-faq">
                {ACTION_FAQS.map((faq) => {
                  const open = Boolean(openFaqs[faq.id]);
                  const contentId = `ac-faq-${faq.id}`;
                  return (
                    <div className={`ac-faq-item ${open ? 'is-open' : ''}`} key={faq.id}>
                      <button type="button" className="ac-faq-q"
                        aria-expanded={open} aria-controls={contentId}
                        onClick={() => toggleFaq(faq.id)}>
                        <span>{faq.question}</span>
                        <ChevronDown size={16} aria-hidden="true" className={`ac-chevron ${open ? 'is-open' : ''}`} />
                      </button>
                      {open ? (
                        <div className="ac-faq-a" id={contentId}>
                          {faq.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                          {faq.points.length ? (
                            <ul>{faq.points.map((point) => <li key={point}>{point}</li>)}</ul>
                          ) : null}
                          {faq.note ? <p className="ac-faq-note">{faq.note}</p> : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
