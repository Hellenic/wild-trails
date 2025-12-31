import { useEffect, useState } from "react";
import { Tables } from "@/types/database.types";
import { createClient } from "@/lib/supabase/client";

export type GamePoint = Tables<"game_points">;

export function usePoints(gameId: string) {
  const [points, setPoints] = useState<GamePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) return;

    const supabase = createClient();

    // Initial load
    async function loadPoints() {
      const { data, error } = await supabase
        .from("game_points")
        .select()
        .eq("game_id", gameId)
        .order("sequence_number", { ascending: true });

      if (error) {
        console.error("Error loading points:", error);
        setLoading(false);
        return;
      }

      setPoints(data || []);
      setLoading(false);
    }

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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  return { points, loading };
}
