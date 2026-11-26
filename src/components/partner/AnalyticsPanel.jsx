import { Download } from 'lucide-react';
import { formatAnalyticsValue } from '../../lib/data/analytics.js';

const compactValue = (sectionId, value) => {
  if (sectionId === 'revenue') return `INR ${(value / 1000).toFixed(0)}k`;
  if (sectionId === 'asp') return `INR ${Math.round(value)}`;
  if (sectionId === 'conversion') return `${value.toFixed(1)}%`;
  return Math.round(value).toLocaleString('en-IN');
};

function WeeklyChart({ model }) {
  const max = Math.max(...model.weekly.map((row) => Math.max(row.property, row.competitor)), 1);
  return (
    <section className="an-chart-card">
      <div className="an-card-head">
        <div>
          <h3>Weekly performance comparison</h3>
          <p>Your property against the competitor set for {model.comparisonLabel.toLowerCase()}.</p>
        </div>
        <div className="an-legend" aria-label="Chart legend">
          <span><i className="an-legend-swatch is-property" />Your property</span>
          <span><i className="an-legend-swatch is-competitor" />Competitors</span>
        </div>
      </div>
      <div className="an-chart-scroll" role="img" aria-label={`Weekly comparison for ${model.section.label}`}>
        <div className="an-chart">
          {model.weekly.map((row) => (
            <div className="an-chart-col" key={`${row.label}-${row.date}`}>
              <div className="an-chart-bars">
                <div className="an-bar is-property" style={{ height: `${(row.property / max) * 100}%` }}>
                  <span>{compactValue(model.section.id, row.property)}</span>
                </div>
                <div className="an-bar is-competitor" style={{ height: `${(row.competitor / max) * 100}%` }}>
                  <span>{compactValue(model.section.id, row.competitor)}</span>
                </div>
              </div>
              <span className="an-chart-label">{row.axisLabel}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BreakdownCard({ group, sectionId }) {
  const max = Math.max(...group.rows.map((row) => Math.max(row.value, row.competitor)), 1);
  return (
    <article className="an-breakdown-card">
      <h4>{group.label}</h4>
      <div className="an-table-scroll">
        <table className="an-breakdown-table">
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Your performance</th>
              <th scope="col">Competitor</th>
              <th scope="col">Share</th>
            </tr>
          </thead>
          <tbody>
            {group.rows.map((row) => (
              <tr key={row.label}>
                <th scope="row" data-label="Category">{row.label}</th>
                <td data-label="Your performance">
                  <span className="an-compare-line"><i style={{ width: `${(row.value / max) * 100}%` }} /></span>
                  <strong>{formatAnalyticsValue(sectionId, row.value)}</strong>
                </td>
                <td data-label="Competitor">
                  <span className="an-compare-line is-competitor"><i style={{ width: `${(row.competitor / max) * 100}%` }} /></span>
                  <span>{formatAnalyticsValue(sectionId, row.competitor)}</span>
                </td>
                <td data-label="Share">{row.share}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

export function AnalyticsPanel({ model, csvBusy, onDownload }) {
  return (
    <div className="an-section-body">
      <header className="an-section-head">
        <div>
          <span className="an-eyebrow">Performance overview</span>
          <h3>{model.section.title}</h3>
          <p>{model.section.description}</p>
        </div>
        <button type="button" className="btn btn-dark btn-sm" disabled={csvBusy} onClick={onDownload}>
          <Download size={14} aria-hidden="true" />{csvBusy ? 'Preparing…' : `Download ${model.section.label} Data`}
        </button>
      </header>

      <WeeklyChart model={model} />

      <section className="an-breakdown-section" aria-label={`${model.section.label} detailed analysis`}>
        <div className="an-card-head">
          <div>
            <h3>Detailed analysis</h3>
            <p>Category-wise performance with competitor comparison.</p>
          </div>
        </div>
        <div className="an-breakdown-grid">
          {model.breakdowns.map((group) => <BreakdownCard group={group} sectionId={model.section.id} key={group.id} />)}
        </div>
      </section>
    </div>
  );
}
