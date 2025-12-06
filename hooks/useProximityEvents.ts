import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database.types";

type GamePoint = Tables<"game_points">;

interface ProximityEventCallbacks {
  onPointReached?: (point: GamePoint) => void;
  onClueDiscovered?: (point: GamePoint) => void;
  onGoalFound?: (point: GamePoint) => void;
}

/**
 * Hook to listen for server-side proximity events via Supabase Realtime
 * Subscribes to game_points table updates for a specific game
 * 
 * @param gameId - The game ID to listen for
 * @param callbacks - Callback functions for different point types
 */
export function useProximityEvents(
  gameId: string | null | undefined,
  callbacks: ProximityEventCallbacks
) {
  useEffect(() => {
    if (!gameId) return;

    const supabase = createClient();
    
    // Subscribe to changes on game_points table for this game
    const channel = supabase
      .channel(`game_points_${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_points",
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          // When a point is marked as visited (by server proximity check)
          if (payload.new.status === "visited" && payload.old.status === "unvisited") {
            const point = payload.new as GamePoint;
            
            // Call the generic onPointReached callback if provided
            callbacks.onPointReached?.(point);

            // Call specific callbacks based on point type
            if (point.type === "clue") {
              callbacks.onClueDiscovered?.(point);
            } else if (point.type === "end") {
              callbacks.onGoalFound?.(point);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, callbacks]);
}

