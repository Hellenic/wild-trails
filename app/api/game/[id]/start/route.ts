import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, handleApiError } from "@/lib/api/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params;
    const user = await requireAuth();

    const supabase = await createClient();

    // Verify game exists and user is the creator
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("id, status, creator_id")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    // Only the creator can start the game
    if (game.creator_id !== user.id) {
      return NextResponse.json(
        { error: "Only the game creator can start the game" },
        { status: 403 }
      );
    }

    // Check game is in a valid state to start (must be "ready" with waypoints generated)
    if (game.status !== "ready") {
      const errorMessages: Record<string, string> = {
        setup: "Game is still being set up. Please wait for waypoints to be generated.",
        active: "Game is already active.",
        completed: "Game has already been completed.",
        failed: "Game setup failed. Please create a new game.",
      };
      return NextResponse.json(
        { error: errorMessages[game.status] || `Cannot start game in "${game.status}" state.` },
        { status: 400 }
      );
    }

    // Get all players and verify they're all ready
    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("id, status")
      .eq("game_id", gameId);

    if (playersError) {
      console.error("Error fetching players:", playersError);
      return NextResponse.json(
        { error: "Failed to verify player statuses" },
        { status: 500 }
      );
    }

    if (!players || players.length === 0) {
      return NextResponse.json(
        { error: "No players in the game" },
        { status: 400 }
      );
    }

    const allReady = players.every((p) => p.status === "ready");
    if (!allReady) {
      return NextResponse.json(
        { error: "Not all players are ready" },
        { status: 400 }
      );
    }

    // Start the game atomically:
    // 1. Update game status to "active"
    // 2. Update all players to "playing"
    
    // Update game status and set started_at timestamp
    const { error: gameUpdateError } = await supabase
      .from("games")
      .update({ 
        status: "active",
        started_at: new Date().toISOString(),
      })
      .eq("id", gameId);

    if (gameUpdateError) {
      console.error("Error updating game status:", gameUpdateError);
      return NextResponse.json(
        { error: "Failed to start game" },
        { status: 500 }
      );
    }

    // Update all players to playing status
    const { error: playersUpdateError } = await supabase
      .from("players")
      .update({ status: "playing" })
      .eq("game_id", gameId);

    if (playersUpdateError) {
      // Try to rollback game status if player update fails
      console.error("Error updating player statuses:", playersUpdateError);
      await supabase
        .from("games")
        .update({ status: game.status, started_at: null })
        .eq("id", gameId);
      
      return NextResponse.json(
        { error: "Failed to update player statuses. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      gameId,
      status: "active" 
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

