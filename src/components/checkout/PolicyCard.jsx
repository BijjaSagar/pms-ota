// "Good to know before you book" — TriponX sand card with pms-ota's policies; full rules in a modal.
import { Info } from 'lucide-react';
import { useState } from 'react';
import { cancellationDeadline, formatDate } from '../../lib/utils/date.js';
import { Modal } from '../Layout.jsx';
import '../../styles/checkout.css';

export function PolicyCard({ hotel, room, checkIn }) {
  const [open, setOpen] = useState(false);
  const { policies } = hotel;
  const deadline = room.refundable ? cancellationDeadline(checkIn, policies.cancellation) : '';
  const items = [
    `Check-in ${policies.checkIn.toLowerCase()}, check-out ${policies.checkOut.toLowerCase()}.`,
    room.refundable
      ? `Free cancellation until ${deadline ? formatDate(deadline, 'medium') : 'the policy deadline'}. ${policies.cancellation}`
      : 'This rate is non-refundable: it can’t be cancelled or refunded after booking.',
    policies.children,
    policies.pets,
  ];

  return (
    <section className="good-to-know">
      <div className="co-card-head mb-12">
        <h2 className="h-card-lg co-title">Good to know before you book</h2>
        <button type="button" className="btn-mini co-mini" onClick={() => setOpen(true)}>House rules &amp; policy</button>
      </div>
      <div className="grid-auto-260 gap-14">
        {items.map((t) => <p key={t} className="gtk-item"><Info size={18} color="#8A5A33" aria-hidden="true" />{t}</p>)}
      </div>

      {open && (
        <Modal title={`${hotel.name} — good to know`} onClose={() => setOpen(false)} wide>
          <dl className="co-policy-dl">
            {[
              ['Check-in', policies.checkIn], ['Check-out', policies.checkOut], ['Cancellation', policies.cancellation],
              ['Children', policies.children], ['Pets', policies.pets],
              ['Payment', 'Major cards and PayPal accepted. No card is charged in this demo.'],
            ].map(([k, v]) => (
              <div key={k}><dt className="mini-label">{k.toUpperCase()}</dt><dd>{v}</dd></div>
            ))}
          </dl>
          <p className="mini-label co-mt">HOUSE RULES</p>
          <div className="tag-row co-mt-sm">{policies.houseRules.map((r) => <span key={r} className="tag">{r}</span>)}</div>
          <p className="muted-sm co-mt">{hotel.description} Photo ID and a valid payment method may be requested at arrival.</p>
        </Modal>
      )}
    </section>
  );
}
