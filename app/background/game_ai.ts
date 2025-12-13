import type { Game } from "@/types/game";
import type { GamePoint } from "@/types/game";
import { RandomStrategy } from "./strategies/random.strategy";
import { OSMStrategy } from "./strategies/osm.strategy";
import type { PointGenerationOptions } from "./strategies/base.strategy";

export class GameAI {
  private strategies = {
    random: new RandomStrategy(),
    osm: new OSMStrategy(),
  };

  async generateGamePoints(
    game: Game,
    strategy: keyof typeof this.strategies = "osm",
    options?: PointGenerationOptions
  ): Promise<GamePoint[]> {
    console.log(`[GameAI] Generating points using '${strategy}' strategy for game ${game.id}`);
    console.log(`[GameAI] Options:`, options);
    
    try {
      // Pass options down to the strategy
      const points = await this.strategies[strategy].generatePoints(game, options);
      console.log(`[GameAI] Successfully generated ${points.length} points using '${strategy}' strategy`);
      return points;
    } catch (error) {
      console.error(`[GameAI] Error generating points with '${strategy}' strategy:`, error);
      throw error;
    }
  }

  /**
   * Generate points using multiple strategies combined
   * Currently not implemented - OSM strategy with AI hints covers most use cases
   * 
   * Future use case: Mix OSM-placed points with completely AI-generated points
   * or combine different placement strategies for varied terrain
   */
  async generateMixedPoints(
    game: Game,
    strategies: Array<keyof typeof this.strategies>,
    distribution: number[] // percentages that sum to 100
  ): Promise<GamePoint[]> {
    // Not implemented yet - OSM + AI hints is sufficient for MVP
    console.warn(
      "[GameAI] Mixed strategy generation not implemented. Use 'osm' strategy instead.",
      { game: game.id, strategies, distribution }
    );
    // Fallback to OSM
    return this.generateGamePoints(game, "osm");
  }
}

// Export a singleton instance
export const gameAI = new GameAI();
