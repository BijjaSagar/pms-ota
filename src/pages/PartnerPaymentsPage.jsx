import { PartnerShell } from '../components/partner/PartnerShell.jsx';
import { PartnerPaymentsDashboard } from '../components/partner/PartnerPaymentsDashboard.jsx';
import '../styles/partner.css';
import '../styles/partner-payments.css';

export default function PartnerPaymentsPage() {
  return <PartnerShell title="Payments"><PartnerPaymentsDashboard /></PartnerShell>;
}
