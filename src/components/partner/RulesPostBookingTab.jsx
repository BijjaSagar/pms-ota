import { Check, Save, UserRoundPen } from 'lucide-react';
import { YES_NO_OPTIONS } from '../../lib/data/rulesPolicies.js';

export default function RulesPostBookingTab({ value, onChange, onSave, onDiscard, saving, dirty }) {
  return (
    <div className="rpw-tab-panel">
      <section className="rpw-card">
        <div className="rpw-card-head">
          <div>
            <h3>Guest Name Change</h3>
            <p>Choose whether guests can update the name on a confirmed booking.</p>
          </div>
          <span className="rpw-status is-on">Post booking</span>
        </div>
        <div className="rpw-post-booking-grid">
          <div className="rpw-post-booking-visual"><UserRoundPen size={28} aria-hidden="true" /><strong>Booking name update</strong><span>Guests can correct the lead guest name without cancelling the reservation.</span></div>
          <div className="rpw-post-booking-choice">
            <span>Allow guest to change name?</span>
            <div className="rpw-yesno is-large" role="group">
              {YES_NO_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={value === option.value ? 'is-selected' : ''}
                  aria-pressed={value === option.value}
                  onClick={() => onChange(option.value)}
                >
                  {value === option.value ? <Check size={14} aria-hidden="true" /> : null}
                  {option.label}
                </button>
              ))}
            </div>
            <p className="rpw-muted">Applies to bookings made from now on.</p>
          </div>
        </div>
        <div className="rpw-save-bar">{dirty ? <button type="button" className="rpw-btn" onClick={onDiscard} disabled={saving}>Discard changes</button> : null}<button type="button" className="rpw-btn is-primary" onClick={onSave} disabled={saving || !dirty}><Save size={15} aria-hidden="true" />{saving ? 'Saving…' : dirty ? 'Save post booking policy' : 'Saved'}</button></div>
      </section>
    </div>
  );
}
