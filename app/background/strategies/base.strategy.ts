import type { Game } from "@/types/game";
import type { GamePoint } from "@/types/game";

export interface PointGenerationStrategy {
  name: string;
  generatePoints(game: Game): Promise<GamePoint[]>;
}

export type BoundingBox = {
  min_lat: number;
  min_lng: number;
  max_lat: number;
  max_lng: number;
};

// Utility functions that can be used by all strategies
export function convertToBoundingBox(game: Game): BoundingBox {
  return {
    min_lat: Math.min(
      game.bounding_box.northWest.lat,
      game.bounding_box.southEast.lat
    ),
    max_lat: Math.max(
      game.bounding_box.northWest.lat,
      game.bounding_box.southEast.lat
    ),
    min_lng: Math.min(
      game.bounding_box.northWest.lng,
      game.bounding_box.southEast.lng
    ),
    max_lng: Math.max(
      game.bounding_box.northWest.lng,
      game.bounding_box.southEast.lng
    ),
  };
}
