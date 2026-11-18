// Empty state for checkout / payment / confirmation (pms-ota behaviour) in TriponX's calm style.
import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/checkout.css';

export function EmptyBookingState({
  title = 'Your stay is waiting to be chosen',
  description = 'Choose a hotel and a room first, and we will keep everything ready for you here.',
}) {
  return (
    <div className="confirm co-empty">
      <div className="confirm-icon"><Compass size={34} color="#3F6B5C" aria-hidden="true" /></div>
      <h1 className="h1-lg">{title}</h1>
      <p className="lead center-text">{description}</p>
      <div className="row-gap-10 wrap justify-center">
        <Link to="/hotels" className="btn btn-primary btn-lg">Explore stays</Link>
        <Link to="/" className="btn btn-outline btn-lg">Back to home</Link>
      </div>
    </div>
  );
}
