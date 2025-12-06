import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, handleApiError } from "@/lib/api/auth";
import { joinGameSchema } from "@/lib/api/validation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params;
    const user = await requireAuth();

    const body = await request.json();
    const validatedData = joinGameSchema.parse(body);

    const supabase = await createClient();

    // Verify game exists and is joinable
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("id, status")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    // Check if user is already a player
    const { data: existingPlayer } = await supabase
      .from("players")
      .select("id")
      .eq("game_id", gameId)
      .eq("user_id", user.id)
      .single();

    if (existingPlayer) {
      return NextResponse.json(
        { error: "You are already a player in this game" },
        { status: 400 }
      );
    }

    // Create player record
    const { data: player, error: playerError } = await supabase
      .from("players")
      .insert({
        game_id: gameId,
        user_id: user.id,
        role: validatedData.role,
      })
      .select()
      .single();

    if (playerError) {
      console.error("Error creating player:", playerError);
      return NextResponse.json(
        { error: "Failed to join game", details: playerError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(player, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

