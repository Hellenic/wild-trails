import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateGamePoints } from "../../../../background/game_ai";
import type { Game } from "@/types/game";

const GAME_ID = "c4661e0e-5e9e-40ab-a6dd-812fa1917c86";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("games")
    .select()
    .eq("id", GAME_ID)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const points = await generateGamePoints(data as Game);

  return NextResponse.json({ points });
}
