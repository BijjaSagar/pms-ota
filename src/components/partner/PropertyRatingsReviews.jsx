import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Info, QrCode } from 'lucide-react';
import { currentPropertyId, propertyDetailsPath } from './paths.js';
import { RatingsOverview } from './RatingsOverview.jsx';
import { ReviewsManagement } from './ReviewsManagement.jsx';
import { QrCodeModal, RatingsInfoModal, ReplyModal } from './RatingsReviewsModals.jsx';
import {
  BRAND_OPTIONS,
  GUEST_TYPE_OPTIONS,
  INITIAL_REVIEW_FILTERS,
  KEYWORD_FILTERS,
  OTA_SUMMARIES,
  POSTED_ON_OPTIONS,
  RATINGS_TOTAL_REVIEWS,
  REVIEW_INFO_POINTS,
  REVIEWS,
  REVIEWS_REPORT_DATE,
  REPLY_OPTIONS,
  RATING_OPTIONS,
  ROOM_NAME_OPTIONS,
} from '../../lib/data/ratingsReviews.js';
import { downloadReviewsPdf } from '../../lib/utils/reviewsPdf.js';
import { getReviewQrDataUrl } from '../../lib/utils/reviewQr.js';
import '../../styles/partner-properties.css';
import '../../styles/partner-reviews.css';

const PAGE_SIZE = 5;
const REPORT_DATE = new Date(`${REVIEWS_REPORT_DATE}T12:00:00`);
const DAY_MS = 24 * 60 * 60 * 1000;

const options = {
  postedOn: POSTED_ON_OPTIONS,
  rating: RATING_OPTIONS,
  brand: BRAND_OPTIONS,
  reply: REPLY_OPTIONS,
  guestType: GUEST_TYPE_OPTIONS,
  roomName: ROOM_NAME_OPTIONS,
};

const labelOf = (entries, value) => entries.find((entry) => entry.value === value)?.label ?? value;

function matchesPostedOn(postedOn, range) {
  if (range === 'all') return true;
  if (range === '2026-11') return postedOn.startsWith('2026-11');
  const days = Number(range);
  if (!Number.isFinite(days)) return true;
  const date = new Date(`${postedOn}T12:00:00`);
  return date >= new Date(REPORT_DATE.getTime() - days * DAY_MS) && date <= REPORT_DATE;
}

function matchesKeywords(review, selectedKeywords) {
  if (selectedKeywords.length === 0) return true;
  return selectedKeywords.some((key) => {
    const divider = key.indexOf(':');
    const brand = key.slice(0, divider);
    const keyword = key.slice(divider + 1);
    return review.platform === brand && review.keywords.includes(keyword);
  });
}

function matchesFilters(review, query, filters, selectedKeywords) {
  const search = query.trim().toLowerCase();
  return (!search || review.bookingId.toLowerCase().includes(search))
    && matchesPostedOn(review.postedOn, filters.postedOn)
    && (filters.rating === 'all' || String(review.rating) === filters.rating)
    && (filters.brand === 'all' || review.platform === filters.brand)
    && (filters.reply === 'all' || (filters.reply === 'replied' ? review.replied : !review.replied))
    && (filters.guestType === 'All guest types' || review.guestType === filters.guestType)
    && (filters.roomName === 'All rooms' || review.roomName === filters.roomName)
    && matchesKeywords(review, selectedKeywords);
}

