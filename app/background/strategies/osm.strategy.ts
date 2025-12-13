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
  PointGenerationOptions,
  BoundingBox,
  convertToBoundingBox,
} from "./base.strategy";
import { generateAIHint, generateFallbackHint } from "../ai_hint_generator";
import { calculateDistance, calculatePerpendicularPoint } from "../geo-utils";

const DEFAULT_MAX_RADIUS = 5;
const DEFAULT_MAX_ATTEMPTS = 20;
const BUFFER_DISTANCE = 0.0002;

// Path generation constants for corridor-based progressive paths
const CORRIDOR_WIDTH_EASY = 0.10; // ±10% of total distance
const CORRIDOR_WIDTH_MEDIUM = 0.25; // ±25% (future)
const CORRIDOR_WIDTH_HARD = 0.50; // ±50% (future)
const MIN_PROGRESS = 0.1; // Don't place points too close to start (10%)
const MAX_PROGRESS = 0.9; // Don't place points too close to end (90%)

// Landmark goal placement configuration
const MIN_LANDMARKS_FOR_GOAL = 3; // Require at least 3 landmarks to avoid repetitive games
const LANDMARK_SEARCH_RADIUS = 0.5; // 500m search radius for landmarks

// Landmark interface for goal placement
interface Landmark {
  type: string;        // 'peak', 'tower', 'historic', etc.
  name?: string;       // Name if available
  position: {
    lat: number;
    lng: number;
  };
  priority: number;    // 1 (best) - 3 (acceptable)
  distance: number;    // Distance from target point in km
}

