import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, handleApiError } from "@/lib/api/auth";
import { z } from "zod";

const endGameSchema = z.object({
  gave_up: z.boolean().optional().default(false),
});

/**
 * POST /api/game/[id]/end
 * End/complete a game
 * 
 * Authorization:
 * - Game creator can always end the game
 * - Game Master (player with game_master role) can end the game
 * - Player A can "give up" (end with gave_up=true)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params;
    const user = await requireAuth();

    const body = await request.json().catch(() => ({}));
    const { gave_up } = endGameSchema.parse(body);

    const supabase = await createClient();

    // Fetch game details
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("id, creator_id, status, game_mode")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    // Check game is active
    if (game.status !== "active") {
      return NextResponse.json(
        { error: "Game is not currently active" },
        { status: 400 }
      );
    }

    // Check authorization
    const isCreator = game.creator_id === user.id;

    // Check if user is a player in this game
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("id, role, user_id")
      .eq("game_id", gameId)
      .eq("user_id", user.id)
      .single();

    if (playerError && !isCreator) {
      return NextResponse.json(
        { error: "You are not a participant in this game" },
        { status: 403 }
      );
    }

    const isGameMaster = player?.role === "game_master";
    const isPlayerA = player?.role === "player_a";

    // Authorization logic:
    // - Creator can always end
    // - Game Master can always end
    // - Player A can give up (end with gave_up=true)
    // - Other players cannot end the game
    const canEnd = isCreator || isGameMaster || (isPlayerA && gave_up);

    if (!canEnd) {
      if (isPlayerA && !gave_up) {
        return NextResponse.json(
          { error: "As Player A, you can only give up (set gave_up to true)" },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: "You do not have permission to end this game" },
        { status: 403 }
      );
    }

    // Update game status
    const updateData: {
      status: "completed";
      ended_at: string;
      gave_up?: boolean;
    } = {
      status: "completed",
      ended_at: new Date().toISOString(),
    };

    // Only set gave_up if explicitly requested (by Player A giving up)
    if (gave_up) {
      updateData.gave_up = true;
    }

    const { data: updatedGame, error: updateError } = await supabase
      .from("games")
      .update(updateData)
      .eq("id", gameId)
      .select()
      .single();

    if (updateError) {
      console.error("Error ending game:", updateError);
      return NextResponse.json(
        { error: "Failed to end game" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      game: updatedGame,
      gave_up: gave_up,
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

