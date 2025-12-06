import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireGamePlayer, handleApiError } from "@/lib/api/auth";
import { locationUpdateSchema } from "@/lib/api/validation";
import { checkProximity } from "@/lib/game/proximity";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const validatedData = locationUpdateSchema.parse(body);

    // Verify user is a player in the game
    const player = await requireGamePlayer(user.id, validatedData.game_id);

    // Verify the player_id matches the authenticated user's player record
    if (player.id !== validatedData.player_id) {
      return NextResponse.json(
        { error: "Player ID mismatch" },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Insert location
    const { error: locationError } = await supabase
      .from("player_locations")
      .insert({
        game_id: validatedData.game_id,
        player_id: validatedData.player_id,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        altitude: validatedData.altitude,
        altitude_accuracy: validatedData.altitude_accuracy,
        accuracy: validatedData.accuracy,
        speed: validatedData.speed,
        heading: validatedData.heading,
      });

    if (locationError) {
      console.error("Error inserting location:", locationError);
      return NextResponse.json(
        { error: "Failed to save location", details: locationError.message },
        { status: 500 }
      );
    }

    // Check proximity to game points
    const proximityEvents = await checkProximity(
      validatedData.game_id,
      validatedData.player_id,
      validatedData.latitude,
      validatedData.longitude
    );

    // Return success with any proximity events
    return NextResponse.json({
      success: true,
      proximity_events: proximityEvents.length > 0 ? proximityEvents : undefined,
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

