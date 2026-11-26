import { useState } from 'react';
import { ChevronLeft, ChevronRight, Filter, MessageSquare, RotateCcw, Search, Star } from 'lucide-react';
import { ratingTone } from '../../lib/data/ratingsReviews.js';

const dateFormatter = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const formatDate = (iso) => dateFormatter.format(new Date(`${iso}T12:00:00`));

const brandName = (id) => (id === 'makemytrip' ? 'MakeMyTrip' : 'Goibibo');

function RatingMark({ value }) {
  return (
    <span className={`rr-rating-mark is-${ratingTone(value)}`}>
      <Star size={13} fill="currentColor" aria-hidden="true" />{value.toFixed(1)}<small>/5</small>
    </span>
  );
}

function SelectField({ label, value, options, onChange }) {
  const entries = options.map((option) => (typeof option === 'string' ? { value: option, label: option } : option));
  return (
    <label className="rr-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {entries.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}
      </select>
    </label>
  );
}

function KeywordGroups({ groups, selectedKeywords, expandedGroups, onToggleKeyword, onToggleGroup }) {
  return (
    <div className="rr-keyword-groups">
      {groups.map((group) => {
        const expanded = Boolean(expandedGroups[group.id]);
        const items = expanded ? [...group.items, ...group.extra] : group.items;
        return (
          <section className="rr-keyword-group" key={group.id} aria-label={group.label}>
            <h4>{group.label}</h4>
            <div className="rr-keyword-chips">
              {items.map((keyword) => {
                const key = `${group.id}:${keyword.label}`;
                const selected = selectedKeywords.includes(key);
                return (
                  <button type="button" key={key} className={`rr-keyword-chip ${selected ? 'is-selected' : ''}`}
                    aria-pressed={selected} onClick={() => onToggleKeyword(key)}>
                    {keyword.label}<small>{keyword.count}</small>
                  </button>
                );
              })}
              <button type="button" className="rr-text-btn rr-keyword-more" aria-expanded={expanded} onClick={() => onToggleGroup(group.id)}>
                {expanded ? 'Show Less' : `+${group.extraCount} More`}
              </button>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ReviewCard({ review, onReply }) {
  const [expanded, setExpanded] = useState(false);
  const long = review.feedback.length > 130;
  const feedback = long && !expanded ? `${review.feedback.slice(0, 130)}…` : review.feedback;

  return (
    <article className="rr-review-card">
      <header className="rr-review-top">
        <div className="rr-review-heading">
          <span className={`rr-brand is-${review.platform}`}>{review.platform === 'makemytrip' ? 'MMT' : 'GB'}</span>
          <div>
            <h4>{review.title}</h4>
            <span>{brandName(review.platform)}</span>
          </div>
        </div>
        <RatingMark value={review.rating} />
      </header>

      <dl className="rr-review-meta">
        <div><dt>Guest</dt><dd>{review.guestName}</dd></div>
        <div><dt>Stay</dt><dd>{review.stayDuration}</dd></div>
        <div><dt>Guest type</dt><dd>{review.guestType}</dd></div>
        <div><dt>Room</dt><dd>{review.roomName}</dd></div>
        <div><dt>Posted on</dt><dd>{formatDate(review.postedOn)}</dd></div>
        <div><dt>Booking ID</dt><dd className="ref-code">{review.bookingId}</dd></div>
      </dl>

      <p className="rr-review-feedback">{feedback}</p>
      {long && (
        <button type="button" className="rr-text-btn" aria-expanded={expanded} onClick={() => setExpanded((open) => !open)}>
          {expanded ? 'Read Less' : 'Read More'}
        </button>
      )}

      {review.keywords.length > 0 && (
        <div className="rr-review-keywords">
          {review.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}
        </div>
      )}

      {review.replied && (
        <div className="rr-reply-note">
          <span>Your reply</span>
          <p>{review.replyText}</p>
        </div>
      )}

      <div className="rr-review-actions">
        <button type="button" className="btn btn-light btn-sm" onClick={() => onReply(review)}>
          <MessageSquare size={14} aria-hidden="true" />{review.replied ? 'Edit Reply' : 'Reply to Guest'}
        </button>
        <span className={`rr-reply-state ${review.replied ? 'is-replied' : ''}`}>{review.replied ? 'Replied' : 'Unreplied'}</span>
      </div>
    </article>
  );
}

export function ReviewsManagement({
  totalReviews,
  query,
  filters,
  selectedKeywords,
  expandedGroups,
  keywordGroups,
  page,
  pages,
  reviews,
  options,
  onQueryChange,
  onFilterChange,
  onToggleKeyword,
  onToggleGroup,
  onClearAll,
  onPageChange,
  onReply,
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <section className="rr-management" aria-label="All ratings and reviews">
      <header className="rr-mgmt-head">
        <div>
          <span className="rr-eyebrow">Review management</span>
          <h3>All Ratings &amp; Reviews</h3>
          <p>Search, filter and respond to guest feedback from both OTA channels.</p>
        </div>
        <span className="rr-total-chip">Total Reviews: <strong>{totalReviews}</strong></span>
      </header>

      <div className={`rr-manage-grid ${filtersOpen ? 'is-open' : ''}`}>
        <aside className="rr-filter-panel" aria-label="Review filters">
          <button type="button" className="rr-filter-toggle" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)}>
            <Filter size={16} aria-hidden="true" />{filtersOpen ? 'Hide filters' : 'Show filters'}
          </button>

          <div className="rr-filter-body">
            <label className="rr-search">
              <Search size={16} aria-hidden="true" />
              <span className="sr-only">Search by booking ID</span>
              <input type="search" value={query} placeholder="Search by Booking ID" onChange={(event) => onQueryChange(event.target.value)} />
            </label>

            <div className="rr-filter-grid">
              <SelectField label="Posted On" value={filters.postedOn} options={options.postedOn} onChange={(value) => onFilterChange('postedOn', value)} />
              <SelectField label="Rating" value={filters.rating} options={options.rating} onChange={(value) => onFilterChange('rating', value)} />
              <SelectField label="Brand" value={filters.brand} options={options.brand} onChange={(value) => onFilterChange('brand', value)} />
              <SelectField label="Type of Reply" value={filters.reply} options={options.reply} onChange={(value) => onFilterChange('reply', value)} />
              <SelectField label="Guest Type" value={filters.guestType} options={options.guestType} onChange={(value) => onFilterChange('guestType', value)} />
              <SelectField label="Room Name" value={filters.roomName} options={options.roomName} onChange={(value) => onFilterChange('roomName', value)} />
            </div>

            <button type="button" className="rr-clear-btn" onClick={onClearAll}>
              <RotateCcw size={14} aria-hidden="true" />Clear All
            </button>

            <KeywordGroups groups={keywordGroups} selectedKeywords={selectedKeywords} expandedGroups={expandedGroups}
              onToggleKeyword={onToggleKeyword} onToggleGroup={onToggleGroup} />
          </div>
        </aside>

        <div className="rr-results">
          <div className="rr-results-head">
            <strong>{reviews.length} review{reviews.length === 1 ? '' : 's'} on this page</strong>
            <span>Page {page} of {pages}</span>
          </div>

          {reviews.length === 0 ? (
            <div className="rr-empty">No reviews match the current filters. Try clearing them.</div>
          ) : (
            <div className="rr-review-list">
              {reviews.map((review) => <ReviewCard key={review.id} review={review} onReply={onReply} />)}
            </div>
          )}

          <nav className="rr-pagination" aria-label="Review pages">
            <button type="button" className="btn btn-light btn-sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft size={15} aria-hidden="true" />Previous
            </button>
            <span>{page} / {pages}</span>
            <button type="button" className="btn btn-light btn-sm" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
              Next<ChevronRight size={15} aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </section>
  );
}
