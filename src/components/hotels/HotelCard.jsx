// Ported from pms-ota/src/components/hotels/HotelCard.tsx — same props and behaviour, TriponX styling.
import { CircleDollarSign, Clock3, Clock9, Heart, Image, MapPin, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../../lib/context/useWishlist.js';
import { formatCurrency } from '../../lib/utils/pricing.js';
import { Badge, Stars } from '../ui/Badge.jsx';
import '../../styles/hotels.css';

function getBookingHighlights(hotel) {
  const hotelNumber = Number(hotel.id.replace('hotel-', ''));
  switch (hotelNumber % 3) {
    case 1:
      return [{ label: 'Guaranteed early check-in', Icon: Clock3 }];
    case 2:
      return [{ label: 'Guaranteed late checkout', Icon: Clock9 }];
    default:
      return [
        { label: 'Book with ₹0 payment', Icon: CircleDollarSign },
        { label: 'Guaranteed early check-in', Icon: Clock3 },
      ];
  }
}

function getCardPrice(hotel) {
  const originalPrice = Math.ceil((hotel.pricePerNight * 1.1) / 5) * 5;
  const taxesAndFees = Math.round(hotel.pricePerNight * 0.05);
  return { originalPrice, taxesAndFees };
}

export function HotelCard({ hotel, className = '', style }) {
  const { isSaved, toggleWishlist } = useWishlist();
  const saved = isSaved(hotel.id);
  const price = getCardPrice(hotel);

  return (
    <article style={style} className={`hcard ${className}`}>
      <div className="hcard-media">
        <Link to={`/hotels/${hotel.slug}`} aria-label={`View ${hotel.name}`} className="hcard-img-link">
          <img src={hotel.images[0]} alt={`${hotel.name} in ${hotel.location.city}`} loading="lazy" decoding="async" className="hcard-img" />
        </Link>
        <div className="hcard-top">
          <Badge tone="image">{hotel.propertyType}</Badge>
          <button
            type="button"
            onClick={() => toggleWishlist(hotel.id)}
            aria-pressed={saved}
            aria-label={saved ? `Remove ${hotel.name} from saved stays` : `Save ${hotel.name}`}
            className={`hcard-heart ${saved ? 'is-saved' : ''}`}
          >
            <Heart size={16} />
          </button>
        </div>
        <Link to={`/hotels/${hotel.slug}/photos`} onClick={(e) => e.stopPropagation()} className="hcard-media-link"
          aria-label={`View photos and videos for ${hotel.name}`}>
          <Image size={14} aria-hidden="true" />10 photos<span className="hcard-dot">·</span><Video size={14} aria-hidden="true" />9 videos
        </Link>
      </div>

      <div className="hcard-body">
        <div className="hcard-row">
          <p className="hcard-place"><MapPin size={14} aria-hidden="true" /><span>{hotel.location.city}, {hotel.location.country}</span></p>
          <Stars count={hotel.stars} />
        </div>
        <Link to={`/hotels/${hotel.slug}`} className="hcard-name-link">
          <h3 className="hcard-name">{hotel.name}</h3>
        </Link>
        <div className="hcard-highlights">
          {getBookingHighlights(hotel).map(({ label, Icon }) => (
            <p key={label}><Icon size={14} aria-hidden="true" />{label}</p>
          ))}
        </div>

        <div className="hcard-foot">
          <p className="hcard-rating">
            <span className="score">{hotel.rating.toFixed(1)}</span>
            <span className="muted-xs">({hotel.reviewCount} reviews)</span>
          </p>
          <div className="hcard-price">
            <p className="hcard-was">{formatCurrency(price.originalPrice)}</p>
            <p className="hcard-now">{formatCurrency(hotel.pricePerNight)}</p>
            <p className="muted-xs">+ {formatCurrency(price.taxesAndFees)} taxes &amp; fees</p>
            <p className="muted-xs">Per Night</p>
          </div>
        </div>
      </div>
    </article>
  );
}
