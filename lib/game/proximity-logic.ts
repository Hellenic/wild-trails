/**
 * Pure proximity detection logic - no database dependencies
 * This module contains all the testable business logic for proximity detection
 */

import { LatLng } from "@/utils/map";

// Default trigger distance in meters
export const DEFAULT_TRIGGER_DISTANCE_METERS = 50;

/**
 * Point data needed for proximity checks
 */
export interface ProximityPoint {
  id: string;
  latitude: number;
  longitude: number;
  type: "start" | "end" | "clue";
  hint: string | null;
}

/**
 * Result of a proximity check for a single point
 */
export interface ProximityCheckResult {
  point: ProximityPoint;
  distance: number;
  triggered: boolean;
}

/**
 * Event generated when proximity is triggered
 */
export interface ProximityTriggerEvent {
  point_id: string;
  point_type: "start" | "end" | "clue";
  hint: string | null;
  distance: number;
}

/**
 * Calculate the distance in meters between two coordinates using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const playerLocation = new LatLng(lat1, lng1);
  const pointLocation = new LatLng(lat2, lng2);
  return playerLocation.distanceTo(pointLocation);
}

/**
 * Check if a player is within the trigger distance of a point
 */
export function isWithinProximity(
  playerLat: number,
  playerLng: number,
  pointLat: number,
  pointLng: number,
  triggerDistance: number = DEFAULT_TRIGGER_DISTANCE_METERS
): boolean {
  const distance = calculateDistance(playerLat, playerLng, pointLat, pointLng);
  return distance <= triggerDistance;
}

/**
 * Check proximity for a single point and return detailed result
 */
export function checkPointProximity(
  playerLat: number,
  playerLng: number,
  point: ProximityPoint,
  triggerDistance: number = DEFAULT_TRIGGER_DISTANCE_METERS
): ProximityCheckResult {
  const distance = calculateDistance(
    playerLat,
    playerLng,
    point.latitude,
    point.longitude
  );

  return {
    point,
    distance,
    triggered: distance <= triggerDistance,
  };
}

/**
 * Check proximity for multiple points and return all results
 */
export function checkMultiplePointsProximity(
  playerLat: number,
  playerLng: number,
  points: ProximityPoint[],
  triggerDistance: number = DEFAULT_TRIGGER_DISTANCE_METERS
): ProximityCheckResult[] {
  return points.map((point) =>
    checkPointProximity(playerLat, playerLng, point, triggerDistance)
  );
}

/**
 * Get only the triggered points from a proximity check
 */
export function getTriggeredPoints(
  playerLat: number,
  playerLng: number,
  points: ProximityPoint[],
  triggerDistance: number = DEFAULT_TRIGGER_DISTANCE_METERS
): ProximityTriggerEvent[] {
  const results = checkMultiplePointsProximity(
    playerLat,
    playerLng,
    points,
    triggerDistance
  );

  return results
    .filter((result) => result.triggered)
    .map((result) => ({
      point_id: result.point.id,
      point_type: result.point.type,
      hint: result.point.hint,
      distance: Math.round(result.distance),
    }));
}

/**
 * Filter points to only include triggerable types (clue and end)
 * Start points should not trigger proximity events
 */
export function filterTriggerablePoints(points: ProximityPoint[]): ProximityPoint[] {
  return points.filter((point) => point.type !== "start");
}

/**
 * Sort proximity results by distance (closest first)
 */
export function sortByDistance(results: ProximityCheckResult[]): ProximityCheckResult[] {
  return [...results].sort((a, b) => a.distance - b.distance);
}

/**
 * Get the closest point to the player
 */
export function getClosestPoint(
  playerLat: number,
  playerLng: number,
  points: ProximityPoint[]
): ProximityCheckResult | null {
  if (points.length === 0) return null;

  const results = checkMultiplePointsProximity(playerLat, playerLng, points);
  const sorted = sortByDistance(results);
  return sorted[0];
}

/**
 * Validate coordinates are within valid ranges
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}
