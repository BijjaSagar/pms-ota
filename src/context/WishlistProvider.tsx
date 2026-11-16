import { useCallback, useEffect, useMemo, useState } from 'react'
import { hotels } from '../data/hotels'
import { WishlistContext, type WishlistContextValue, type WishlistItem } from './wishlist-context'

const STORAGE_KEY = 'aurelia.wishlist.v1'
const WISHLISTS_KEY = 'aurelia.wishlists.v1'

function createInitialIds(): string[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((value): value is string => typeof value === 'string')
  } catch {
    return []
  }
}

function createInitialWishlists(): WishlistItem[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(WISHLISTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed.filter((value): value is WishlistItem => {
      if (!value || typeof value !== 'object') return false
      const item = value as Partial<WishlistItem>
      return typeof item.id === 'string' && typeof item.name === 'string' && Array.isArray(item.hotelIds)
    })
  } catch {
    return []
  }
}

function cityMatchesHotelName(cityName: string, hotel: (typeof hotels)[number]) {
  const target = cityName.trim().toLowerCase()
  if (!target) return false

  const hotelCity = hotel.location.city.toLowerCase()
  const hotelCountry = hotel.location.country.toLowerCase()
  const hotelName = hotel.name.toLowerCase()

  return (
    hotelCity.includes(target) ||
    hotelCountry.includes(target) ||
    hotelName.includes(target)
  )
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>(createInitialIds)
  const [wishlists, setWishlists] = useState<WishlistItem[]>(createInitialWishlists)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } catch {
      // Storage can be unavailable in private mode; the wishlist still works in memory.
    }
  }, [ids])

  useEffect(() => {
    try {
      window.localStorage.setItem(WISHLISTS_KEY, JSON.stringify(wishlists))
    } catch {
      // Storage can be unavailable in private mode; saved wishlists still work in memory.
    }
  }, [wishlists])

  const isSaved = useCallback((hotelId: string) => ids.includes(hotelId), [ids])

  const toggleWishlist = useCallback((hotelId: string) => {
    setIds((current) =>
      current.includes(hotelId)
        ? current.filter((id) => id !== hotelId)
        : [...current, hotelId],
    )
  }, [])

  const removeFromWishlist = useCallback((hotelId: string) => {
    setIds((current) => current.filter((id) => id !== hotelId))
  }, [])

  const clearWishlist = useCallback(() => setIds([]), [])

  const createWishlist = useCallback((name: string): WishlistItem | null => {
    const trimmed = name.trim()
    if (!trimmed) return null

    const matchingHotelIds = hotels
      .filter((hotel) => cityMatchesHotelName(trimmed, hotel))
      .map((hotel) => hotel.id)

    const nextItem: WishlistItem = {
      id: `wishlist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: trimmed,
      hotelIds: [...new Set(matchingHotelIds)],
    }

    setWishlists((current) => [nextItem, ...current])
    return nextItem
  }, [])

  const deleteWishlist = useCallback((wishlistId: string) => {
    setWishlists((current) => current.filter((item) => item.id !== wishlistId))
  }, [])

  const value = useMemo<WishlistContextValue>(
    () => ({
      ids,
      wishlists,
      count: ids.length,
      isSaved,
      toggleWishlist,
      removeFromWishlist,
      clearWishlist,
      createWishlist,
      deleteWishlist,
    }),
    [ids, wishlists, isSaved, toggleWishlist, removeFromWishlist, clearWishlist, createWishlist, deleteWishlist],
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}
