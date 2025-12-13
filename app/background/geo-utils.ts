/**
 * Geographic utility functions for point generation and hint generation
 * Shared across strategies to avoid code duplication
 */

/**
 * Calculate bearing between two geographic points
 * @returns Bearing in degrees (0-360)
 */
export function calculateBearing(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  const dLon = ((to.lng - from.lng) * Math.PI) / 180;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360; // Normalize to 0-360
}

/**
 * Convert bearing to cardinal direction
 * @param bearing Bearing in degrees (0-360)
 * @returns Cardinal direction (N, NE, E, SE, S, SW, W, NW)
 */
export function getCardinalDirection(bearing: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

/**
 * Calculate distance between two geographic points
 * Uses simple euclidean approximation (good enough for small distances)
 * @returns Distance in kilometers
 */
export function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  return Math.sqrt(
    Math.pow((point1.lat - point2.lat) * 111, 2) +
      Math.pow(
        (point1.lng - point2.lng) *
          111 *
          Math.cos((point1.lat * Math.PI) / 180),
        2
      )
  );
}

/**
 * Interpolate a point along a line between two points
 * @param start Starting point
 * @param end Ending point
 * @param progress Progress along the line (0.0 = start, 1.0 = end)
 * @returns Interpolated point
 */
export function interpolatePoint(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  progress: number
): { lat: number; lng: number } {
  return {
    lat: start.lat + (end.lat - start.lat) * progress,
    lng: start.lng + (end.lng - start.lng) * progress,
  };
}

/**
 * Calculate perpendicular offset point from a line segment
 * Used to create corridor-based paths where points can deviate left/right from the main path
 * 
 * @param lineStart Start of the line segment
 * @param lineEnd End of the line segment
 * @param progress Progress along the line (0.0 to 1.0)
 * @param offsetKm Perpendicular distance in km (positive = left of path, negative = right of path)
 * @returns Point offset perpendicular to the line
 */
export function calculatePerpendicularPoint(
  lineStart: { lat: number; lng: number },
  lineEnd: { lat: number; lng: number },
  progress: number,
  offsetKm: number
): { lat: number; lng: number } {
  // First, interpolate point along the line
  const pointOnLine = interpolatePoint(lineStart, lineEnd, progress);
  
  // Calculate bearing of the main path
  const bearing = calculateBearing(lineStart, lineEnd);
  
  // Perpendicular bearing is 90 degrees left (counter-clockwise)
  // Positive offset = left, negative offset = right
  const perpendicularBearing = (bearing + 90) % 360;
  
  // Convert offset distance to degrees (approximately)
  // At the equator, 1 degree ≈ 111 km
  // Adjust for latitude using cosine
  const latOffset = (offsetKm / 111) * Math.cos((perpendicularBearing * Math.PI) / 180);
  const lngOffset = (offsetKm / 111) * Math.sin((perpendicularBearing * Math.PI) / 180) / 
                    Math.cos((pointOnLine.lat * Math.PI) / 180);
  
  return {
    lat: pointOnLine.lat + latOffset,
    lng: pointOnLine.lng + lngOffset,
  };
}
