// Wishlist — features & data from pms-ota (WishlistPage.tsx); TriponX layout (list tiles + swipeable rows).
import { ArrowRight, Heart, Plus, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { HotelCard } from '../components/hotels/HotelCard.jsx';
import { TextField } from '../components/Layout.jsx';
import { PortalModal as Modal } from '../components/profile/PortalModal.jsx';
import { useWishlist } from '../lib/context/useWishlist.js';
import { useCatalogue } from '../lib/context/useCatalogue.js';
import { formatCurrency } from '../lib/utils/pricing.js';
import '../styles/account.css';

function ListTile({ wishlist, onDelete }) {
  // Saved stays can be approved partner properties or demo hotels.
  const { getHotelById: byId } = useCatalogue();
  const items = wishlist.hotelIds.map(byId).filter(Boolean);
  const pics = items.slice(0, 3);
  return (
    <article className="card list-tile">
      <div className={`mosaic ${pics.length === 1 ? 'one' : ''}`} aria-hidden="true">
        {pics.length > 0
          ? pics.map((h) => <img key={h.id} src={h.images[0]} alt="" loading="lazy" />)
          : <span className="mosaic-empty"><Heart size={16} />Nothing here yet</span>}
      </div>
      <div className="list-tile-head">
        <div style={{ minWidth: 0 }}>
          <p className="mini-label">WISHLIST</p>
          <h3 className="list-tile-name">{wishlist.name}</h3>
        </div>
        <div className="row-gap-8 center">
          <span className="fact-pill">{items.length} stay{items.length === 1 ? '' : 's'}</span>
          <button type="button" className="pill-btn danger" aria-label={`Delete ${wishlist.name} wishlist`} onClick={() => onDelete(wishlist)}>
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="app-list">
        {items.length > 0 ? items.slice(0, 3).map((hotel) => (
          <Link key={hotel.id} to={`/hotels/${hotel.slug}`} className="app-row">
            <div className="app-row-main">
              <p>{hotel.name}</p>
              <p className="muted-xs">{hotel.location.city}, {hotel.location.country}</p>
            </div>
            <span className="app-row-end">{formatCurrency(hotel.pricePerNight)}</span>
          </Link>
        )) : <p className="app-row muted-sm">No stays in this wishlist yet.</p>}
      </div>
    </article>
  );
}

export default function WishlistPage() {
  const { ids, count, clearWishlist, wishlists, createWishlist, deleteWishlist } = useWishlist();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wishlistToDelete, setWishlistToDelete] = useState(null);
  const [name, setName] = useState('');
  const { getHotelById: byId } = useCatalogue();

  const savedHotels = ids.map(byId).filter(Boolean);

  const closeCreate = useCallback(() => { setName(''); setIsModalOpen(false); }, []);
  const closeDelete = useCallback(() => setWishlistToDelete(null), []);
  const handleCreateWishlist = (event) => {
    event?.preventDefault();
    const created = createWishlist(name);
    if (created) closeCreate();
  };
  const handleDeleteWishlist = () => {
    if (!wishlistToDelete) return;
    deleteWishlist(wishlistToDelete.id);
    setWishlistToDelete(null);
  };

  return (
    <div className="container acct-page">
      <div className="acct-head">
        <div>
          <span className="acct-kicker"><Heart size={13} aria-hidden="true" />Your shortlist</span>
          <h1 className="h1-lg">Wishlist</h1>
          <p className="section-sub">{count === 0 ? 'No stays saved yet' : `${count} ${count === 1 ? 'stay' : 'stays'} saved`}</p>
        </div>
        <div className="row-gap-8 wrap">
          <button type="button" className="pill-btn dark" onClick={() => setIsModalOpen(true)}><Plus size={14} aria-hidden="true" />Create new wishlist</button>
          {count > 0 ? <button type="button" className="pill-btn" onClick={clearWishlist}><Trash2 size={14} aria-hidden="true" />Clear all</button> : null}
        </div>
      </div>

      {wishlists.length > 0 ? (
        <section className="acct-section" aria-label="Your wishlists" style={{ marginTop: 0 }}>
          <div className="acct-section-head"><h2 className="h2-sm">Your lists</h2><span className="muted-sm">{wishlists.length} list{wishlists.length === 1 ? '' : 's'}</span></div>
          <div className="rail-grid wl-lists">
            {wishlists.map((w) => <ListTile key={w.id} wishlist={w} onDelete={setWishlistToDelete} />)}
          </div>
        </section>
      ) : null}

      {savedHotels.length > 0 ? (
        <section className="acct-section" aria-label="Saved stays">
          <div className="acct-section-head"><h2 className="h2-sm">Saved stays</h2></div>
          <div className="rail-grid wl-grid">
            {savedHotels.map((hotel, index) => (
              <HotelCard key={hotel.id} hotel={hotel} style={{ animationDelay: `${index * 60}ms` }} />
            ))}
          </div>
          <div className="dark-band">
            <div>
              <p>Still deciding?</p>
              <p className="muted-sm">Explore the rest of the collection and add a few more stays to the shortlist.</p>
            </div>
            <Link to="/hotels" className="btn btn-light">Browse all stays<ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
        </section>
      ) : (
        <div className="card acct-empty">
          <span className="acct-empty-icon"><img src="/wishlist-heart.png" alt="" /></span>
          <h2 className="h2-sm">Nothing saved yet</h2>
          <p className="muted-sm mt-12">Save stays to your wishlist.</p>
          <Link to="/hotels" className="btn btn-primary btn-block">Explore stays</Link>
          <Link to="/" className="link-arrow">Back to home</Link>
        </div>
      )}

      {isModalOpen ? (
        <Modal title="Create a wishlist" onClose={closeCreate}>
          <p className="modal-text">Give your list a name. For example: Goa, Kerala or Family escape.</p>
          <form onSubmit={handleCreateWishlist} className="col-gap-14">
            <TextField label="Wishlist name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Mumbai" />
            <button type="submit" className="btn btn-primary btn-block" disabled={!name.trim()}>Create wishlist</button>
          </form>
        </Modal>
      ) : null}

      {wishlistToDelete ? (
        <Modal title="Delete wishlist?" onClose={closeDelete}>
          <p className="modal-text">Are you sure you want to delete “{wishlistToDelete.name}”? This action cannot be undone.</p>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={closeDelete}>Cancel</button>
            <button type="button" className="btn btn-danger" onClick={handleDeleteWishlist}>Delete</button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
