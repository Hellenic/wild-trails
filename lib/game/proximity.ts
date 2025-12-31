import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { ProximityEvent } from "@/lib/api/validation";
import {
  DEFAULT_TRIGGER_DISTANCE_METERS,
  checkPointProximity,
  type ProximityPoint,
} from "./proximity-logic";

/**
 * Check if a player's location is within the trigger distance of any unvisited points
 * Updates point status and returns proximity events
 * @param gameId The game ID
 * @param playerId The player ID
 * @param latitude Player's current latitude
 * @param longitude Player's current longitude
 * @returns Array of proximity events for points that were reached
 */
export async function checkProximity(
  gameId: string,
  playerId: string,
  latitude: number,
  longitude: number
): Promise<ProximityEvent[]> {
  // Use regular client for reading (respects RLS for user context)
  const supabase = await createClient();
  // Use admin client for updates (bypasses RLS)
  const adminClient = createAdminClient();
  const events: ProximityEvent[] = [];

  try {
    // Get all unvisited points for the game (excluding start points)
    const { data: points, error } = await supabase
      .from("game_points")
      .select("*")
      .eq("game_id", gameId)
      .eq("status", "unvisited")
      .neq("type", "start"); // Start points don't trigger proximity

    if (error) {
      console.error("Error fetching game points:", error);
      return events;
    }

    if (!points || points.length === 0) {
      return events;
    }

    // Check each point for proximity using pure logic
    for (const point of points) {
      const proximityPoint: ProximityPoint = {
        id: point.id,
        latitude: point.latitude,
        longitude: point.longitude,
        type: point.type,
        hint: point.hint,
      };

      const result = checkPointProximity(
        latitude,
        longitude,
        proximityPoint,
        DEFAULT_TRIGGER_DISTANCE_METERS
      );

      // If within trigger distance, mark as visited and add to events
      if (result.triggered) {
        // Update point status to visited using ADMIN client to bypass RLS
        const { data: updateData, error: updateError } = await adminClient
          .from("game_points")
          .update({
            status: "visited",
            updated_at: new Date().toISOString(),
          })
          .eq("id", point.id)
          .select();

        if (updateError) {
          console.error("Error updating point status:", updateError);
          continue;
        }

        if (!updateData || updateData.length === 0) {
          console.error("Update returned no data - this should not happen with admin client!");
          continue;
        }

        // Add proximity event
        events.push({
          point_id: point.id,
          point_type: point.type,
          hint: point.hint,
          distance: Math.round(result.distance),
        });
      }
    }

    return events;
  } catch (error) {
    console.error("Error in proximity check:", error);
    return events;
  }
}

/**
 * Get the trigger distance for proximity checks
 * @returns Trigger distance in meters
 */
export function getTriggerDistance(): number {
  return DEFAULT_TRIGGER_DISTANCE_METERS;
}

// Re-export pure functions for use elsewhere
export {
  calculateDistance,
  isWithinProximity,
  checkPointProximity,
  checkMultiplePointsProximity,
  getTriggeredPoints,
  filterTriggerablePoints,
  getClosestPoint,
  isValidCoordinate,
  DEFAULT_TRIGGER_DISTANCE_METERS,
  type ProximityPoint,
  type ProximityCheckResult,
  type ProximityTriggerEvent,
} from "./proximity-logic";
