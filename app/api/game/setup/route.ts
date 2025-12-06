import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, handleApiError } from "@/lib/api/auth";
import { createGameSchema } from "@/lib/api/validation";
import { processCreateGame } from "@/app/background/background_process";

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

    // Generate points if AI is game master
    if (validatedData.game_master === "ai") {
      // Trigger point generation in the background
      // Don't await to avoid blocking the response
      processCreateGame(game.id).catch((error) => {
        console.error("Error while processing the game:", error);
      });
    }

    return NextResponse.json(game, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

