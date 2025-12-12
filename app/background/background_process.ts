// Kind of a background process manager, which in the future could actually be in the background
import { createClient } from "@supabase/supabase-js";
import { gameAI } from "./game_ai";
import type { Game } from "@/types/game";
import type { Database } from "@/types/database.types";

export const processCreateGame = async (gameId: string) => {
  console.log(`[BG Process] Starting game creation process for game ${gameId}`);
  
  try {
    // Use service role key to bypass RLS for background processing
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_API_KEY!
    );

    console.log(`[BG Process] Fetching game data...`);
    const { data, error } = await supabase
      .from("games")
      .select()
      .eq("id", gameId)
      .single();

    if (error || !data) {
      console.error("[BG Process] Error fetching game:", error);
      throw new Error(`Failed to fetch game: ${error?.message || 'Game not found'}`);
    }
    
    console.log(`[BG Process] Game fetched successfully:`, {
      id: data.id,
      name: data.name,
      game_master: data.game_master,
      status: data.status
    });

    // Note: Removed artificial delay to avoid serverless function timeouts
    // In production, the actual point generation provides sufficient delay

    console.log(`[BG Process] Generating game points using AI...`);
    const points = await gameAI.generateGamePoints(data as Game);
    console.log(`[BG Process] Generated ${points.length} points`);

    console.log(`[BG Process] Inserting points into database...`);
    const { error: insertError } = await supabase.from("game_points").insert(
      points.map((p) => ({
        ...p,
        game_id: data.id,
      }))
    );

    if (insertError) {
      console.error("[BG Process] Error inserting points:", insertError);
      throw new Error(`Failed to insert points: ${insertError.message}`);
    }
    console.log(`[BG Process] Points inserted successfully`);

    console.log(`[BG Process] Updating game status to 'ready'...`);
    const { error: statusUpdateError } = await supabase
      .from("games")
      .update({ status: "ready" })
      .eq("id", gameId);

    if (statusUpdateError) {
      console.error("[BG Process] Error updating game status:", statusUpdateError);
      throw new Error(`Failed to update game status: ${statusUpdateError.message}`);
    }
    
    console.log(`[BG Process] Game ${gameId} successfully created and ready!`);
    return { success: true, gameId };
    
  } catch (error) {
    console.error(`[BG Process] Failed to process game ${gameId}:`, error);
    
    // Mark game as failed for visibility
    try {
      const supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_API_KEY!
      );
      await supabase
        .from('games')
        .update({ 
          status: 'setup', // Keep in setup state so cron can retry
          // Could add an error_message column in future
        })
        .eq('id', gameId);
    } catch (updateError) {
      console.error(`[BG Process] Failed to update game status to failed:`, updateError);
    }
    
    throw error; // Re-throw for Promise.allSettled tracking
  }
};
