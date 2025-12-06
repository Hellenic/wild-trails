import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database.types";
import { useState, useEffect } from "react";

export const usePlayer = (gameId: string) => {
  const [player, setPlayer] = useState<Tables<"players"> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlayer() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not found");
      }

      const { data, error } = await supabase
        .from("players")
        .select()
        .eq("game_id", gameId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error loading player:", error);
        setLoading(false);
        return;
      }

      setPlayer(data);
      setLoading(false);
    }

    loadPlayer();
  }, [gameId]);

  return { player, loading };
};
