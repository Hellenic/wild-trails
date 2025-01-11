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

  private getCardinalDirection(bearing: number): string {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  }

  private generateHint(
    point: { lat: number; lng: number },
    endPoint: { lat: number; lng: number }
  ): string {
    // Calculate distance in kilometers
    const distance = Math.sqrt(
      Math.pow((point.lat - endPoint.lat) * 111, 2) +
        Math.pow(
          (point.lng - endPoint.lng) *
            111 *
            Math.cos((point.lat * Math.PI) / 180),
          2
        )
    );

    // Calculate bearing
    const dLon = ((endPoint.lng - point.lng) * Math.PI) / 180;
    const lat1 = (point.lat * Math.PI) / 180;
    const lat2 = (endPoint.lat * Math.PI) / 180;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    let bearing = (Math.atan2(y, x) * 180) / Math.PI;
    bearing = (bearing + 360) % 360; // Normalize to 0-360

    // Convert bearing to cardinal direction
    const direction = this.getCardinalDirection(bearing);

    // Add some randomness to distance
    const roughDistance = Math.round(distance * 10) / 10;
    const randomizedDistance = roughDistance + (Math.random() - 0.5) * 0.3; // ±150m variance

    return `The goal is approximately ${randomizedDistance.toFixed(1)} km to the ${direction}`;
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

    // Generate intermediate points with hints
    for (let i = 0; i < numPoints; i++) {
      const point = this.generateRandomPointInBox(boundingBox);
      points.push({
        latitude: point.lat,
        longitude: point.lng,
        sequence_number: i + 1,
        hint: this.generateHint(point, endPoint),
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
