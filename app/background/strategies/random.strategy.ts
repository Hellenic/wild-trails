import type { Game } from "@/types/game";
import type { GamePoint } from "@/types/game";
import {
  PointGenerationStrategy,
  BoundingBox,
  convertToBoundingBox,
} from "./base.strategy";

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

  async generatePoints(game: Game): Promise<GamePoint[]> {
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
      created_at: null,
      game_id: null,
      id: crypto.randomUUID(),
      status: "unvisited",
      updated_at: null,
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

    // Generate intermediate points
    for (let i = 0; i < numPoints; i++) {
      const point = this.generateRandomPointInBox(boundingBox);
      points.push({
        latitude: point.lat,
        longitude: point.lng,
        sequence_number: i + 1,
        hint: `This is point ${i + 1}`,
        type: "clue",
        created_at: null,
        game_id: null,
        id: crypto.randomUUID(),
        status: "unvisited",
        updated_at: null,
      });
    }

    // Add ending point
    points.push({
      latitude: endPoint.lat,
      longitude: endPoint.lng,
      sequence_number: numPoints + 1,
      hint: "Ending point",
      type: "end",
      created_at: null,
      game_id: null,
      id: crypto.randomUUID(),
      status: "unvisited",
      updated_at: null,
    });

    return points;
  }
}
