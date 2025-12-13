import type { Game } from "@/types/game";
import type { GamePoint } from "@/types/game";
import {
  PointGenerationStrategy,
  PointGenerationOptions,
  BoundingBox,
  convertToBoundingBox,
} from "./base.strategy";
import { calculateBearing, getCardinalDirection, calculateDistance } from "../geo-utils";

const DEFAULT_MAX_RADIUS = 5;

export class RandomStrategy implements PointGenerationStrategy {
  name = "random";

  private generateRandomPointInBox(boundingBox: BoundingBox) {
    return {
      lat:
        boundingBox.min_lat +
        Math.random() * (boundingBox.max_lat - boundingBox.min_lat),
      lng:
        boundingBox.min_lng +
        Math.random() * (boundingBox.max_lng - boundingBox.min_lng),
    };
  }

  private generateRandomPointAroundCenter(
    center: [number, number],
    radiusInKm: number
  ) {
    const radiusInDeg = radiusInKm / 111;
    const w = radiusInDeg * Math.sqrt(Math.random());
    const t = 2 * Math.PI * Math.random();
    const x = w * Math.cos(t);
    const y = w * Math.sin(t);

    return {
      lat: center[0] + y,
      lng: center[1] + x,
    };
  }

  private generateHint(
    point: { lat: number; lng: number },
    endPoint: { lat: number; lng: number }
  ): string {
    // Calculate distance and direction using shared utilities
    const distance = calculateDistance(point, endPoint);
    const bearing = calculateBearing(point, endPoint);
    const direction = getCardinalDirection(bearing);

    // Add some randomness to distance
    const roughDistance = Math.round(distance * 10) / 10;
    const randomizedDistance = roughDistance + (Math.random() - 0.5) * 0.3; // ±150m variance

    return `The goal is approximately ${randomizedDistance.toFixed(1)} km to the ${direction}`;
  }

  async generatePoints(game: Game, options?: PointGenerationOptions): Promise<GamePoint[]> {
    // Random strategy doesn't use AI hints currently, but accepts options for interface consistency
    const useAIHints = options?.useAIHints ?? false; // Random strategy defaults to false
    console.log(`[Random] AI hints option: ${useAIHints} (not implemented for random strategy)`);
    
    const boundingBox = convertToBoundingBox(game);
    const numPoints = Math.floor(Math.random() * 4) + 4; // 4-7 points
    const points: GamePoint[] = [];

    // Generate starting point if not defined
    const startingPoint =
      game.starting_point ?? this.generateRandomPointInBox(boundingBox);

    points.push({
      latitude: startingPoint.lat,
      longitude: startingPoint.lng,
      sequence_number: 0,
      hint: "Starting point",
      type: "start",
      game_id: null,
      id: crypto.randomUUID(),
      status: "unvisited",
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });

    // Generate ending point
    const centerPoint = {
      latitude: (boundingBox.min_lat + boundingBox.max_lat) / 2,
      longitude: (boundingBox.min_lng + boundingBox.max_lng) / 2,
    };

    const endPoint = this.generateRandomPointAroundCenter(
      [centerPoint.latitude, centerPoint.longitude],
      game.max_radius || DEFAULT_MAX_RADIUS
    );

    // Generate intermediate points with hints
    for (let i = 0; i < numPoints; i++) {
      const point = this.generateRandomPointInBox(boundingBox);
      points.push({
        latitude: point.lat,
        longitude: point.lng,
        sequence_number: i + 1,
        hint: this.generateHint(point, endPoint),
        type: "clue",
        game_id: null,
        id: crypto.randomUUID(),
        status: "unvisited",
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    }

    // Add ending point
    points.push({
      latitude: endPoint.lat,
      longitude: endPoint.lng,
      sequence_number: numPoints + 1,
      hint: "Ending point",
      type: "end",
      game_id: null,
      id: crypto.randomUUID(),
      status: "unvisited",
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });

    return points;
  }
}
