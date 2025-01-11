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
    return this.strategies[strategy].generatePoints(game);
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
