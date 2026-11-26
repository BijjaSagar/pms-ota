import { useEffect, useState } from 'react';
import { ExternalLink, Info, Send } from 'lucide-react';
import { PortalModal } from '../profile/PortalModal.jsx';
import { getReviewQrDataUrl } from '../../lib/utils/reviewQr.js';

function useQrDataUrl(value) {
  const [src, setSrc] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setSrc('');
    setError('');
    getReviewQrDataUrl(value)
      .then((url) => { if (active) setSrc(url); })
      .catch(() => { if (active) setError('QR code could not be generated.'); });
    return () => { active = false; };
  }, [value]);

  return { src, error };
}

export function QrCodeModal({ url, onClose }) {
  const { src, error } = useQrDataUrl(url);

  return (
    <PortalModal title="Get MMT Review QR Code" onClose={onClose}>
      <div className="rr-modal">
        <div className="rr-qr-layout">
          <div className="rr-qr-frame">
            {src ? <img src={src} alt="QR code for the MakeMyTrip review collection link" /> : <span>{error || 'Generating QR…'}</span>}
          </div>
          <div className="rr-qr-copy">
            <h3>Collect reviews from guests</h3>
            <p>Show this QR code at the front desk or include it in a post-stay message so guests can submit a MakeMyTrip review.</p>
            <p className="rr-qr-url">{url}</p>
            <a className="btn btn-light btn-sm" href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={14} aria-hidden="true" />Open review link
            </a>
          </div>
        </div>
      </div>
    </PortalModal>
  );
}

export function RatingsInfoModal({ points, onClose }) {
  return (
    <PortalModal title="Know How Ratings and Reviews Work" onClose={onClose}>
      <div className="rr-modal">
        <div className="rr-info-intro">
          <Info size={18} aria-hidden="true" />
          <p>Ratings and reviews are grouped by OTA so you can compare guest sentiment channel by channel.</p>
        </div>
        <ul className="rr-info-list">
          {points.map((point) => <li key={point}>{point}</li>)}
        </ul>
      </div>
    </PortalModal>
  );
}

export function ReplyModal({ review, onClose, onSubmit }) {
  const [text, setText] = useState(review.replyText || '');
  const canSend = text.trim().length > 0;

  const send = () => {
    if (!canSend) return;
    onSubmit(review.id, text.trim());
  };

  return (
    <PortalModal title={review.replied ? 'Edit Reply' : 'Reply to Guest'} onClose={onClose}>
      <div className="rr-modal">
        <div className="rr-reply-context">
          <span className={`rr-brand is-${review.platform}`}>{review.platform === 'makemytrip' ? 'MMT' : 'GB'}</span>
          <div>
            <strong>{review.guestName}</strong>
            <span>{review.title} · {review.bookingId}</span>
          </div>
        </div>
        <blockquote>{review.feedback}</blockquote>
        <label className="rr-reply-field">
          <span>Your response</span>
          <textarea rows="5" value={text} placeholder="Thank the guest and share any action you are taking…"
            onChange={(event) => setText(event.target.value)} />
        </label>
        <div className="rr-modal-actions">
          <button type="button" className="btn btn-light btn-sm" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-dark btn-sm" disabled={!canSend} onClick={send}>
            <Send size={14} aria-hidden="true" />Save Reply
          </button>
        </div>
      </div>
    </PortalModal>
  );
}
