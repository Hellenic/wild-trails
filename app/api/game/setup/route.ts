import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, handleApiError } from "@/lib/api/auth";
import { createGameSchema } from "@/lib/api/validation";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createGameSchema.parse(body);

    const supabase = await createClient();

    // Create the game
    const { data: game, error } = await supabase
      .from("games")
      .insert({
        creator_id: user.id,
        status: "setup",
        name: validatedData.name,
        password: validatedData.password,
        player_count: validatedData.player_count,
        selected_role: validatedData.selected_role || null,
        max_radius: validatedData.max_radius,
        bounding_box: validatedData.bounding_box,
        duration: validatedData.duration,
        game_master: validatedData.game_master,
        game_mode: validatedData.game_mode,
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
      const { error: playerError } = await supabase.from("players").insert({
        game_id: game.id,
        user_id: user.id,
        role: validatedData.selected_role,
      });

      if (playerError) {
        console.error("Error creating player:", playerError);
        // Don't fail the request, but log the error
      }
    }

    // Note: AI game point generation is handled by the cron job (/api/cron/process-games)
    // The cron runs every minute and processes all games with status="setup" and game_master="ai"

    return NextResponse.json(game, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

