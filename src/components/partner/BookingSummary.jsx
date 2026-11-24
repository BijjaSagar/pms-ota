// "Active" view of Your properties: one card per property with its content score and booking numbers.
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, CircleAlert, Info, MapPin, Star } from 'lucide-react';
import { PrivateImage } from './PrivateImage.jsx';
import { propertyDetailsPath } from './paths.js';
import { PropertyIcon } from './PropertyIcons.jsx';
import { STATUS_INFO } from '../../lib/data/propertyStatus.js';
import {
  PERIOD_METRICS, TODAY_METRICS, contentScore, metricOf, nameOf, pendingSections, showMetric,
} from '../../lib/utils/propertySummary.js';

function Score({ property }) {
  const score = contentScore(property);
  const pending = pendingSections(property);
  return (
    <div className="bs-score">
      <span className={`bs-ring ${pending.length ? 'is-low' : ''}`} style={{ '--score': score }} role="img" aria-label={`${score} out of 100`}>
        <span>{score}</span>
      </span>
      <div>
        <span className="bs-score-label">Content score</span>
        {pending.length === 0
          ? <span className="bs-task is-done"><CheckCircle2 size={14} aria-hidden="true" />All complete</span>
          : (
            <details className="bs-task">
              <summary><CircleAlert size={14} aria-hidden="true" />{pending.length} pending task{pending.length === 1 ? '' : 's'}</summary>
              <ul>{pending.map((s) => <li key={s.id}>{s.label}</li>)}</ul>
            </details>
          )}
      </div>
    </div>
  );
}

// A number that opens its section of the property; "–" when there is nothing to open.
function Metric({ property, metric: { key, label, view, money }, suffix }) {
  const value = metricOf(property, key);
  return (
    <div>
      <dt>{label}{suffix && <span className="sr-only"> {suffix}</span>}</dt>
      <dd>{value ? <Link to={propertyDetailsPath(property.id, view)}>{showMetric(value, money)}</Link> : <span>{showMetric(null)}</span>}</dd>
    </div>
  );
}

function PropertyRow({ property: p }) {
  const status = STATUS_INFO[p.status] ?? { label: p.status, tone: 'wait' };
  return (
    <li className="bs-row">
      <div className="bs-id">
        <span className="bs-photo">
          {p.coverUrl ? <PrivateImage path={p.coverUrl} alt="" /> : <PropertyIcon type={p.type} size={34} />}
        </span>
        <div className="bs-id-text">
          <h3 className="bs-name"><Link to={propertyDetailsPath(p.id)}>{nameOf(p)}</Link></h3>
          <span className="pv-card-meta">
            {p.typeLabel}
            {p.city && <><span aria-hidden="true">·</span><MapPin size={13} aria-hidden="true" />{p.city}</>}
          </span>
          {p.ratings?.length > 0 && (
            <span className="bs-ratings">
              {p.ratings.map(({ source, value }) => (
                <span key={source}><Star size={13} aria-hidden="true" />{value.toFixed(1)} <small>{source}</small></span>
              ))}
            </span>
          )}
          <span className="bs-id-foot">
            <span className={`pv-chip is-${status.tone}`}>{status.label}</span>
            <span className="ref-code">{p.reference}</span>
            {p.isSample && <span className="bs-sample">Sample data</span>}
          </span>
        </div>
      </div>
      <Score property={p} />
      <dl className="bs-metrics">
        {TODAY_METRICS.map((m) => <Metric key={m.key} property={p} metric={m} suffix="today" />)}
      </dl>
      <dl className="bs-metrics bs-period">
        {PERIOD_METRICS.map((m) => <Metric key={m.key} property={p} metric={m} suffix="in the last 30 days" />)}
      </dl>
      {p.reviewRequests > 0 && (
        <Link className="bs-review" to={propertyDetailsPath(p.id, 'reviews')}>
          <Star size={15} aria-hidden="true" />Request review for {p.reviewRequests} booking{p.reviewRequests === 1 ? '' : 's'}<ArrowRight size={15} aria-hidden="true" />
        </Link>
      )}
      {p.reviewNote && <p className="pv-card-note bs-note"><Info size={14} aria-hidden="true" />{p.reviewNote}</p>}
    </li>
  );
}

export function BookingSummary({ properties }) {
  return <ul className="bs-list">{properties.map((p) => <PropertyRow key={p.id} property={p} />)}</ul>;
}
