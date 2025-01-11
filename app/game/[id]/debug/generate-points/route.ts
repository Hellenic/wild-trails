import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gameAI } from "../../../../background/game_ai";
import type { Game } from "@/types/game";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("games")
    .select()
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const points = await gameAI.generateGamePoints(data as Game, "osm");

  return NextResponse.json({ points });
}
