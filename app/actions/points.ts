"use server";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.types";

export async function updatePointStatus(
  pointId: string,
  status: Tables<"game_points">["status"]
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