export function PropertyRatingsReviews({ property }) {
  const { propertyId } = useParams();
  const [reviews, setReviews] = useState(REVIEWS);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(INITIAL_REVIEW_FILTERS);
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [page, setPage] = useState(1);
  const [qrOpen, setQrOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [replyReview, setReplyReview] = useState(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const filteredReviews = useMemo(() => reviews.filter((review) => matchesFilters(review, query, filters, selectedKeywords)),
    [reviews, query, filters, selectedKeywords]);

  const pages = Math.max(1, Math.ceil(filteredReviews.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const pagedReviews = filteredReviews.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const reviewUrl = typeof window === 'undefined' ? '' : `${window.location.origin}${propertyDetailsPath(currentPropertyId(propertyId), 'reviews')}&collect=mmt`;
  const propertyName = property?.propertyName || property?.name || 'this property';

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  const toggleKeyword = (key) => {
    setSelectedKeywords((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
    setPage(1);
  };

  const toggleGroup = (id) => setExpandedGroups((current) => ({ ...current, [id]: !current[id] }));

  const clearAll = () => {
    setQuery('');
    setFilters(INITIAL_REVIEW_FILTERS);
    setSelectedKeywords([]);
    setExpandedGroups({});
    setPage(1);
  };

  const saveReply = (reviewId, replyText) => {
    setReviews((current) => current.map((review) => review.id === reviewId ? { ...review, replied: true, replyText } : review));
    setReplyReview(null);
  };

  const pdfFilters = {
    Search: query.trim() || 'All booking IDs',
    'Posted On': labelOf(POSTED_ON_OPTIONS, filters.postedOn),
    Rating: labelOf(RATING_OPTIONS, filters.rating),
    Brand: labelOf(BRAND_OPTIONS, filters.brand),
    'Type of Reply': labelOf(REPLY_OPTIONS, filters.reply),
    'Guest Type': filters.guestType,
    'Room Name': filters.roomName,
    Keywords: selectedKeywords.map((key) => key.slice(key.indexOf(':') + 1)).join(', ') || 'All keywords',
  };

  const convertToPdf = async () => {
    setPdfBusy(true);
    try {
      let qrDataUrl = '';
      try { qrDataUrl = await getReviewQrDataUrl(reviewUrl); } catch { qrDataUrl = ''; }
      await downloadReviewsPdf({
        propertyName,
        summaries: OTA_SUMMARIES,
        totalReviews: RATINGS_TOTAL_REVIEWS,
        filters: pdfFilters,
        reviews: filteredReviews,
        qrDataUrl,
      });
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <div className="rr-page">
      <header className="rr-head">
        <div>
          <span className="rr-eyebrow">Reputation management</span>
          <h2 className="rr-title">Ratings &amp; Reviews</h2>
          <p className="rr-sub">All ratings and reviews received by your property.</p>
        </div>
        <div className="rr-head-actions">
          <button type="button" className="btn btn-light btn-sm" onClick={() => setQrOpen(true)}>
            <QrCode size={14} aria-hidden="true" />Get MMT Review QR Code
          </button>
          <button type="button" className="btn btn-light btn-sm" onClick={() => setInfoOpen(true)}>
            <Info size={14} aria-hidden="true" />Know How Ratings and Reviews Work
          </button>
          <button type="button" className="btn btn-dark btn-sm" disabled={pdfBusy} aria-busy={pdfBusy} onClick={convertToPdf}>
            <Download size={14} aria-hidden="true" />{pdfBusy ? 'Preparing…' : 'Convert to PDF'}
          </button>
        </div>
      </header>

      <RatingsOverview summaries={OTA_SUMMARIES} />

      <ReviewsManagement
        totalReviews={RATINGS_TOTAL_REVIEWS}
        query={query}
        filters={filters}
        selectedKeywords={selectedKeywords}
        expandedGroups={expandedGroups}
        keywordGroups={KEYWORD_FILTERS}
        page={safePage}
        pages={pages}
        reviews={pagedReviews}
        options={options}
        onQueryChange={(value) => { setQuery(value); setPage(1); }}
        onFilterChange={updateFilter}
        onToggleKeyword={toggleKeyword}
        onToggleGroup={toggleGroup}
        onClearAll={clearAll}
        onPageChange={setPage}
        onReply={setReplyReview}
      />

      {qrOpen && <QrCodeModal url={reviewUrl} onClose={() => setQrOpen(false)} />}
      {infoOpen && <RatingsInfoModal points={REVIEW_INFO_POINTS} onClose={() => setInfoOpen(false)} />}
      {replyReview && <ReplyModal review={replyReview} onClose={() => setReplyReview(null)} onSubmit={saveReply} />}
    </div>
  );
}
