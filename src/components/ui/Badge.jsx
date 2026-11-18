// Ported from pms-ota/src/components/ui/Badge.tsx — same API, TriponX styling (see .tx-badge in styles.css).
import { Star } from 'lucide-react';

// tone: 'neutral' | 'success' | 'accent' | 'dark' | 'image' | 'image-dark'
export function Badge({ children, tone = 'neutral', className = '' }) {
  return <span className={`tx-badge tx-badge-${tone} ${className}`}>{children}</span>;
}

export function Stars({ count = 5, className = '' }) {
  return (
    <span className={`tx-stars ${className}`} aria-label={`${count} star hotel`}>
      {Array.from({ length: count }).map((_, i) => <Star key={i} size={14} aria-hidden="true" />)}
    </span>
  );
}

export function ScoreBadge({ score, reviews, compact = false }) {
  return (
    <div className="tx-score">
      <span className="tx-score-num">{score.toFixed(1)}</span>
      <div className={`tx-score-text ${compact ? 'hide-sm' : ''}`}>
        <p className="tx-score-word">{score >= 4.8 ? 'Exceptional' : 'Excellent'}</p>
        {reviews ? <p className="muted-xs">{reviews} reviews</p> : null}
      </div>
    </div>
  );
}
