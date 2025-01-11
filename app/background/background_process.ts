// Kind of a background process manager, which in the future could actually be in the background
import { createClient } from "@/lib/supabase/server";
import { gameAI } from "./game_ai";
import type { Game } from "@/types/game";

export const processCreateGame = async (gameId: string) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("games")
    .select()
    .eq("id", gameId)
    .single();

  if (error || !data) {
    console.error("Error fetching game:", error);
    return;
  }

  // Intentionally sleep for 3 seconds, to simulate a long process
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const points = await gameAI.generateGamePoints(data as Game);
  await supabase.from("game_points").insert(
    points.map((p) => ({
      ...p,
      game_id: data.id,
    }))
  );

  const { error: statusUpdateError } = await supabase
    .from("games")
    .update({ status: "ready" })
    .eq("id", gameId);

  if (statusUpdateError) {
    console.error("Error updating game status:", statusUpdateError);
  }
};
