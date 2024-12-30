"use server";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.types";

type Player = Tables<"players">;

export async function updatePlayerStatus(
  gameId: string,
  status: Player["status"]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not found");
  }

  // Update player status to ready
  const { error } = await supabase
    .from("players")
    .update({ status })
    .eq("game_id", gameId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating player status:", error);
    throw new Error("Failed to update player status");
  }
}
