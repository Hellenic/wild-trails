import { useEffect, useState, useCallback } from "react";
import { Tables } from "@/types/database.types";
import { createClient } from "@/lib/supabase/client";

export type GamePoint = Tables<"game_points">;

export function usePoints(gameId: string) {
  const [points, setPoints] = useState<GamePoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to load/reload points from server
  const loadPoints = useCallback(async () => {
    if (!gameId) return;
    
    const supabase = createClient();
    const { data, error } = await supabase
      .from("game_points")
      .select()
      .eq("game_id", gameId)
      .order("sequence_number", { ascending: true });

    if (error) {
      console.error("Error loading points:", error);
      return;
    }

    setPoints(data || []);
    setLoading(false);
  }, [gameId]);

  useEffect(() => {
    if (!gameId) return;

    const supabase = createClient();

    // Initial load
    // eslint-disable-next-line
    loadPoints();

    // Subscribe to real-time updates for point status changes
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
          // Update the specific point in the local state
          setPoints((currentPoints) =>
            currentPoints.map((point) =>
              point.id === payload.new.id
                ? (payload.new as GamePoint)
                : point
            )
          );
        }
      )
      .subscribe();

    // Re-fetch points when app regains visibility (e.g., phone taken out of pocket)
    // This ensures we catch any updates missed while the websocket was disconnected
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadPoints();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [gameId, loadPoints]);

  return { points, loading, refetch: loadPoints };
}
