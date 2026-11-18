// Section wrapper (from pms-ota SectionCard.tsx) as a TriponX glass card.
export function SectionCard({ title, description, action, children, className = '' }) {
  return (
    <section className={`card sec-card ${className}`}>
      <div className="sec-head">
        <div>
          <h2 className="sec-title">{title}</h2>
          {description ? <p className="sec-desc">{description}</p> : null}
        </div>
        {action}
      </div>
      <div>{children}</div>
    </section>
  );
}
