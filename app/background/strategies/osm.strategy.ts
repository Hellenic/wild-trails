import type { Game } from "@/types/game";
import type { GamePoint } from "@/types/game";
import type {
  FeatureCollection,
  Feature,
  Point,
  Polygon,
  MultiPolygon,
} from "geojson";
import { booleanPointInPolygon, buffer } from "@turf/turf";
import osmtogeojson from "osmtogeojson";
import {
  PointGenerationStrategy,
  BoundingBox,
  convertToBoundingBox,
} from "./base.strategy";

const DEFAULT_MAX_RADIUS = 5;
const DEFAULT_MAX_ATTEMPTS = 20;
const BUFFER_DISTANCE = 0.0001;

export class OSMStrategy implements PointGenerationStrategy {
  name = "osm";

  private async getOSMData(
    boundingBox: BoundingBox
  ): Promise<FeatureCollection> {
    try {
      const query = `
        [out:json][timeout:25];
        (
          // Water features
          way["natural"="water"](${boundingBox.min_lat},${boundingBox.min_lng},${boundingBox.max_lat},${boundingBox.max_lng});
          way["waterway"](${boundingBox.min_lat},${boundingBox.min_lng},${boundingBox.max_lat},${boundingBox.max_lng});
          relation["natural"="water"](${boundingBox.min_lat},${boundingBox.min_lng},${boundingBox.max_lat},${boundingBox.max_lng});
          
          // Buildings and urban areas
          way["building"](${boundingBox.min_lat},${boundingBox.min_lng},${boundingBox.max_lat},${boundingBox.max_lng});
          way["landuse"="residential"](${boundingBox.min_lat},${boundingBox.min_lng},${boundingBox.max_lat},${boundingBox.max_lng});
          way["landuse"="industrial"](${boundingBox.min_lat},${boundingBox.min_lng},${boundingBox.max_lat},${boundingBox.max_lng});
          way["landuse"="commercial"](${boundingBox.min_lat},${boundingBox.min_lng},${boundingBox.max_lat},${boundingBox.max_lng});
          
          // Other restricted areas
          way["leisure"="swimming_pool"](${boundingBox.min_lat},${boundingBox.min_lng},${boundingBox.max_lat},${boundingBox.max_lng});
          way["natural"="wetland"](${boundingBox.min_lat},${boundingBox.min_lng},${boundingBox.max_lat},${boundingBox.max_lng});
          way["landuse"="cemetery"](${boundingBox.min_lat},${boundingBox.min_lng},${boundingBox.max_lat},${boundingBox.max_lng});
          way["leisure"="garden"](${boundingBox.min_lat},${boundingBox.min_lng},${boundingBox.max_lat},${boundingBox.max_lng});
        );
        out geom;
      `;

      const response = await fetch(
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error(`OSM API error: ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("json")) {
        throw new Error("Expected JSON response from OSM API");
      }

      const osmData = await response.json();
      return osmtogeojson(osmData) as FeatureCollection;
    } catch (error) {
      console.error("Error fetching OSM data:", error);
      return {
        type: "FeatureCollection",
        features: [],
      };
    }
  }

  private async isAccessiblePoint(
    point: { lat: number; lng: number },
    osmData: FeatureCollection
  ): Promise<boolean> {
    const pointGeoJSON: Feature<Point> = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Point",
        coordinates: [point.lng, point.lat],
      },
    };

    for (const feature of osmData.features) {
      if (
        // Water features
        feature.properties?.natural === "water" ||
        feature.properties?.waterway ||
        feature.properties?.natural === "wetland" ||
        // Buildings and urban areas
        feature.properties?.building ||
        feature.properties?.landuse === "residential" ||
        feature.properties?.landuse === "industrial" ||
        feature.properties?.landuse === "commercial" ||
        // Other restricted areas
        feature.properties?.leisure === "swimming_pool" ||
        feature.properties?.leisure === "garden" ||
        feature.properties?.landuse === "cemetery"
      ) {
        if (
          feature.geometry.type === "Polygon" ||
          feature.geometry.type === "MultiPolygon"
        ) {
          const polygonFeature = feature as Feature<Polygon | MultiPolygon>;

          // Check if point is inside the feature
          if (booleanPointInPolygon(pointGeoJSON, polygonFeature)) {
            return false;
          }

          // Add buffer around the feature and check if point is too close
          const buffered = buffer(polygonFeature, BUFFER_DISTANCE);
          if (buffered && booleanPointInPolygon(pointGeoJSON, buffered)) {
            return false;
          }
        }
      }
    }

    return true;
  }

  private generateRandomPointBasic(
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

  private async generateRandomPoint(
    center: [number, number],
    radiusInKm: number,
    osmData: FeatureCollection,
    maxAttempts: number = DEFAULT_MAX_ATTEMPTS
  ): Promise<{ lat: number; lng: number }> {
    for (let i = 0; i < maxAttempts; i++) {
      const point = this.generateRandomPointBasic(center, radiusInKm);
      if (await this.isAccessiblePoint(point, osmData)) {
        return point;
      }
    }

    // If we can't find a point after max attempts, try with a larger radius
    const point = this.generateRandomPointBasic(center, radiusInKm * 1.5);
    if (await this.isAccessiblePoint(point, osmData)) {
      return point;
    }

    throw new Error("Could not find accessible point after maximum attempts");
  }

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

  async generatePoints(game: Game): Promise<GamePoint[]> {
    const boundingBox = convertToBoundingBox(game);
    const osmData = await this.getOSMData(boundingBox);
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

    // Generate ending point within max_radius of the center
    const centerPoint = {
      latitude: (boundingBox.min_lat + boundingBox.max_lat) / 2,
      longitude: (boundingBox.min_lng + boundingBox.max_lng) / 2,
    };

    const endPoint = await this.generateRandomPoint(
      [centerPoint.latitude, centerPoint.longitude],
      game.max_radius || DEFAULT_MAX_RADIUS,
      osmData
    );

    // Calculate center point between start and end
    const centerLat = (startingPoint.lat + endPoint.lat) / 2;
    const centerLng = (startingPoint.lng + endPoint.lng) / 2;

    // Calculate distance between start and end points
    const distance =
      Math.sqrt(
        Math.pow(startingPoint.lat - endPoint.lat, 2) +
          Math.pow(startingPoint.lng - endPoint.lng, 2)
      ) * 111; // Convert to kilometers

    // Generate intermediate points
    for (let i = 0; i < numPoints; i++) {
      // Generate points with increasing spread as we get further from start
      const spreadFactor = (i + 1) / numPoints; // 0.2 to 1.0
      const point = await this.generateRandomPoint(
        [centerLat, centerLng],
        (distance / 2) * spreadFactor,
        osmData
      );

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
