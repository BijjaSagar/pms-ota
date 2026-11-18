// Ported from pms-ota/src/context/useTrips.ts (types removed, logic unchanged).
import { useContext } from "react";
import { TripsContext } from "./trips-context";
function useTrips() {
  const context = useContext(TripsContext);
  if (!context) {
    throw new Error("useTrips must be used within a TripsProvider");
  }
  return context;
}
export {
  useTrips
};
