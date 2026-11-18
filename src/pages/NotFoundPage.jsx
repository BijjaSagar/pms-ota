// 404 — content from pms-ota (NotFoundPage.tsx); TriponX glass card. Self-contained, no props.
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../styles/account.css';

export default function NotFoundPage() {
  return (
    <div className="container nf-wrap">
      <div className="card nf-box">
        <p className="nf-code">404</p>
        <h1 className="h1-lg mt-12">This page has checked out</h1>
        <p className="muted-sm mt-12">The page you are looking for has moved on. The good news: there are plenty of beautiful stays still waiting.</p>
        <div className="nf-actions">
          <Link to="/hotels" className="btn btn-primary">Explore stays</Link>
          <Link to="/" className="btn btn-outline"><ArrowLeft size={16} aria-hidden="true" />Back home</Link>
        </div>
      </div>
    </div>
  );
}

export { NotFoundPage };
