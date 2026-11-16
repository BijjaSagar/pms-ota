import { createContext } from 'react'

export interface WishlistItem {
  id: string
  name: string
  hotelIds: string[]
}

export interface WishlistContextValue {
  ids: string[]
  wishlists: WishlistItem[]
  count: number
  isSaved: (hotelId: string) => boolean
  toggleWishlist: (hotelId: string) => void
  removeFromWishlist: (hotelId: string) => void
  clearWishlist: () => void
  createWishlist: (name: string) => WishlistItem | null
  deleteWishlist: (wishlistId: string) => void
}

export const WishlistContext = createContext<WishlistContextValue | null>(null)