// Landmark type priority tiers for goal placement
const LANDMARK_PRIORITIES: Record<string, number> = {
  // Tier 1: Most distinct, easily identifiable (priority 1)
  'peak': 1,
  'tower': 1,
  'historic_monument': 1,
  'historic_memorial': 1,
  'historic_ruins': 1,
  'tourism_viewpoint': 1,
  
  // Tier 2: Good landmarks (priority 2)
  'rock': 2,
  'stone': 2,
  'tourism_attraction': 2,
  'amenity_shelter': 2,
  'historic_castle': 2,
  'historic_archaeological_site': 2,
  'mast': 2,
  
  // Tier 3: Acceptable landmarks (priority 3)
  'church': 3,
  'chapel': 3,
  'amenity_parking': 3,
  'tree': 3,
  'tourism_information': 3,
  'historic': 3, // Generic historic
};

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
          
          // Landmarks for goal placement (distinct, identifiable features)
          node["natural"="peak"](${boundingBox.min_lat},${boundingBox.min_lng},${boundingBox.max_lat},${boundingBox.max_lng});
          node["natural"="rock"](${boundingBox.min_lat},${boundingBox.min_lng},${boundingBox.max_lat},${boundingBox.max_lng});
          node["natural"="stone"](${boundingBox.min_lat},${boundingBox.min_lng},${boundingBox.max_lat},${boundingBox.max_lng});
          node["natural"="tree"][name](${boundingBox.min_lat},${boundingBox.min_lng},${boundingBox.max_lat},${boundingBox.max_lng});
          way["historic"](${boundingBox.min_lat},${boundingBox.min_lng},${boundingBox.max_lat},${boundingBox.max_lng});
          node["historic"](${boundingBox.min_lat},${boundingBox.min_lng},${boundingBox.max_lat},${boundingBox.max_lng});
          way["tourism"](${boundingBox.min_lat},${boundingBox.min_lng},${boundingBox.max_lat},${boundingBox.max_lng});
          node["tourism"](${boundingBox.min_lat},${boundingBox.min_lng},${boundingBox.max_lat},${boundingBox.max_lng});
          way["amenity"~"shelter|parking"](${boundingBox.min_lat},${boundingBox.min_lng},${boundingBox.max_lat},${boundingBox.max_lng});
          node["amenity"~"shelter|parking"](${boundingBox.min_lat},${boundingBox.min_lng},${boundingBox.max_lat},${boundingBox.max_lng});
          node["man_made"="tower"](${boundingBox.min_lat},${boundingBox.min_lng},${boundingBox.max_lat},${boundingBox.max_lng});
          node["man_made"="mast"](${boundingBox.min_lat},${boundingBox.min_lng},${boundingBox.max_lat},${boundingBox.max_lng});
          way["building"~"church|chapel"](${boundingBox.min_lat},${boundingBox.min_lng},${boundingBox.max_lat},${boundingBox.max_lng});
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

  /**
   * Find an accessible point near a target location
   * Searches in progressively larger circles around the target until an accessible point is found
   * 
   * @param target Target location to search near
   * @param osmData OSM feature data for accessibility validation
   * @param maxSearchRadius Maximum search radius in kilometers
   * @param maxAttempts Maximum number of attempts per search radius
   * @returns Accessible point near the target
   */
  private async findAccessiblePointNear(
    target: { lat: number; lng: number },
    osmData: FeatureCollection,
    maxSearchRadius: number,
    maxAttempts: number = 10
  ): Promise<{ lat: number; lng: number }> {
    // First, check if the target itself is accessible
    if (await this.isAccessiblePoint(target, osmData)) {
      console.log(`[OSM] Target point is accessible: [${target.lat}, ${target.lng}]`);
      return target;
    }

    // Try progressively larger search radii
    const searchRadii = [
      maxSearchRadius * 0.25, // 25% of max
      maxSearchRadius * 0.50, // 50% of max
      maxSearchRadius * 0.75, // 75% of max
      maxSearchRadius,         // 100% of max
    ];

    for (const searchRadius of searchRadii) {
      console.log(`[OSM] Searching for accessible point within ${searchRadius.toFixed(3)}km of target`);
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Generate random point within search radius
        const candidatePoint = this.generateRandomPointBasic(
          [target.lat, target.lng],
          searchRadius
        );

        if (await this.isAccessiblePoint(candidatePoint, osmData)) {
          console.log(`[OSM] Found accessible point at [${candidatePoint.lat}, ${candidatePoint.lng}] (${searchRadius.toFixed(3)}km radius, attempt ${attempt + 1})`);
          return candidatePoint;
        }
      }
    }

    // If no accessible point found, return the target anyway (last resort)
    console.warn(`[OSM] Could not find accessible point near target, using target anyway: [${target.lat}, ${target.lng}]`);
    return target;
  }

  /**
   * Find the nearest distinct landmark to use as a goal point
   * Searches for identifiable features like peaks, towers, historic sites within search radius
   * 
   * @param targetPoint The calculated end point position
   * @param osmData OSM feature data containing landmarks
   * @param maxDistanceKm Maximum search radius in kilometers
   * @returns Landmark object if found, null otherwise
   */
  private findNearestDistinctLandmark(
    targetPoint: { lat: number; lng: number },
    osmData: FeatureCollection,
    maxDistanceKm: number
  ): Landmark | null {
    console.log(`[OSM] Searching for landmarks within ${maxDistanceKm}km of end point [${targetPoint.lat.toFixed(5)}, ${targetPoint.lng.toFixed(5)}]`);
    
    const landmarks: Landmark[] = [];

    for (const feature of osmData.features) {
      if (!feature.properties) continue;

      // Extract landmark type and determine priority
      let landmarkType: string | null = null;
      let priority: number = 999; // Default: not a landmark

      // Check natural features
      if (feature.properties.natural) {
        const natural = feature.properties.natural;
        if (natural === 'peak') {
          landmarkType = 'peak';
          priority = LANDMARK_PRIORITIES['peak'];
        } else if (natural === 'rock') {
          landmarkType = 'rock';
          priority = LANDMARK_PRIORITIES['rock'];
        } else if (natural === 'stone') {
          landmarkType = 'stone';
          priority = LANDMARK_PRIORITIES['stone'];
        } else if (natural === 'tree' && feature.properties.name) {
          landmarkType = 'tree';
          priority = LANDMARK_PRIORITIES['tree'];
        }
      }

      // Check historic features
      if (feature.properties.historic) {
        const historic = feature.properties.historic;
        if (historic === 'monument') {
          landmarkType = 'historic_monument';
          priority = LANDMARK_PRIORITIES['historic_monument'];
        } else if (historic === 'memorial') {
          landmarkType = 'historic_memorial';
          priority = LANDMARK_PRIORITIES['historic_memorial'];
        } else if (historic === 'ruins') {
          landmarkType = 'historic_ruins';
          priority = LANDMARK_PRIORITIES['historic_ruins'];
        } else if (historic === 'castle') {
          landmarkType = 'historic_castle';
          priority = LANDMARK_PRIORITIES['historic_castle'];
        } else if (historic === 'archaeological_site') {
          landmarkType = 'historic_archaeological_site';
          priority = LANDMARK_PRIORITIES['historic_archaeological_site'];
        } else {
          landmarkType = 'historic';
          priority = LANDMARK_PRIORITIES['historic'];
        }
      }

      // Check tourism features
      if (feature.properties.tourism) {
        const tourism = feature.properties.tourism;
        if (tourism === 'viewpoint') {
          landmarkType = 'tourism_viewpoint';
          priority = LANDMARK_PRIORITIES['tourism_viewpoint'];
        } else if (tourism === 'attraction') {
          landmarkType = 'tourism_attraction';
          priority = LANDMARK_PRIORITIES['tourism_attraction'];
        } else if (tourism === 'information') {
          landmarkType = 'tourism_information';
          priority = LANDMARK_PRIORITIES['tourism_information'];
        }
      }

      // Check amenity features
      if (feature.properties.amenity) {
        const amenity = feature.properties.amenity;
        if (amenity === 'shelter') {
          landmarkType = 'amenity_shelter';
          priority = LANDMARK_PRIORITIES['amenity_shelter'];
        } else if (amenity === 'parking') {
          landmarkType = 'amenity_parking';
          priority = LANDMARK_PRIORITIES['amenity_parking'];
        }
      }

      // Check man_made features
      if (feature.properties.man_made) {
        const manMade = feature.properties.man_made;
        if (manMade === 'tower') {
          landmarkType = 'tower';
          priority = LANDMARK_PRIORITIES['tower'];
        } else if (manMade === 'mast') {
          landmarkType = 'mast';
          priority = LANDMARK_PRIORITIES['mast'];
        }
      }

      // Check building features (churches, chapels)
      if (feature.properties.building) {
        const building = feature.properties.building;
        if (building === 'church') {
          landmarkType = 'church';
          priority = LANDMARK_PRIORITIES['church'];
        } else if (building === 'chapel') {
          landmarkType = 'chapel';
          priority = LANDMARK_PRIORITIES['chapel'];
        }
      }

      // Skip if not a landmark type we care about
      if (!landmarkType || priority === 999) continue;

      // Get landmark position
      let landmarkLat: number, landmarkLng: number;

      if (feature.geometry.type === 'Point') {
        landmarkLng = feature.geometry.coordinates[0];
        landmarkLat = feature.geometry.coordinates[1];
      } else if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
        // For polygons, use centroid
        const coords = feature.geometry.type === 'Polygon' 
          ? feature.geometry.coordinates[0] 
          : feature.geometry.coordinates[0][0];
        const lats = coords.map((c) => c[1]);
        const lngs = coords.map((c) => c[0]);
        landmarkLat = (Math.min(...lats) + Math.max(...lats)) / 2;
        landmarkLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      } else {
        continue;
      }

      // Calculate distance from target point
      const distance = calculateDistance(targetPoint, { lat: landmarkLat, lng: landmarkLng });

      // Only consider landmarks within search radius
      if (distance > maxDistanceKm) continue;

      landmarks.push({
        type: landmarkType,
        name: feature.properties.name,
        position: {
          lat: landmarkLat,
          lng: landmarkLng,
        },
        priority,
        distance,
      });
    }

    if (landmarks.length === 0) {
      console.log('[OSM] No landmarks found within search radius');
      return null;
    }

    console.log(`[OSM] Found ${landmarks.length} potential landmark(s) within search radius`);

    // Check if we have enough landmarks to avoid repetitive games
    if (landmarks.length < MIN_LANDMARKS_FOR_GOAL) {
      console.log(`[OSM] Only ${landmarks.length} landmark(s) found, need at least ${MIN_LANDMARKS_FOR_GOAL} to use landmark goals`);
      console.log('[OSM] This prevents repetitive games in areas with few landmarks');
      return null;
    }

    // Sort by priority (1 = best) then by distance (closest first)
    landmarks.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority; // Lower priority number = better
      }
      return a.distance - b.distance; // Closer = better
    });

    const bestLandmark = landmarks[0];
    console.log(`[OSM] Sufficient landmarks available (${landmarks.length} >= ${MIN_LANDMARKS_FOR_GOAL})`);
    console.log(`[OSM] Selected landmark: ${bestLandmark.name || bestLandmark.type} (priority ${bestLandmark.priority}, distance ${bestLandmark.distance.toFixed(2)}km)`);

    return bestLandmark;
  }

  async generatePoints(game: Game, options?: PointGenerationOptions): Promise<GamePoint[]> {
    const useAIHints = options?.useAIHints ?? true; // Default to true
    
    console.log(`[OSM] Starting point generation for game ${game.id}`);
    console.log(`[OSM] Options:`, { useAIHints });
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
    let endPoint = await this.generateRandomPoint(
      [centerPoint.latitude, centerPoint.longitude],
      game.max_radius || DEFAULT_MAX_RADIUS,
      osmData
    );
    console.log(`[OSM] Initial end point generated:`, endPoint);

    // Try to snap end point to a nearby landmark for better player experience
    // Only use landmarks if there are enough to provide variety (prevents repetitive games)
    const landmark = this.findNearestDistinctLandmark(endPoint, osmData, LANDMARK_SEARCH_RADIUS);
    if (landmark) {
      console.log(`[OSM] Snapping end point to landmark: ${landmark.name || landmark.type} (${landmark.distance.toFixed(2)}km away)`);
      endPoint = landmark.position;
      console.log(`[OSM] Final end point (at landmark):`, endPoint);
    } else {
      console.log(`[OSM] Using calculated end point (no suitable landmarks or insufficient variety)`);
    }

    // Calculate total journey distance for corridor-based generation
    const totalDistance = calculateDistance(startingPoint, endPoint);
    console.log(`[OSM] Distance between start and end: ${totalDistance.toFixed(2)}km`);

    // Determine corridor width based on difficulty (currently only 'easy' implemented)
    const difficulty = options?.difficulty ?? 'easy';
    const corridorWidth = totalDistance * CORRIDOR_WIDTH_EASY;
    console.log(`[OSM] Using corridor width: ${corridorWidth.toFixed(2)}km (${(CORRIDOR_WIDTH_EASY * 100).toFixed(0)}% of distance) for '${difficulty}' difficulty`);

    // Generate intermediate points using corridor-based progressive path
    console.log(`[OSM] Generating ${numPoints} intermediate points along corridor...`);
    for (let i = 0; i < numPoints; i++) {
      console.log(`[OSM] Generating intermediate point ${i + 1}/${numPoints}`);
      
      // Calculate progress along the main path
      // Use (i+1)/(numPoints+1) to evenly distribute points and avoid extremes
      const progress = (i + 1) / (numPoints + 1);
      console.log(`[OSM] Progress: ${(progress * 100).toFixed(1)}%`);
      
      // Random perpendicular offset for variety (left or right of path)
      // Range: -corridorWidth to +corridorWidth
      const lateralOffset = (Math.random() - 0.5) * 2 * corridorWidth;
      console.log(`[OSM] Lateral offset: ${lateralOffset >= 0 ? '+' : ''}${lateralOffset.toFixed(3)}km`);
      
      // Calculate candidate point along the corridor
      const candidatePoint = calculatePerpendicularPoint(
        startingPoint,
        endPoint,
        progress,
        lateralOffset
      );
      console.log(`[OSM] Candidate point: [${candidatePoint.lat.toFixed(5)}, ${candidatePoint.lng.toFixed(5)}]`);
      
      // Find accessible point near the candidate location
      const point = await this.findAccessiblePointNear(
        candidatePoint,
        osmData,
        corridorWidth / 2 // Search radius is half the corridor width
      );

      console.log(`[OSM] Generating hint for point ${i + 1}...`);
      
      let hint: string;
      
      if (useAIHints) {
        // Try AI hint generation first
        const aiHint = await generateAIHint({
          startPoint: startingPoint,
          goalPoint: endPoint,
          currentWaypoint: {
            lat: point.lat,
            lng: point.lng,
            sequenceNumber: i + 1,
            totalWaypoints: numPoints,
          },
          osmFeatures: osmData,
        });
        
        if (aiHint) {
          hint = aiHint;
          console.log(`[OSM] AI hint generated: "${hint}"`);
        } else {
          // Fallback to mathematical hint if AI fails (with OSM features)
          hint = generateFallbackHint(point.lat, point.lng, endPoint.lat, endPoint.lng, osmData);
          console.log(`[OSM] AI failed, using fallback hint: "${hint}"`);
        }
      } else {
        // AI hints disabled, use mathematical hint directly (with OSM features)
        hint = generateFallbackHint(point.lat, point.lng, endPoint.lat, endPoint.lng, osmData);
        console.log(`[OSM] AI hints disabled, using mathematical hint: "${hint}"`);
      }

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
