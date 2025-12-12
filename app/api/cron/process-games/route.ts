import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@supabase/supabase-js";
import { processCreateGame } from "@/app/background/background_process";
import type { Database } from "@/types/database.types";

export const maxDuration = 60; // Vercel Hobby plan max (60 seconds)

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Use service role key to bypass RLS for cron jobs
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_API_KEY!
    );
    
    // Find all games that need processing
    const { data: games, error } = await supabase
      .from('games')
      .select('id, name, game_master')
      .eq('status', 'setup')
      .eq('game_master', 'ai');

    if (error) throw error;

    if (!games || games.length === 0) {
      return NextResponse.json({ 
        message: 'No games to process',
        processed: 0 
      });
    }

    console.log(`[Cron] Found ${games.length} games to process:`, games.map(g => g.id));

    // Process each game
    const results = await Promise.allSettled(
      games.map(game => processCreateGame(game.id))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`[Cron] Processing complete: ${successful} successful, ${failed} failed`);

    return NextResponse.json({
      message: 'Processing complete',
      total: games.length,
      successful,
      failed,
      games: games.map(g => g.id)
    });

  } catch (error) {
    console.error('[Cron] Error processing games:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

