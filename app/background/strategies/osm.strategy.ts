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
const BUFFER_DISTANCE = 0.0002;

interface NearbyFeature {
  type: string;
  name?: string;
  distance: number;
  direction: string;
}

export class OSMStrategy implements PointGenerationStrategy {
  name = "osm";

  private async getOSMData(
    boundingBox: BoundingBox
  ): Promise<FeatureCollection> {
    try {
      console.log("[OSM] Fetching OSM data for bounding box:", boundingBox);
      
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

      console.log("[OSM] Sending request to Overpass API...");
      const response = await fetch(
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        console.error("[OSM] API error:", response.status, response.statusText);
        throw new Error(`OSM API error: ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("json")) {
        console.error("[OSM] Unexpected content type:", contentType);
        throw new Error("Expected JSON response from OSM API");
      }

      const osmData = await response.json();
      const geoJSON = osmtogeojson(osmData) as FeatureCollection;
      console.log(`[OSM] Successfully fetched ${geoJSON.features.length} features`);
      
      return geoJSON;
    } catch (error) {
      console.error("[OSM] Error fetching OSM data:", error);
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
    console.log(`[OSM] Generating random point near [${center}] with radius ${radiusInKm}km`);
    
    for (let i = 0; i < maxAttempts; i++) {
      const point = this.generateRandomPointBasic(center, radiusInKm);
      if (await this.isAccessiblePoint(point, osmData)) {
        console.log(`[OSM] Found accessible point on attempt ${i + 1}: [${point.lat}, ${point.lng}]`);
        return point;
      }
    }

    console.log(`[OSM] No accessible point found after ${maxAttempts} attempts, trying larger radius`);
    
    // If we can't find a point after max attempts, try with a larger radius
    const point = this.generateRandomPointBasic(center, radiusInKm * 1.5);
    if (await this.isAccessiblePoint(point, osmData)) {
      console.log(`[OSM] Found accessible point with larger radius: [${point.lat}, ${point.lng}]`);
      return point;
    }

    console.error("[OSM] Could not find accessible point after maximum attempts");
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

  private async getNearbyFeatures(
    point: { lat: number; lng: number },
    osmData: FeatureCollection
  ): Promise<NearbyFeature[]> {
    const features: NearbyFeature[] = [];

    for (const feature of osmData.features) {
      if (feature.properties) {
        // Calculate feature center from geometry
        let featureCenter;
        if (feature.geometry.type === "Polygon") {
          // For polygons, calculate center from all coordinates
          const coords = feature.geometry.coordinates[0];
          const lats = coords.map((c) => c[1]);
          const lngs = coords.map((c) => c[0]);
          featureCenter = {
            lat: (Math.min(...lats) + Math.max(...lats)) / 2,
            lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
          };
        } else if (feature.geometry.type === "Point") {
          featureCenter = {
            lat: feature.geometry.coordinates[1],
            lng: feature.geometry.coordinates[0],
          };
        } else {
          continue; // Skip other geometry types for now
        }

        const distance = Math.sqrt(
          Math.pow((point.lat - featureCenter.lat) * 111, 2) +
            Math.pow(
              (point.lng - featureCenter.lng) *
                111 *
                Math.cos((point.lat * Math.PI) / 180),
              2
            )
        );

        if (distance < 1) {
          // Only include features within 1km
          const bearing = this.calculateBearing(point, featureCenter);
          const direction = this.getCardinalDirection(bearing);

          features.push({
            type:
              feature.properties.natural ||
              feature.properties.landuse ||
              feature.properties.leisure ||
              feature.properties.amenity ||
              "landmark",
            name: feature.properties.name,
            distance,
            direction,
          });
        }
      }
    }

    return features.sort((a, b) => a.distance - b.distance).slice(0, 3);
  }

  private async generateHint(
    point: { lat: number; lng: number },
    endPoint: { lat: number; lng: number },
    osmData: FeatureCollection
  ): Promise<string> {
    // Get basic distance and direction to goal
    const distance = Math.sqrt(
      Math.pow((point.lat - endPoint.lat) * 111, 2) +
        Math.pow(
          (point.lng - endPoint.lng) *
            111 *
            Math.cos((point.lat * Math.PI) / 180),
          2
        )
    );

    const bearing = this.calculateBearing(point, endPoint);
    const direction = this.getCardinalDirection(bearing);

    // Get nearby features
    const nearbyFeatures = await this.getNearbyFeatures(point, osmData);

    // Generate hint text
    let hint = `The goal is approximately ${distance.toFixed(1)} km to the ${direction}.`;

    if (nearbyFeatures.length > 0) {
      // Add information about nearby features
      const featureDescriptions = nearbyFeatures.map((feature) => {
        const name = feature.name ? ` ${feature.name}` : "";
        return `${feature.type}${name} ${feature.distance.toFixed(1)}km ${feature.direction}`;
      });

      hint += ` Nearby: ${featureDescriptions.join(", ")}.`;

      // Add path suggestion if applicable
      const waterFeatures = nearbyFeatures.filter((f) => f.type === "water");
      if (waterFeatures.length > 0) {
        hint += ` Caution: water ahead, consider going around it.`;
      }
    }

    return hint;
  }

  private calculateBearing(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const dLon = ((point2.lng - point1.lng) * Math.PI) / 180;
    const lat1 = (point1.lat * Math.PI) / 180;
    const lat2 = (point2.lat * Math.PI) / 180;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    const bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360; // Normalize to 0-360
  }

  private getCardinalDirection(bearing: number): string {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  }

  async generatePoints(game: Game): Promise<GamePoint[]> {
    console.log(`[OSM] Starting point generation for game ${game.id}`);
    console.log(`[OSM] Game details:`, {
      max_radius: game.max_radius,
      bounding_box: game.bounding_box,
      starting_point: game.starting_point
    });
    
    const boundingBox = convertToBoundingBox(game);
    console.log(`[OSM] Converted bounding box:`, boundingBox);
    
    const osmData = await this.getOSMData(boundingBox);
    const numPoints = Math.floor(Math.random() * 4) + 4; // 4-7 points
    console.log(`[OSM] Will generate ${numPoints} intermediate points`);
    
    const points: GamePoint[] = [];

    // Generate starting point if not defined
    const startingPoint =
      game.starting_point ?? this.generateRandomPointInBox(boundingBox);
    console.log(`[OSM] Starting point:`, startingPoint);

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

    // Generate ending point within max_radius of the center
    const centerPoint = {
      latitude: (boundingBox.min_lat + boundingBox.max_lat) / 2,
      longitude: (boundingBox.min_lng + boundingBox.max_lng) / 2,
    };
    console.log(`[OSM] Center point:`, centerPoint);

    console.log(`[OSM] Generating end point...`);
    const endPoint = await this.generateRandomPoint(
      [centerPoint.latitude, centerPoint.longitude],
      game.max_radius || DEFAULT_MAX_RADIUS,
      osmData
    );
    console.log(`[OSM] End point generated:`, endPoint);

    // Calculate center point between start and end
    const centerLat = (startingPoint.lat + endPoint.lat) / 2;
    const centerLng = (startingPoint.lng + endPoint.lng) / 2;

    // Calculate distance between start and end points
    const distance =
      Math.sqrt(
        Math.pow(startingPoint.lat - endPoint.lat, 2) +
          Math.pow(startingPoint.lng - endPoint.lng, 2)
      ) * 111; // Convert to kilometers
    console.log(`[OSM] Distance between start and end: ${distance.toFixed(2)}km`);

    // Generate intermediate points
    console.log(`[OSM] Generating ${numPoints} intermediate points...`);
    for (let i = 0; i < numPoints; i++) {
      console.log(`[OSM] Generating intermediate point ${i + 1}/${numPoints}`);
      
      // Generate points with increasing spread as we get further from start
      const spreadFactor = (i + 1) / numPoints; // 0.2 to 1.0
      const point = await this.generateRandomPoint(
        [centerLat, centerLng],
        (distance / 2) * spreadFactor,
        osmData
      );

      console.log(`[OSM] Generating hint for point ${i + 1}...`);
      const hint = await this.generateHint(point, endPoint, osmData);
      console.log(`[OSM] Hint generated: "${hint}"`);

      points.push({
        latitude: point.lat,
        longitude: point.lng,
        sequence_number: i + 1,
        hint,
        type: "clue",
        game_id: null,
        id: crypto.randomUUID(),
        status: "unvisited",
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    }

    // Add ending point
    console.log(`[OSM] Adding ending point`);
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

    console.log(`[OSM] Point generation complete! Generated ${points.length} points total`);
    return points;
  }
}
