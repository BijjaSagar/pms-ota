import { useState } from 'react';
import { ChevronDown, ChevronRight, Eye, HelpCircle } from 'lucide-react';

export default function RulesFaqPanel({ faqs, hidden, onToggle, previewChannel, previewText }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <aside className={`rpw-faq ${hidden ? 'is-hidden' : ''}`} aria-label="Rules and policies help">
      <div className="rpw-faq-head">
        <span className="rpw-faq-icon"><HelpCircle size={16} aria-hidden="true" /></span>
        <div>
          <h3>Help &amp; FAQ</h3>
          <p>Answers while you configure this section.</p>
        </div>
        <button type="button" className="rpw-faq-toggle" onClick={onToggle}>{hidden ? 'Show' : 'Hide'}</button>
      </div>

      {hidden ? null : (
        <>
          <div className="rpw-faq-list">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div className={`rpw-faq-item ${isOpen ? 'is-open' : ''}`} key={faq.question}>
                  <button type="button" onClick={() => setOpenIndex(isOpen ? -1 : index)} aria-expanded={isOpen}>
                    <span>{faq.question}</span>
                    {isOpen ? <ChevronDown size={15} aria-hidden="true" /> : <ChevronRight size={15} aria-hidden="true" />}
                  </button>
                  {isOpen ? <p>{faq.answer}</p> : null}
                </div>
              );
            })}
          </div>

          <div className="rpw-channel-preview">
            <span><Eye size={14} aria-hidden="true" />{previewChannel} preview</span>
            <p>{previewText}</p>
          </div>
        </>
      )}
    </aside>
  );
}
