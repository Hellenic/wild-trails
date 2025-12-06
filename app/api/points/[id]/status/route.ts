import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireGameAccess, handleApiError } from "@/lib/api/auth";
import { updatePointStatusSchema } from "@/lib/api/validation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pointId } = await params;
    const user = await requireAuth();

    const body = await request.json();
    const validatedData = updatePointStatusSchema.parse(body);

    const supabase = await createClient();

    // Get the point to verify game access
    const { data: point, error: fetchError } = await supabase
      .from("game_points")
      .select("game_id")
      .eq("id", pointId)
      .single();

    if (fetchError || !point || !point.game_id) {
      return NextResponse.json(
        { error: "Point not found" },
        { status: 404 }
      );
    }

    // Verify user has access to the game
    await requireGameAccess(user.id, point.game_id);

    // Update point status
    const { data: updatedPoint, error } = await supabase
      .from("game_points")
      .update({ 
        status: validatedData.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pointId)
      .select()
      .single();

    if (error) {
      console.error("Error updating point status:", error);
      return NextResponse.json(
        { error: "Failed to update point status", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedPoint);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

