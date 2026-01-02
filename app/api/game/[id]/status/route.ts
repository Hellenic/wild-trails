import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireGameAccess, handleApiError } from "@/lib/api/auth";
import { updateGameStatusSchema } from "@/lib/api/validation";
import type { GameStatus } from "@/lib/game/constants";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params;
    const user = await requireAuth();
    await requireGameAccess(user.id, gameId);

    const supabase = await createClient();
    const { data: game, error } = await supabase
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single();

    if (error || !game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(game);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params;
    const user = await requireAuth();
    await requireGameAccess(user.id, gameId);

    const body = await request.json();
    const validatedData = updateGameStatusSchema.parse(body);

    const supabase = await createClient();

    // Calculate timestamps based on status
    const updates: {
      status: GameStatus;
      started_at?: string;
      ended_at?: string;
    } = {
      status: validatedData.status,
    };

    if (validatedData.status === "active") {
      updates.started_at = new Date().toISOString();
    } else if (validatedData.status === "completed") {
      updates.ended_at = new Date().toISOString();
    }

    const { data: game, error } = await supabase
      .from("games")
      .update(updates)
      .eq("id", gameId)
      .select()
      .single();

    if (error) {
      console.error("Error updating game status:", error);
      return NextResponse.json(
        { error: "Failed to update game status", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(game);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

