import { useState } from 'react';
import { ChevronDown, ChevronRight, Star } from 'lucide-react';

function BrandBadge({ summary }) {
  return <span className={`rr-brand is-${summary.id}`}>{summary.short}</span>;
}

function Stars({ value }) {
  const filled = Math.round(value);
  return (
    <span className="rr-stars" aria-label={`${value} out of 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star key={index} size={13} className={index < filled ? '' : 'is-off'} fill={index < filled ? 'currentColor' : 'none'} aria-hidden="true" />
      ))}
    </span>
  );
}

function Distribution({ rows }) {
  return (
    <div className="rr-table-scroll">
      <table className="rr-dist-table">
        <thead>
          <tr><th scope="col">Rating</th><th scope="col">Share</th><th scope="col">Percentage</th><th scope="col">Count</th></tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td><span className="rr-bar" aria-hidden="true"><span style={{ width: `${row.percentage}%` }} /></span></td>
              <td>{row.percentage}%</td>
              <td>{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OtaCard({ summary }) {
  const [showCategories, setShowCategories] = useState(false);
  const [showImpressions, setShowImpressions] = useState(false);
  const categories = showCategories ? [...summary.categories, ...summary.extraCategories] : summary.categories;
  const score = `${summary.overall.toFixed(1)}/5`;

  return (
    <article className="rr-card">
      <header className="rr-card-head">
        <div className="rr-card-title">
          <BrandBadge summary={summary} />
          <div>
            <h3>{summary.name}</h3>
            <p>OTA rating performance</p>
          </div>
        </div>
        <div className="rr-score" style={{ '--score': `${(summary.overall / 5) * 100}%` }}>
          <span>{summary.overall.toFixed(1)}</span>
        </div>
      </header>

      <div className="rr-overall">
        <strong>{score}</strong>
        <span>{summary.overallLabel}</span>
        <Stars value={summary.overall} />
      </div>

      <div className="rr-stat-grid">
        <div><dt>Total ratings</dt><dd>{summary.totalRatings}</dd></div>
        <div><dt>Total reviews</dt><dd>{summary.totalReviews}</dd></div>
      </div>

      <section className="rr-block">
        <h4>Rating distribution</h4>
        <Distribution rows={summary.distribution} />
      </section>

      <section className="rr-block">
        <div className="rr-block-head">
          <h4>Category ratings</h4>
          <button type="button" className="rr-text-btn" aria-expanded={showCategories} onClick={() => setShowCategories((open) => !open)}>
            {showCategories ? 'View Less' : 'View More'}{showCategories ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
          </button>
        </div>
        <ul className="rr-category-list">
          {categories.map((category) => (
            <li key={category.label}>
              <span>{category.label}</span>
              <span className="rr-category-score"><Star size={12} fill="currentColor" aria-hidden="true" />{category.score.toFixed(1)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rr-block">
        <h4>Most recent ratings</h4>
        <div className="rr-recent-list">
          {summary.recentRatings.map((rating, index) => (
            <span key={`${rating}-${index}`} className={`rr-recent is-${rating >= 4.5 ? 'excellent' : rating >= 3.5 ? 'good' : 'low'}`}>
              <Star size={11} fill="currentColor" aria-hidden="true" />{rating.toFixed(1)}
            </span>
          ))}
        </div>
      </section>

      <section className="rr-block rr-impressions">
        <div className="rr-block-head">
          <h4>Traveller impressions</h4>
          <span className="rr-ai-tag">AI summary</span>
        </div>
        <p>{showImpressions ? summary.impressions.full : summary.impressions.short}</p>
        <button type="button" className="rr-text-btn" aria-expanded={showImpressions} onClick={() => setShowImpressions((open) => !open)}>
          {showImpressions ? 'Read Less' : 'Read More'}{showImpressions ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
        </button>
      </section>
    </article>
  );
}

export function RatingsOverview({ summaries }) {
  return (
    <section className="rr-overview" aria-label="Ratings and reviews overview">
      <div className="rr-ota-grid">
        {summaries.map((summary) => <OtaCard key={summary.id} summary={summary} />)}
      </div>
    </section>
  );
}
