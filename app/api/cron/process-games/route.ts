import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@supabase/supabase-js";
import { processCreateGame } from "@/app/background/background_process";
import type { Database } from "@/types/database.types";

export const maxDuration = 60; // Vercel Hobby plan max (60 seconds)

const MAX_ATTEMPTS = 3;
const PROCESSING_TIMEOUT_MINUTES = 10; // Consider stuck if processing for > 10 min

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
    
    const now = new Date();
    const staleProcessingThreshold = new Date(now.getTime() - PROCESSING_TIMEOUT_MINUTES * 60 * 1000);
    
    // Find all games that need processing with retry logic
    // Include games that:
    // 1. Are in setup status with game_master='ai'
    // 2. Have not exceeded max attempts (< 3)
    // 3. Either never started processing OR started processing but got stuck (> 10 min ago)
    const { data: games, error } = await supabase
      .from('games')
      .select('id, name, game_master, processing_attempts, processing_started_at')
      .eq('status', 'setup')
      .eq('game_master', 'ai')
      .lt('processing_attempts', MAX_ATTEMPTS)
      .or(`processing_started_at.is.null,processing_started_at.lt.${staleProcessingThreshold.toISOString()}`);

    if (error) throw error;

    if (!games || games.length === 0) {
      console.log('[Cron] No games to process');
      return NextResponse.json({ 
        message: 'No games to process',
        processed: 0 
      });
    }

    console.log(`[Cron] Found ${games.length} games to process:`, games.map(g => ({
      id: g.id,
      attempts: g.processing_attempts
    })));

    // Mark games as being processed to prevent duplicate processing
    const gameIds = games.map(g => g.id);
    await supabase
      .from('games')
      .update({ processing_started_at: now.toISOString() })
      .in('id', gameIds);

    // Process each game with exponential backoff tracking
    const results = await Promise.allSettled(
      games.map(game => 
        processCreateGame(game.id, game.processing_attempts || 0)
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`[Cron] Processing complete: ${successful} successful, ${failed} failed`);

    return NextResponse.json({
      message: 'Processing complete',
      total: games.length,
      successful,
      failed,
      games: games.map(g => ({
        id: g.id,
        attempts: g.processing_attempts
      }))
    });

  } catch (error) {
    console.error('[Cron] Error processing games:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

