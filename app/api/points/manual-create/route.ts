import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireGameCreator, handleApiError } from "@/lib/api/auth";
import { createPointsSchema } from "@/lib/api/validation";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const validatedData = createPointsSchema.parse(body);

    // Extract game_id from first point (all points should have same game_id)
    if (validatedData.points.length === 0) {
      return NextResponse.json(
        { error: "At least one point is required" },
        { status: 400 }
      );
    }

    // Get game_id from URL or body (we'll expect it in the body for now)
    const game_id = body.game_id;
    if (!game_id) {
      return NextResponse.json(
        { error: "game_id is required" },
        { status: 400 }
      );
    }

    // Verify user is the game creator
    await requireGameCreator(user.id, game_id);

    const supabase = await createClient();

    // Convert points to database format
    const gamePoints = validatedData.points.map((point, index) => ({
      id: point.id,
      game_id: game_id,
      type: point.type,
      status: "unvisited" as const,
      latitude: point.position[0],
      longitude: point.position[1],
      sequence_number: index + 1,
      hint: point.hint || null,
    }));

    // Insert all points
    const { data: insertedPoints, error } = await supabase
      .from("game_points")
      .insert(gamePoints)
      .select();

    if (error) {
      console.error("Error saving game points:", error);
      return NextResponse.json(
        { error: "Failed to save game points", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: insertedPoints?.length || 0,
      points: insertedPoints,
    }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

