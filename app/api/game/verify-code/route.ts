import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAuth, handleApiError } from "@/lib/api/auth";
import { z } from "zod";

const verifyCodeSchema = z.object({
  code: z.string().min(1).max(10),
  password: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = verifyCodeSchema.parse(body);

    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Normalize game code: uppercase and remove spaces
    const normalizedCode = validatedData.code.toUpperCase().replace(/\s/g, "");

    // Fetch game by game code - including password for server-side validation only
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select(`
        id,
        name,
        game_code,
        game_mode,
        game_master,
        max_players,
        player_count,
        status,
        password
      `)
      .eq("game_code", normalizedCode)
      .single();

    if (gameError || !game) {
      return NextResponse.json(
        { error: "Game not found. Please check the game code." },
        { status: 404 }
      );
    }

    // Server-side password validation
    if (game.password && game.password !== validatedData.password) {
      return NextResponse.json(
        { error: "Incorrect password." },
        { status: 401 }
      );
    }

    // Check game status
    if (game.status === "completed") {
      return NextResponse.json(
        { error: "This game has already been completed." },
        { status: 400 }
      );
    }

    if (game.status === "active") {
      return NextResponse.json(
        { error: "This game is already in progress and cannot be joined." },
        { status: 400 }
      );
    }

    if (game.status === "failed") {
      return NextResponse.json(
        { error: "This game failed to set up properly." },
        { status: 400 }
      );
    }

    // Fetch players using admin client to bypass RLS
    // (new users can't see other players due to RLS policy)
    const { data: players, error: playersError } = await adminClient
      .from("players")
      .select("role, user_id")
      .eq("game_id", game.id);

    if (playersError) {
      console.error("Error fetching players:", playersError);
      return NextResponse.json(
        { error: "Failed to verify game availability." },
        { status: 500 }
      );
    }

    // Check if user is already a player
    const existingPlayer = players?.find((p) => p.user_id === user.id);
    
    // Check max players
    const currentPlayerCount = players?.length || 0;
    const maxPlayers = game.max_players || game.player_count;

    if (!existingPlayer && currentPlayerCount >= maxPlayers) {
      return NextResponse.json(
        { error: "This game is full." },
        { status: 400 }
      );
    }

    // Return game info WITHOUT the password
    return NextResponse.json({
      id: game.id,
      name: game.name,
      game_code: game.game_code,
      game_mode: game.game_mode,
      game_master: game.game_master,
      max_players: game.max_players,
      player_count: game.player_count,
      status: game.status,
      has_password: !!game.password,
      players: players || [],
      is_existing_player: !!existingPlayer,
      existing_player_role: existingPlayer?.role || null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

