import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireGameCreator, handleApiError } from "@/lib/api/auth";
import { processCreateGame } from "@/app/background/background_process";
import { z } from "zod";

const generatePointsSchema = z.object({
  game_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const validatedData = generatePointsSchema.parse(body);

    // Verify user is the game creator
    await requireGameCreator(user.id, validatedData.game_id);

    // Trigger point generation in the background
    processCreateGame(validatedData.game_id).catch((error) => {
      console.error("Error while processing the game:", error);
    });

    return NextResponse.json({
      success: true,
      message: "Point generation started",
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

