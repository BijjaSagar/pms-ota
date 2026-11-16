import { ArrowRight, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HotelCard } from '../components/hotels/HotelCard'
import { buttonStyles } from '../components/ui/buttonStyles'
import { Modal } from '../components/ui/Modal'
import { useWishlist } from '../context/useWishlist'
import type { WishlistItem } from '../context/wishlist-context'
import { hotels } from '../data/hotels'

export function WishlistPage() {
  const { ids, count, clearWishlist, wishlists, createWishlist, deleteWishlist } = useWishlist()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [wishlistToDelete, setWishlistToDelete] = useState<WishlistItem | null>(null)
  const [name, setName] = useState('')

  const savedHotels = ids
    .map((id) => hotels.find((hotel) => hotel.id === id))
    .filter((hotel): hotel is (typeof hotels)[number] => Boolean(hotel))

  const handleCreateWishlist = () => {
    const created = createWishlist(name)
    if (created) {
      setName('')
      setIsModalOpen(false)
    }
  }

  const handleDeleteWishlist = () => {
    if (!wishlistToDelete) return
    deleteWishlist(wishlistToDelete.id)
    setWishlistToDelete(null)
    setIsDeleteModalOpen(false)
  }

  return (
    <div className="pb-20">
      <section className="border-b border-line bg-white">
        <div className="container-page py-12 lg:py-16">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-muted">
                {count === 0
                  ? 'No stays saved yet'
                  : `${count} ${count === 1 ? 'stay' : 'stays'} saved`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-muted transition hover:border-ink/25 hover:text-ink"
              >
                <Plus className="size-4" aria-hidden="true" />
                Create new wishlist
              </button>

              {count > 0 ? (
                <button
                  type="button"
                  onClick={clearWishlist}
                  className="inline-flex items-center gap-2 self-start rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-muted transition hover:border-ink/25 hover:text-ink sm:self-auto"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Clear all
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="container-page mt-10 lg:mt-14">
        {wishlists.length > 0 ? (
          <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {wishlists.map((wishlist) => {
              const wishlistHotels = wishlist.hotelIds
                .map((hotelId) => hotels.find((hotel) => hotel.id === hotelId))
                .filter((hotel): hotel is (typeof hotels)[number] => Boolean(hotel))

              return (
                <div key={wishlist.id} className="rounded-2xl border border-line bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-muted">
                        Wishlist
                      </p>
                      <h2 className="mt-2 font-display text-2xl text-ink">{wishlist.name}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Delete ${wishlist.name} wishlist`}
                        onClick={() => {
                          setWishlistToDelete(wishlist)
                          setIsDeleteModalOpen(true)
                        }}
                        className="flex size-8 items-center justify-center rounded-full border border-line bg-white text-muted transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                      <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand">
                        {wishlistHotels.length} stay{wishlistHotels.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {wishlistHotels.length > 0 ? (
                      wishlistHotels.slice(0, 3).map((hotel) => (
                        <div key={hotel.id} className="flex items-center justify-between gap-3 rounded-xl bg-canvas px-3 py-2">
                          <div>
                            <p className="text-sm font-medium text-ink">{hotel.name}</p>
                            <p className="text-xs text-muted">
                              {hotel.location.city}, {hotel.location.country}
                            </p>
                          </div>
                          <span className="font-numeric text-sm text-muted">₹{hotel.pricePerNight}</span>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-xl bg-canvas px-3 py-3 text-sm text-muted">
                        No stays in this wishlist yet.
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}

        {savedHotels.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {savedHotels.map((hotel, index) => (
                <HotelCard
                  key={hotel.id}
                  hotel={hotel}
                  className="animate-fade-up"
                  style={{ animationDelay: `${index * 60}ms` }}
                />
              ))}
            </div>

            <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl border border-line bg-white px-6 py-8 text-center sm:flex-row sm:text-left">
              <div>
                <p className="font-display text-2xl text-ink">Still deciding?</p>
                <p className="mt-1 text-sm text-muted">
                  Explore the rest of the collection and add a few more stays to the shortlist.
                </p>
              </div>
              <Link to="/hotels" className={buttonStyles('primary', 'md')}>
                Browse all stays
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-md rounded-2xl border border-line bg-white px-8 py-14 text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand">
              <img src="/wishlist-heart.png" alt="" className="size-8 object-contain" />
            </span>
            <h2 className="mt-5 font-display text-3xl text-ink">Nothing saved yet</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Save stays to your wishlist.
            </p>
            <div className="mt-7 flex flex-col gap-3">
              <Link to="/hotels" className={buttonStyles('primary', 'md', true)}>
                Explore stays
              </Link>
              <Link
                to="/"
                className="text-sm font-medium text-muted transition-colors hover:text-ink"
              >
                Back to home
              </Link>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={isModalOpen}
        onClose={() => {
          setName('')
          setIsModalOpen(false)
        }}
        title="Create a wishlist"
        description="Give your list a name. For example: Mumbai, Bali or Family escape."
      >
        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink">Wishlist name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Mumbai"
              className="h-12 w-full rounded-xl border border-line bg-canvas px-4 text-sm text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none"
            />
          </label>

          <button
            type="button"
            onClick={handleCreateWishlist}
            disabled={!name.trim()}
            className="inline-flex w-full items-center justify-center rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0a2331] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create wishlist
          </button>
        </div>
      </Modal>

      <Modal
        open={isDeleteModalOpen}
        onClose={() => {
          setWishlistToDelete(null)
          setIsDeleteModalOpen(false)
        }}
        title="Delete wishlist?"
        description={
          wishlistToDelete
            ? `Are you sure you want to delete “${wishlistToDelete.name}”? This action cannot be undone.`
            : 'Are you sure you want to delete this wishlist?'
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
              setWishlistToDelete(null)
              setIsDeleteModalOpen(false)
            }}
            className="inline-flex items-center justify-center rounded-full border border-line bg-white px-4 py-2.5 text-sm font-medium text-muted transition hover:border-ink/20 hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeleteWishlist}
            className="inline-flex items-center justify-center rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  )
}
