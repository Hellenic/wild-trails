import type { UserPreferences } from "@/types/user";

/**
 * Convert kilometers to the user's preferred unit
 */
export function formatDistance(
  km: number,
  unit: UserPreferences["distance_unit"] = "km",
  decimals: number = 1
): string {
  if (unit === "miles") {
    const miles = km * 0.621371;
    return `${miles.toFixed(decimals)} mi`;
  }
  return `${km.toFixed(decimals)} km`;
}

/**
 * Convert meters to the user's preferred unit
 */
export function formatDistanceFromMeters(
  meters: number,
  unit: UserPreferences["distance_unit"] = "km",
  decimals: number = 1
): string {
  if (unit === "miles") {
    const miles = (meters / 1000) * 0.621371;
    if (miles < 0.1) {
      // Show in feet for very short distances
      const feet = meters * 3.28084;
      return `${Math.round(feet)} ft`;
    }
    return `${miles.toFixed(decimals)} mi`;
  }
  
  // Metric
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(decimals)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Get the unit label
 */
export function getDistanceUnit(
  unit: UserPreferences["distance_unit"] = "km"
): string {
  return unit === "miles" ? "mi" : "km";
}

/**
 * Convert kilometers to miles
 */
export function kmToMiles(km: number): number {
  return km * 0.621371;
}

/**
 * Convert miles to kilometers
 */
export function milesToKm(miles: number): number {
  return miles / 0.621371;
}

