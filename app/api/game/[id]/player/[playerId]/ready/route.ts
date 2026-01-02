import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, handleApiError } from "@/lib/api/auth";
import { z } from "zod";

const readySchema = z.object({
  ready: z.boolean(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  try {
    const { id: gameId, playerId } = await params;
    const user = await requireAuth();

    const body = await request.json();
    const { ready } = readySchema.parse(body);

    const supabase = await createClient();

    // Verify the player exists and belongs to the current user
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("id, user_id, game_id, status")
      .eq("id", playerId)
      .eq("game_id", gameId)
      .single();

    if (playerError || !player) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    // Authorization: Only the player's owner can update their ready status
    if (player.user_id !== user.id) {
      return NextResponse.json(
        { error: "You can only update your own ready status" },
        { status: 403 }
      );
    }

    // Verify game is in a state that allows ready status changes
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("status")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    // Allow ready status changes during "setup" (waiting for waypoints) and "ready" (lobby)
    // Block changes once game is "active" or "completed"
    if (game.status === "active" || game.status === "completed") {
      return NextResponse.json(
        { error: "Cannot change ready status after game has started" },
        { status: 400 }
      );
    }

    // Update player status
    const newStatus = ready ? "ready" : "waiting";
    const { data: updatedPlayer, error: updateError } = await supabase
      .from("players")
      .update({ status: newStatus })
      .eq("id", playerId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating player status:", updateError);
      return NextResponse.json(
        { error: "Failed to update ready status" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedPlayer);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

