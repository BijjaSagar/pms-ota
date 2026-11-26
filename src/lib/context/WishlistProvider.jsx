// Ported from pms-ota/src/context/WishlistProvider.tsx (types removed, logic unchanged).
import { useCallback, useEffect, useMemo, useState } from "react";
import { WishlistContext } from "./wishlist-context";
import { useCatalogue } from "./useCatalogue.js";
const STORAGE_KEY = "triponx.wishlist.v1";
const WISHLISTS_KEY = "triponx.wishlists.v1";
function createInitialIds() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value) => typeof value === "string");
  } catch {
    return [];
  }
}
function createInitialWishlists() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WISHLISTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value) => {
      if (!value || typeof value !== "object") return false;
      const item = value;
      return typeof item.id === "string" && typeof item.name === "string" && Array.isArray(item.hotelIds);
    });
  } catch {
    return [];
  }
}
function cityMatchesHotelName(cityName, hotel) {
  const target = cityName.trim().toLowerCase();
  if (!target) return false;
  const hotelCity = hotel.location.city.toLowerCase();
  const hotelCountry = hotel.location.country.toLowerCase();
  const hotelName = hotel.name.toLowerCase();
  return hotelCity.includes(target) || hotelCountry.includes(target) || hotelName.includes(target);
}
function WishlistProvider({ children }) {
  // Approved properties from the API plus the demo hotels.
  const { hotels } = useCatalogue();
  const [ids, setIds] = useState(createInitialIds);
  const [wishlists, setWishlists] = useState(createInitialWishlists);
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
    }
  }, [ids]);
  useEffect(() => {
    try {
      window.localStorage.setItem(WISHLISTS_KEY, JSON.stringify(wishlists));
    } catch {
    }
  }, [wishlists]);
  const isSaved = useCallback((hotelId) => ids.includes(hotelId), [ids]);
  const toggleWishlist = useCallback((hotelId) => {
    setIds(
      (current) => current.includes(hotelId) ? current.filter((id) => id !== hotelId) : [...current, hotelId]
    );
  }, []);
  const removeFromWishlist = useCallback((hotelId) => {
    setIds((current) => current.filter((id) => id !== hotelId));
  }, []);
  const clearWishlist = useCallback(() => setIds([]), []);
  const createWishlist = useCallback((name) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const matchingHotelIds = hotels.filter((hotel) => cityMatchesHotelName(trimmed, hotel)).map((hotel) => hotel.id);
    const nextItem = {
      id: `wishlist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: trimmed,
      hotelIds: [...new Set(matchingHotelIds)]
    };
    setWishlists((current) => [nextItem, ...current]);
    return nextItem;
  }, [hotels]);
  const deleteWishlist = useCallback((wishlistId) => {
    setWishlists((current) => current.filter((item) => item.id !== wishlistId));
  }, []);
  const value = useMemo(
    () => ({
      ids,
      wishlists,
      count: ids.length,
      isSaved,
      toggleWishlist,
      removeFromWishlist,
      clearWishlist,
      createWishlist,
      deleteWishlist
    }),
    [ids, wishlists, isSaved, toggleWishlist, removeFromWishlist, clearWishlist, createWishlist, deleteWishlist]
  );
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
export {
  WishlistProvider
};
