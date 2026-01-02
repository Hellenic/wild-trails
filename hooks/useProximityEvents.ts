import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database.types";
import type { RealtimeChannel } from "@supabase/supabase-js";

type GamePoint = Tables<"game_points">;

interface ProximityEventCallbacks {
  onPointReached?: (point: GamePoint) => void;
  onClueDiscovered?: (point: GamePoint) => void;
  onGoalFound?: (point: GamePoint) => void;
}

interface ProximityEventOptions extends ProximityEventCallbacks {
  /**
   * Whether the hook should be enabled. When false, no subscription is created.
   * Use this to conditionally enable proximity events based on role permissions.
   * @default true
   */
  enabled?: boolean;
}

/**
 * Hook to listen for server-side proximity events via Supabase Realtime
 * Subscribes to game_points table updates for a specific game
 * 
 * @param gameId - The game ID to listen for
 * @param options - Callback functions and options for the hook
 */
export function useProximityEvents(
  gameId: string | null | undefined,
  options: ProximityEventOptions
) {
  const { enabled = true, ...callbacks } = options;
  // Use ref to store callbacks to avoid re-subscribing on every render
  const callbacksRef = useRef(callbacks);
  
  // Update ref in an effect to satisfy React's rules
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    // Don't subscribe if disabled or no gameId
    if (!enabled || !gameId) {
      return;
    }

    const supabase = createClient();
    let channel: RealtimeChannel | null = null;
    
    // Subscribe to changes on game_points table for this game
    // Use a unique channel name to avoid conflicts with usePoints hook
    channel = supabase
      .channel(`game_points_events_${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_points",
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          const newPoint = payload.new as GamePoint;
          
          // When a point is marked as visited
          if (newPoint.status === "visited") {
            // Call the generic onPointReached callback if provided
            callbacksRef.current.onPointReached?.(newPoint);

            // Call specific callbacks based on point type
            if (newPoint.type === "clue") {
              callbacksRef.current.onClueDiscovered?.(newPoint);
            } else if (newPoint.type === "end") {
              callbacksRef.current.onGoalFound?.(newPoint);
            }
          }
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('Realtime subscription error:', err);
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime channel error - check if Realtime is enabled on the table');
        }
      });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [gameId, enabled]); // Re-subscribe when gameId or enabled changes, not callbacks
}
