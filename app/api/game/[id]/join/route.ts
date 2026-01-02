import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAuth, handleApiError } from "@/lib/api/auth";
import { joinGameSchema } from "@/lib/api/validation";
import { isRoleValidForGameMode, type GameRole } from "@/lib/game/roles";

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
      .select("id, status, password, max_players, player_count, game_mode, game_master")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    // Verify password if provided and game has a password
    if (game.password && validatedData.password !== game.password) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // Check game status
    if (game.status === "completed") {
      return NextResponse.json(
        { error: "This game has already been completed" },
        { status: 400 }
      );
    }

    if (game.status === "active") {
      return NextResponse.json(
        { error: "This game is already in progress and cannot be joined" },
        { status: 400 }
      );
    }

    if (game.status === "failed") {
      return NextResponse.json(
        { error: "This game failed to set up properly" },
        { status: 400 }
      );
    }

    // Check if user is already a player
    const { data: existingPlayer } = await supabase
      .from("players")
      .select("id, role")
      .eq("game_id", gameId)
      .eq("user_id", user.id)
      .single();

    if (existingPlayer) {
      return NextResponse.json(
        { error: "You are already a player in this game", player: existingPlayer },
        { status: 400 }
      );
    }

    // Get current players to check max_players limit and role availability
    const { data: currentPlayers, error: playersError } = await supabase
      .from("players")
      .select("id, role, user_id")
      .eq("game_id", gameId);

    if (playersError) {
      console.error("Error fetching players:", playersError);
      return NextResponse.json(
        { error: "Failed to verify game capacity" },
        { status: 500 }
      );
    }

    // Check max_players limit
    const maxPlayers = game.max_players || game.player_count;
    if (currentPlayers && currentPlayers.length >= maxPlayers) {
      return NextResponse.json(
        { error: "This game is full" },
        { status: 400 }
      );
    }

    // Validate role is allowed for this game configuration
    const gameMasterType = (game.game_master as "ai" | "player") || "ai";
    const requestedRole = validatedData.role as GameRole;
    
    if (!isRoleValidForGameMode(requestedRole, game.game_mode, gameMasterType)) {
      return NextResponse.json(
        { error: `The role "${validatedData.role}" is not available for this game configuration` },
        { status: 400 }
      );
    }

    // Check role availability (no duplicate roles in multiplayer)
    if (game.game_mode !== "single_player") {
      const roleTaken = currentPlayers?.some(
        (p) => p.role === validatedData.role
      );
      if (roleTaken) {
        return NextResponse.json(
          { error: `The role "${validatedData.role}" is already taken` },
          { status: 400 }
        );
      }
    }

    // Create player record using admin client (bypasses RLS)
    // We've already validated user auth, game state, and role availability above
    // The database has a unique constraint on (game_id, role) to prevent race conditions
    const adminClient = createAdminClient();
    const { data: player, error: playerError } = await adminClient
      .from("players")
      .insert({
        game_id: gameId,
        user_id: user.id,
        role: validatedData.role,
        status: "waiting",
      })
      .select()
      .single();

    if (playerError) {
      console.error("Error creating player:", playerError);
      
      // Handle unique constraint violation on (game_id, role)
      // This catches the race condition where two players simultaneously try to join with the same role
      if (playerError.code === "23505" && playerError.message?.includes("players_game_role_unique")) {
        return NextResponse.json(
          { error: `The role "${validatedData.role}" was just taken by another player. Please choose a different role.` },
          { status: 409 }
        );
      }
      
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
