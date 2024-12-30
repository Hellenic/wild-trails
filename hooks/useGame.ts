import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GameDetails } from "@/types/game";

export const isGameMaster = (userId: string, gameDetails: GameDetails) => {
  return (
    (gameDetails.creator_id === userId &&
      gameDetails.selected_role === "game_master") ||
    gameDetails.players.some(
      (player) => player.user_id === userId && player.role === "game_master"
    )
  );
};

export const useGameDetails = (gameId: string) => {
  const [gameDetails, setGameDetails] = useState<GameDetails | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchGameDetails() {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("games")
      .select(
        `
        *,
        players (*)
      `
      )
      .eq("id", gameId)
      .single();

    if (error) {
      console.error("Error fetching game:", error);
      return null;
    }

    setGameDetails(data as GameDetails);
    setLoading(false);
  }

  useEffect(() => {
    fetchGameDetails();
  }, [gameId]);

  return { gameDetails, loading };
};
