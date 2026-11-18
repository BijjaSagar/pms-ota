// Ported from pms-ota/src/data/addons.ts (types removed, logic unchanged).
const EARLY_CHECK_IN_ID = "early-check-in";
const LATE_CHECK_OUT_ID = "late-check-out";
const addons = [
  {
    id: "breakfast",
    name: "Daily breakfast",
    description: "Buffet breakfast at the property restaurant, per guest per night.",
    price: 35,
    unit: "person-night",
    icon: "coffee"
  },
  {
    id: "airport-transfer",
    name: "Private airport transfer",
    description: "Round-trip pick-up and drop-off with a private driver.",
    price: 80,
    unit: "stay",
    icon: "car"
  },
  {
    id: "spa-credit",
    name: "Spa credit",
    description: "Credit to use towards any treatment at the hotel spa.",
    price: 120,
    unit: "stay",
    icon: "sparkles"
  },
  {
    id: "laundry",
    name: "Laundry service",
    description: "Same-day laundry and pressing for your whole stay.",
    price: 25,
    unit: "stay",
    icon: "shirt"
  },
  {
    id: "extra-bed",
    name: "Extra bed",
    description: "A rollaway bed for an additional guest, per night.",
    price: 40,
    unit: "night",
    icon: "bed"
  },
  {
    id: "kids-pack",
    name: "Kids welcome pack",
    description: "Age-appropriate toys, snacks and activities for children.",
    price: 30,
    unit: "stay",
    icon: "baby"
  },
  {
    id: EARLY_CHECK_IN_ID,
    name: "Early check-in",
    description: "Check in from 11:00 AM instead of the standard time.",
    price: 30,
    unit: "stay",
    icon: "clock",
    inAddonList: false
  },
  {
    id: LATE_CHECK_OUT_ID,
    name: "Late check-out",
    description: "Keep your room until 2:00 PM on departure day.",
    price: 35,
    unit: "stay",
    icon: "clock",
    inAddonList: false
  }
];
function getAddon(id) {
  return addons.find((addon) => addon.id === id);
}
function addonTotal(addon, nights, guests) {
  if (addon.unit === "night") return addon.price * nights;
  if (addon.unit === "person") return addon.price * guests;
  if (addon.unit === "person-night") return addon.price * guests * nights;
  return addon.price;
}
function calculateAddonsTotal(ids, nights, guests) {
  return ids.reduce((total, id) => {
    const addon = getAddon(id);
    return addon ? total + addonTotal(addon, nights, guests) : total;
  }, 0);
}
function selectedAddons(ids, nights, guests) {
  return ids.flatMap((id) => {
    const addon = getAddon(id);
    if (!addon) return [];
    return [{ id: addon.id, name: addon.name, price: addonTotal(addon, nights, guests) }];
  });
}
export {
  EARLY_CHECK_IN_ID,
  LATE_CHECK_OUT_ID,
  addonTotal,
  addons,
  calculateAddonsTotal,
  getAddon,
  selectedAddons
};
