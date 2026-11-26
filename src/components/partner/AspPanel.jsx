import { ChevronLeft, ChevronRight, Download, TrendingUp } from 'lucide-react';
import { formatAnalyticsValue } from '../../lib/data/analytics.js';

function AspSummary({ model }) {
  const bestDay = model.aspDays.reduce((best, day) => (day.property > best.property ? day : best), model.aspDays[0]);
  const bestRank = Math.min(...model.aspDays.map((day) => day.rank));
  return (
    <div className="an-asp-summary">
      <div><span>Your average rate</span><strong>{formatAnalyticsValue('asp', model.value)}</strong></div>
      <div><span>Competitor median</span><strong>{formatAnalyticsValue('asp', model.aspDays[0].competitorMedian)}</strong></div>
      <div><span>Best rate day</span><strong>{bestDay.day} · {formatAnalyticsValue('asp', bestDay.property)}</strong></div>
      <div><span>Best ranking</span><strong>#{bestRank} of 5</strong></div>
    </div>
  );
}

export function AspPanel({ model, weekIndex, weekCount, csvBusy, onWeekChange, onDownload }) {
  return (
    <div className="an-section-body">
      <header className="an-section-head">
        <div>
          <span className="an-eyebrow">Performance overview</span>
          <h3>{model.section.title}</h3>
          <p>{model.section.description}</p>
        </div>
        <button type="button" className="btn btn-dark btn-sm" disabled={csvBusy} onClick={onDownload}>
          <Download size={14} aria-hidden="true" />{csvBusy ? 'Preparing…' : 'Download ASP Data'}
        </button>
      </header>

      <section className="an-asp-card">
        <div className="an-card-head">
          <div>
            <h3>Day-wise competitor rates</h3>
            <p>{model.aspWeek.label} · property rates against the competitor median.</p>
          </div>
          <div className="an-week-nav" aria-label="ASP week navigation">
            <button type="button" className="btn btn-light btn-sm" disabled={weekIndex <= 0} onClick={() => onWeekChange(weekIndex - 1)}>
              <ChevronLeft size={15} aria-hidden="true" />Previous 7 days
            </button>
            <button type="button" className="btn btn-light btn-sm" disabled={weekIndex >= weekCount - 1} onClick={() => onWeekChange(weekIndex + 1)}>
              Next 7 days<ChevronRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>

        <AspSummary model={model} />

        <div className="an-table-scroll">
          <table className="an-asp-table">
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col">Date</th>
                <th scope="col">Your rate</th>
                <th scope="col">Competitor median</th>
                <th scope="col">Competitor prices</th>
                <th scope="col">Rank</th>
              </tr>
            </thead>
            <tbody>
              {model.aspDays.map((day) => (
                <tr key={day.date}>
                  <th scope="row" data-label="Day">{day.day}</th>
                  <td data-label="Date">{day.date}</td>
                  <td data-label="Your rate"><strong>{formatAnalyticsValue('asp', day.property)}</strong></td>
                  <td data-label="Competitor median">
                    <span className="an-compare-line"><i style={{ width: `${Math.min(100, (day.competitorMedian / day.property) * 100)}%` }} /></span>
                    {formatAnalyticsValue('asp', day.competitorMedian)}
                  </td>
                  <td data-label="Competitor prices">
                    <div className="an-competitor-prices">
                      {day.competitors.map((competitor) => (
                        <span key={competitor.name}>{competitor.name}<strong>{formatAnalyticsValue('asp', competitor.price)}</strong></span>
                      ))}
                    </div>
                  </td>
                  <td data-label="Rank"><span className="an-rank">#{day.rank}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="an-asp-note"><TrendingUp size={14} aria-hidden="true" />Ranking is based on daily room rates across your property and the four tracked competitor hotels.</p>
      </section>
    </div>
  );
}
