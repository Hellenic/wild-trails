import type { Game } from "@/types/game";
import type { GamePoint } from "@/types/game";
import { RandomStrategy } from "./strategies/random.strategy";
import { OSMStrategy } from "./strategies/osm.strategy";

export class GameAI {
  private strategies = {
    random: new RandomStrategy(),
    osm: new OSMStrategy(),
  };

  async generateGamePoints(
    game: Game,
    strategy: keyof typeof this.strategies = "osm"
  ): Promise<GamePoint[]> {
    console.log(`[GameAI] Generating points using '${strategy}' strategy for game ${game.id}`);
    try {
      const points = await this.strategies[strategy].generatePoints(game);
      console.log(`[GameAI] Successfully generated ${points.length} points using '${strategy}' strategy`);
      return points;
    } catch (error) {
      console.error(`[GameAI] Error generating points with '${strategy}' strategy:`, error);
      throw error;
    }
  }

  // You could add methods to combine strategies
  async generateMixedPoints(
    game: Game,
    strategies: Array<keyof typeof this.strategies>,
    distribution: number[] // percentages that sum to 100
  ): Promise<GamePoint[]> {
    // Implementation for mixed strategy generation
    // This would generate some points with one strategy and others with another
    console.log(
      "TODO Generating mixed points for game:",
      game.id,
      game,
      strategies,
      distribution
    );
    return [] as GamePoint[];
  }
}

// Export a singleton instance
export const gameAI = new GameAI();
