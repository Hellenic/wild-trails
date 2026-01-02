import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, handleApiError } from "@/lib/api/auth";

/**
 * DELETE /api/game/[id]/player/[playerId]
 * Kick a player from the game (creator only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  try {
    const { id: gameId, playerId } = await params;
    const user = await requireAuth();

    const supabase = await createClient();

    // Verify game exists and user is the creator
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("id, creator_id, status")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    // Authorization: Only the game creator can kick players
    if (game.creator_id !== user.id) {
      return NextResponse.json(
        { error: "Only the game creator can kick players" },
        { status: 403 }
      );
    }

    // Verify game hasn't started or completed - kicking is allowed during setup and ready (lobby) phases
    if (game.status === "active" || game.status === "completed") {
      return NextResponse.json(
        { error: "Cannot kick players after game has started" },
        { status: 400 }
      );
    }

    // Verify the player exists and is in this game
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("id, user_id, game_id")
      .eq("id", playerId)
      .eq("game_id", gameId)
      .single();

    if (playerError || !player) {
      return NextResponse.json(
        { error: "Player not found in this game" },
        { status: 404 }
      );
    }

    // Prevent creator from kicking themselves
    if (player.user_id === user.id) {
      return NextResponse.json(
        { error: "You cannot kick yourself from the game" },
        { status: 400 }
      );
    }

    // Delete the player record
    const { error: deleteError } = await supabase
      .from("players")
      .delete()
      .eq("id", playerId);

    if (deleteError) {
      console.error("Error kicking player:", deleteError);
      return NextResponse.json(
        { error: "Failed to kick player" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Player kicked successfully" });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

/**
 * GET /api/game/[id]/player/[playerId]
 * Get player details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  try {
    const { id: gameId, playerId } = await params;
    await requireAuth();

    const supabase = await createClient();

    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("*")
      .eq("id", playerId)
      .eq("game_id", gameId)
      .single();

    if (playerError || !player) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(player);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

