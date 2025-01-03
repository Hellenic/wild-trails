import { useEffect, useState } from "react";
import { Tables } from "@/types/database.types";
import { createClient } from "@/lib/supabase/client";

export type GamePoint = Tables<"game_points">;

export function usePoints(gameId: string) {
  const [points, setPoints] = useState<GamePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadPoints() {
      const { data, error } = await supabase
        .from("game_points")
        .select()
        .eq("game_id", gameId);

      if (error) {
        console.error("Error loading points:", error);
        return;
      }

      setPoints(data);
      setLoading(false);
    }

    loadPoints();
  }, [gameId]);

  return { points, loading };
}
