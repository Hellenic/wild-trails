"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { GameDetails } from "@/types/game";
import { processCreateGame } from "../background/background_process";

export async function createGame(settings: Partial<GameDetails>) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    if (!settings.name || !settings.password) {
      throw new Error("Game name and password are required");
    }

    const { data, error } = await supabase
      .from("games")
      .insert({
        ...settings,
        creator_id: user.id,
        status: "setup",
        name: settings.name || "",
        password: settings.password || "",
        player_count: settings.player_count || 0,
        selected_role: settings.selected_role || "player_a",
        max_radius: settings.max_radius || 0,
        bounding_box: settings.bounding_box || null,
        duration: settings.duration || 0,
        game_master: settings.game_master || "player",
        game_mode: settings.game_mode || "single_player",
      })
      .select()
      .single();

    if (error) throw error;

    // Create a player for the creator, if they've selected a role
    if (settings.selected_role) {
      await supabase.from("players").insert({
        game_id: data.id,
        user_id: user.id,
        role: settings.selected_role,
      });
    }

    // Generate points if AI is game master
    if (settings.game_master === "ai") {
      // TODO This could be some kind of background trigger in the future
      // Also, not awaiting this seems to cause redirect errors...
      await processCreateGame(data.id).catch((error) => {
        console.error("Error while processing the game:", error);
      });
    }

    // Redirect to the game setup page
    redirect(`/game/${data.id}/setup`);
  } catch (error) {
    console.error("Error creating game:", error);
    throw error;
  }
}

export async function updateGameStatus(
  gameId: string,
  status: GameDetails["status"]
) {
  const supabase = await createClient();

  const started_at = status === "active" ? new Date().toISOString() : null;
  const ended_at = status === "completed" ? new Date().toISOString() : null;

  const { error } = await supabase
    .from("games")
    .update({ status, started_at, ended_at })
    .eq("id", gameId);

  if (error) {
    console.error("Error updating game status:", error);
    throw new Error("Failed to update game status");
  }
}
