// TriponX reviews: big score, aspect bars, review cards. Content from pms-ota's ReviewList
// (same aspect scores, review titles, stars, guest country, stay type and date).
import { Star } from 'lucide-react';
import '../../styles/hotel-details.css';

const ASPECTS = [
  ['Location', 4.9],
  ['Cleanliness', 5.0],
  ['Service', 4.9],
  ['Value', 4.7],
];

const ratingWord = (r) => (r >= 4.8 ? 'Exceptional' : 'Excellent');

export function ReviewList({ reviews, rating, reviewCount }) {
  // A newly approved property has no guest reviews yet: say so instead of showing scores.
  if (!reviewCount) {
    return (
      <div className="mb-20">
        <h2 className="h2-sm">Guest reviews</h2>
        <p className="section-sub">New on TriponX. Reviews appear here after guests complete a stay.</p>
      </div>
    );
  }
  return (
    <>
      <div className="row-gap-20 center wrap mb-20">
        <div className="big-score">{rating.toFixed(1)}</div>
        <div>
          <h2 className="h2-sm">{ratingWord(rating)}</h2>
          <p className="section-sub">{reviewCount} reviews, all from guests who completed a stay</p>
        </div>
      </div>
      <div className="aspects">
        {ASPECTS.map(([label, v]) => (
          <div key={label}>
            <div className="aspect-head"><span>{label}</span><span>{v.toFixed(1)}</span></div>
            <div className="bar"><div style={{ width: `${(v / 5) * 100}%` }} /></div>
          </div>
        ))}
      </div>
      <div className="grid-auto-280 gap-14">
        {reviews.map((rv) => (
          <figure key={rv.id} className="card review">
            <p className="hd-stars" aria-label={`${rv.rating} out of 5`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} className={i < rv.rating ? 'hd-star' : 'hd-star-off'} aria-hidden="true" />
              ))}
            </p>
            <p className="h-card">{rv.title}</p>
            <blockquote>{rv.body}</blockquote>
            <figcaption><strong>{rv.name}</strong> <span className="muted">· {rv.country} · {rv.stayType} · {rv.date}</span></figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
