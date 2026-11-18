// All photos of a hotel — TriponX layout; every photo opens the lightbox.
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from '../components/Icons.jsx';
import { Gallery } from '../components/hotels/Gallery.jsx';
import { getHotelBySlug } from '../lib/data/hotels.js';
import NotFoundPage from './NotFoundPage.jsx';
import '../styles/hotel-details.css';

export default function HotelGalleryPage() {
  const { slug } = useParams();
  const hotel = slug ? getHotelBySlug(slug) : undefined;
  if (!hotel) return <NotFoundPage />;

  return (
    <div className="container stay-wrap">
      <div className="section-head">
        <div>
          <p className="crumbs"><Link to={`/hotels/${hotel.slug}`}>{hotel.name}</Link> / Photos</p>
          <h1 className="display-md">{hotel.name}</h1>
          <p className="section-sub">{hotel.images.length} photos · {hotel.location.city}, {hotel.location.country}</p>
        </div>
        <Link to={`/hotels/${hotel.slug}`} className="btn btn-outline btn-sm"><ArrowLeft size={16} width={2} />Back to hotel</Link>
      </div>
      <Gallery images={hotel.images} name={hotel.name} variant="all" />
    </div>
  );
}
