import { createClient } from "@/lib/supabase/server";
import type { ProximityEvent } from "@/lib/api/validation";
import { LatLng } from "@/utils/map";

const TRIGGER_DISTANCE_METERS = 50; // Adjust based on game requirements

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
  const supabase = await createClient();
  const events: ProximityEvent[] = [];

  try {
    // Get all unvisited points for the game
    const { data: points, error } = await supabase
      .from("game_points")
      .select("*")
      .eq("game_id", gameId)
      .eq("status", "unvisited");

    if (error) {
      console.error("Error fetching game points:", error);
      return events;
    }

    if (!points || points.length === 0) {
      return events;
    }

    // Check each point for proximity
    for (const point of points) {
      const playerLocation = new LatLng(latitude, longitude);
      const pointLocation = new LatLng(point.latitude, point.longitude);
      const distance = playerLocation.distanceTo(pointLocation);

      // If within trigger distance, mark as visited and add to events
      if (distance <= TRIGGER_DISTANCE_METERS) {
        // Update point status to visited
        const { error: updateError } = await supabase
          .from("game_points")
          .update({
            status: "visited",
            updated_at: new Date().toISOString(),
          })
          .eq("id", point.id);

        if (updateError) {
          console.error("Error updating point status:", updateError);
          continue;
        }

        // Add proximity event
        events.push({
          point_id: point.id,
          point_type: point.type,
          hint: point.hint,
          distance: Math.round(distance),
        });

        // Emit a realtime event for this point being reached
        // Note: Supabase Realtime will automatically broadcast the update to game_points table
        // The frontend should subscribe to changes on game_points table filtered by game_id
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
  return TRIGGER_DISTANCE_METERS;
}

