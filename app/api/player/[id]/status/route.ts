import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, handleApiError } from "@/lib/api/auth";
import { updatePlayerStatusSchema } from "@/lib/api/validation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playerId } = await params;
    const user = await requireAuth();

    const body = await request.json();
    const validatedData = updatePlayerStatusSchema.parse(body);

    const supabase = await createClient();

    // Verify the player belongs to the authenticated user
    const { data: existingPlayer, error: fetchError } = await supabase
      .from("players")
      .select("user_id")
      .eq("id", playerId)
      .single();

    if (fetchError || !existingPlayer) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    if (existingPlayer.user_id !== user.id) {
      return NextResponse.json(
        { error: "You can only update your own player status" },
        { status: 403 }
      );
    }

    // Update player status
    const { data: player, error } = await supabase
      .from("players")
      .update({ status: validatedData.status })
      .eq("id", playerId)
      .select()
      .single();

    if (error) {
      console.error("Error updating player status:", error);
      return NextResponse.json(
        { error: "Failed to update player status", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(player);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

