import { useMemo } from 'react';

const BASE_FEE = 100; // KES base delivery fee
const PER_KM_RATE = 30; // KES per km
const FREE_DELIVERY_THRESHOLD = 2000; // Free delivery above this subtotal
const MAX_FEE = 500; // Cap at KES 500

// Haversine distance in km
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface UseDeliveryFeeParams {
  branchLat?: number;
  branchLon?: number;
  customerLat?: number | null;
  customerLon?: number | null;
  subtotal: number;
}

export function useDeliveryFee({ branchLat, branchLon, customerLat, customerLon, subtotal }: UseDeliveryFeeParams) {
  return useMemo(() => {
    if (subtotal >= FREE_DELIVERY_THRESHOLD) {
      return { fee: 0, distanceKm: 0, isFree: true, reason: `Free delivery on orders above KES ${FREE_DELIVERY_THRESHOLD.toLocaleString()}` };
    }

    if (!branchLat || !branchLon || !customerLat || !customerLon) {
      return { fee: BASE_FEE, distanceKm: 0, isFree: false, reason: 'Standard delivery fee' };
    }

    const distanceKm = haversineKm(branchLat, branchLon, customerLat, customerLon);
    const rawFee = BASE_FEE + Math.ceil(distanceKm) * PER_KM_RATE;
    const fee = Math.min(rawFee, MAX_FEE);

    return {
      fee: Math.ceil(fee / 10) * 10, // Round to nearest 10
      distanceKm: Math.round(distanceKm * 10) / 10,
      isFree: false,
      reason: `${Math.round(distanceKm * 10) / 10} km from store`,
    };
  }, [branchLat, branchLon, customerLat, customerLon, subtotal]);
}
