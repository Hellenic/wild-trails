"use server";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.types";

export type GamePoint = Tables<"game_points">;

type PointSetup = {
  id: string;
  type: GamePoint["type"];
  position: [number, number];
  hint?: string;
};

export async function updatePointStatus(
  pointId: string,
  status: GamePoint["status"]
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
    .from("game_points")
    .update({ status })
    .eq("id", pointId);

  if (error) {
    console.error("Error updating point status:", error);
    throw new Error("Failed to update point status");
  }
}

export async function saveGamePoints(gameId: string, points: PointSetup[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not found");
  }

  // Convert points to database format
  const gamePoints: GamePoint[] = points.map((point, index) => ({
    id: point.id,
    game_id: gameId,
    type: point.type,
    status: "unvisited",
    latitude: point.position[0],
    longitude: point.position[1],
    sequence_number: index + 1,
    hint: point.hint || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  // Insert all points
  const { error } = await supabase.from("game_points").insert(gamePoints);

  if (error) {
    console.error("Error saving game points:", error);
    throw new Error("Failed to save game points");
  }
}
