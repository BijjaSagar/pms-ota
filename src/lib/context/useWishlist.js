// Ported from pms-ota/src/context/useWishlist.ts (types removed, logic unchanged).
import { useContext } from "react";
import { WishlistContext } from "./wishlist-context";
function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
export {
  useWishlist
};
