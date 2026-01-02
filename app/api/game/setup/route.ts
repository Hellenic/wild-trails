import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, handleApiError } from "@/lib/api/auth";
import { createGameSchema } from "@/lib/api/validation";
import type { GameMode, GameMaster } from "@/lib/game/constants";
import { isRoleValidForGameMode, type GameRole } from "@/lib/game/roles";

// Determine game mode based on player count
function determineGameMode(playerCount: number): GameMode {
  if (playerCount === 1) return "single_player";
  if (playerCount === 2) return "two_player";
  return "multi_player";
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createGameSchema.parse(body);

    const supabase = await createClient();

    // Generate game code for multiplayer games
    let gameCode: string | null = null;
    if (validatedData.generate_game_code || validatedData.player_count > 1) {
      // Generate unique game code
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let isUnique = false;
      let attempts = 0;
      
      while (!isUnique && attempts < 10) {
        gameCode = Array.from({ length: 6 }, () => 
          chars.charAt(Math.floor(Math.random() * chars.length))
        ).join("");
        
        // Check if code already exists
        const { data: existingGame } = await supabase
          .from("games")
          .select("id")
          .eq("game_code", gameCode)
          .single();
        
        if (!existingGame) {
          isUnique = true;
        }
        attempts++;
      }

      // If we couldn't generate a unique code after all attempts, return an error
      if (!isUnique) {
        console.error("Failed to generate unique game code after 10 attempts");
        return NextResponse.json(
          { error: "Failed to generate unique game code. Please try again." },
          { status: 503 }
        );
      }
    }

    // Determine game mode based on player count
    const gameMode = determineGameMode(validatedData.player_count);

    // Create the game
    const { data: game, error } = await supabase
      .from("games")
      .insert({
        creator_id: user.id,
        status: "setup",
        name: validatedData.name,
        password: validatedData.password,
        player_count: validatedData.player_count,
        max_players: validatedData.max_players || validatedData.player_count,
        game_code: gameCode,
        selected_role: validatedData.selected_role || null,
        max_radius: validatedData.max_radius,
        bounding_box: validatedData.bounding_box,
        duration: validatedData.duration,
        game_master: validatedData.game_master,
        game_mode: gameMode,
        difficulty: validatedData.difficulty || "easy",
        starting_point: validatedData.starting_point || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating game:", error);
      return NextResponse.json(
        { error: "Failed to create game", details: error.message },
        { status: 500 }
      );
    }

    // Create a player for the creator, if they've selected a role
    if (validatedData.selected_role) {
      const selectedRole = validatedData.selected_role as GameRole;
      const gameMasterType = (validatedData.game_master || "ai") as GameMaster;
      
      // Validate the role is valid for this game configuration
      if (!isRoleValidForGameMode(selectedRole, gameMode, gameMasterType)) {
        // Role is invalid - log warning but don't create the player
        // The creator can join with a valid role later
        console.warn(
          `Invalid role "${selectedRole}" for game mode "${gameMode}" with GM type "${gameMasterType}". Skipping player creation.`
        );
      } else {
        const { error: playerError } = await supabase.from("players").insert({
          game_id: game.id,
          user_id: user.id,
          role: selectedRole,
          status: "waiting",
        });

        if (playerError) {
          console.error("Error creating player:", playerError);
          // Don't fail the request, but log the error
        }
      }
    }

    // Note: AI game point generation is handled by the cron job (/api/cron/process-games)
    // The cron runs every minute and processes all games with status="setup" and game_master="ai"

    return NextResponse.json(game, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

