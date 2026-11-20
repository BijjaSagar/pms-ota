// Partner Hub modules that aren't built yet (/list-property/module/:moduleId) -> "Coming soon".
import { Navigate, useParams } from 'react-router-dom';
import { Hammer } from 'lucide-react';
import { PartnerShell } from '../components/partner/PartnerShell.jsx';
import { moduleById } from '../components/partner/partnerModules.js';
import { PARTNER_PATHS } from '../components/partner/paths.js';
import '../styles/partner.css';

export default function PartnerModuleSoonPage() {
  const { moduleId } = useParams();
  const module = moduleById(moduleId);
  // Unknown id, or a module that already has a real page -> go to the right place.
  if (!module) return <Navigate to={PARTNER_PATHS.properties} replace />;
  if (!module.soon) return <Navigate to={module.href} replace />;

  return (
    <PartnerShell title={module.label}>
      <div className="pp-head">
        <h1 className="pp-title">{module.label}</h1>
      </div>
      <section className="pp-soon" aria-labelledby="pm-soon-title">
        <span className="pp-soon-icon"><Hammer size={28} aria-hidden="true" /></span>
        <h2 id="pm-soon-title" className="pp-soon-title">Coming soon</h2>
      </section>
    </PartnerShell>
  );
}
