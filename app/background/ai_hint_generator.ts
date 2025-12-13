import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import type { FeatureCollection } from "geojson";
import { calculateBearing, getCardinalDirection, calculateDistance } from "./geo-utils";

const GEMINI_MODEL = "gemini-2.5-flash";

interface HintContext {
  startPoint: { lat: number; lng: number };
  goalPoint: { lat: number; lng: number };
  currentWaypoint: {
    lat: number;
    lng: number;
    sequenceNumber: number;
    totalWaypoints: number;
  };
  osmFeatures: FeatureCollection;
}

type HintTier = "early" | "middle" | "late";

/**
 * Determine hint tier based on waypoint position in sequence
 */
function getHintTier(sequenceNumber: number, totalWaypoints: number): HintTier {
  const progress = sequenceNumber / totalWaypoints;
  
  if (progress <= 0.33) return "early";
  if (progress <= 0.66) return "middle";
  return "late";
}

/**
 * Summarize OSM features for AI context
 * Extract meaningful landmarks and features near the goal with directional information
 */
function summarizeOSMFeatures(
  osmFeatures: FeatureCollection,
  goalPoint: { lat: number; lng: number },
  radiusKm: number = 2
): string {
  const features: string[] = [];
  
  for (const feature of osmFeatures.features) {
    if (!feature.properties) continue;
    
    // Extract feature type and name
    const type = 
      feature.properties.natural ||
      feature.properties.landuse ||
      feature.properties.leisure ||
      feature.properties.amenity ||
      feature.properties.waterway ||
      "landmark";
    
    const name = feature.properties.name;
    
    // Calculate approximate distance from goal (simple euclidean)
    let featureLat, featureLng;
    if (feature.geometry.type === "Point") {
      featureLng = feature.geometry.coordinates[0];
      featureLat = feature.geometry.coordinates[1];
    } else if (feature.geometry.type === "Polygon") {
      const coords = feature.geometry.coordinates[0];
      const lats = coords.map((c) => c[1]);
      const lngs = coords.map((c) => c[0]);
      featureLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      featureLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    } else {
      continue;
    }
    
    const distance = Math.sqrt(
      Math.pow((goalPoint.lat - featureLat) * 111, 2) +
        Math.pow(
          (goalPoint.lng - featureLng) *
            111 *
            Math.cos((goalPoint.lat * Math.PI) / 180),
          2
        )
    );
    
    // Calculate direction FROM feature TO goal
    const bearing = calculateBearing({ lat: featureLat, lng: featureLng }, goalPoint);
    const direction = getCardinalDirection(bearing);
    
    // Only include features within radius
    if (distance <= radiusKm) {
      if (name) {
        features.push(`${type} "${name}" (goal is ${distance.toFixed(2)}km ${direction} of this feature)`);
      } else {
        features.push(`${type} (goal is ${distance.toFixed(2)}km ${direction} of this feature)`);
      }
    }
  }
  
  if (features.length === 0) {
    return "No distinctive landmarks found nearby. Area appears relatively featureless.";
  }
  
  return features.slice(0, 10).join(", ");
}

/**
 * Build prompt for AI hint generation based on tier
 */
function buildPrompt(context: HintContext, tier: HintTier): string {
  const { startPoint, goalPoint, currentWaypoint, osmFeatures } = context;
  
  // Calculate basic metrics
  const distanceToGoal = calculateDistance(currentWaypoint, goalPoint);
  const bearing = calculateBearing(currentWaypoint, goalPoint);
  const direction = getCardinalDirection(bearing);
  
  // Summarize nearby features
  const featureSummary = summarizeOSMFeatures(osmFeatures, goalPoint);
  
  const tierInstructions = {
    early: `This is an EARLY hint (waypoint ${currentWaypoint.sequenceNumber}/${currentWaypoint.totalWaypoints}). Give a BROAD regional hint:
- Mention general direction (northern sector, eastern area, etc.)
- Reference major landmarks if available
- Be vague about exact location - players should need more hints
- Keep search area to several kilometers`,
    
    middle: `This is a MIDDLE hint (waypoint ${currentWaypoint.sequenceNumber}/${currentWaypoint.totalWaypoints}). Narrow down the location:
- Reduce search area to 1-2 kilometers
- Use terrain features and nearby landmarks
- Be more specific than early hints but not pinpoint accurate
- Help players eliminate large areas`,
    
    late: `This is a LATE hint (waypoint ${currentWaypoint.sequenceNumber}/${currentWaypoint.totalWaypoints}). Give PRECISE guidance:
- Narrow to within 500 meters
- Use distinctive, identifiable features
- Be specific enough that players can find the goal with this hint
- Reference actual geographic features`
  };
  
  return `You are generating a location hint for an outdoor orienteering treasure hunt game called Wild Trails.

GAME CONTEXT:
- Start point: ${startPoint.lat.toFixed(4)}, ${startPoint.lng.toFixed(4)}
- Goal point: ${goalPoint.lat.toFixed(4)}, ${goalPoint.lng.toFixed(4)}
- Current waypoint: ${currentWaypoint.lat.toFixed(4)}, ${currentWaypoint.lng.toFixed(4)}
- Distance from waypoint to goal: ${distanceToGoal.toFixed(2)}km ${direction}
- Nearby features: ${featureSummary}

HINT REQUIREMENTS:
${tierInstructions[tier]}

CRITICAL RULES:
1. Generate ONLY the hint text, nothing else
2. Do NOT include phrases like "Hint:" or "The goal is"
3. Write naturally, as if speaking to a friend outdoors
4. Use actual geographic features mentioned above when possible
5. PAY ATTENTION to directional relationships: "goal is X km DIRECTION of feature" means goal is in that direction from the feature
6. If goal is south of a lake, say "south of the lake" or "southern edge/shore", NOT "north of the lake"
7. Make it engaging and slightly mysterious
8. Keep it under 50 words
9. DO NOT repeat the exact same style as other hints - vary your approach

Generate ONE creative, helpful hint now:`;
}

/**
 * Generate AI-powered hint using Gemini
 */
export async function generateAIHint(
  context: HintContext
): Promise<string | null> {
  try {
    // Check if API key is configured
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.warn("[AI Hint] Google AI API key not configured, skipping AI hint generation");
      return null;
    }
    
    const tier = getHintTier(
      context.currentWaypoint.sequenceNumber,
      context.currentWaypoint.totalWaypoints
    );
    
    console.log(
      `[AI Hint] Generating ${tier} hint for waypoint ${context.currentWaypoint.sequenceNumber}/${context.currentWaypoint.totalWaypoints}`
    );
    
    const prompt = buildPrompt(context, tier);
    
    const result = await generateText({
      model: google(GEMINI_MODEL),
      prompt,
      temperature: 0.8, // Higher temperature for more creative hints
      maxRetries: 2,
    });
    
    const hint = result.text.trim();
    
    console.log(`[AI Hint] Generated hint: "${hint}"`);
    
    return hint;
  } catch (error) {
    console.error("[AI Hint] Error generating AI hint:", error);
    return null;
  }
}

/**
 * Generate fallback mathematical hint with nearby features
 */
export function generateFallbackHint(
  waypointLat: number,
  waypointLng: number,
  goalLat: number,
  goalLng: number,
  osmFeatures?: FeatureCollection
): string {
  const distance = calculateDistance(
    { lat: waypointLat, lng: waypointLng },
    { lat: goalLat, lng: goalLng }
  );
  const bearing = calculateBearing(
    { lat: waypointLat, lng: waypointLng },
    { lat: goalLat, lng: goalLng }
  );
  const direction = getCardinalDirection(bearing);
  
  let hint = `The goal is approximately ${distance.toFixed(1)} km to the ${direction}.`;
  
  // If OSM features provided, add landmark information
  if (osmFeatures && osmFeatures.features.length > 0) {
    const nearbyFeatures = findNearbyFeatures(osmFeatures, { lat: goalLat, lng: goalLng }, 1.5);
    
    if (nearbyFeatures.length > 0) {
      const featureDescriptions = nearbyFeatures.map((f) => {
        const name = f.name ? ` "${f.name}"` : "";
        return `${f.type}${name} (${f.distance.toFixed(1)}km ${f.direction})`;
      });
      
      hint += ` Nearby landmarks: ${featureDescriptions.slice(0, 2).join(", ")}.`;
    }
  }
  
  return hint;
}

/**
 * Find nearby features with directional information
 */
function findNearbyFeatures(
  osmFeatures: FeatureCollection,
  goalPoint: { lat: number; lng: number },
  radiusKm: number
): Array<{ type: string; name?: string; distance: number; direction: string }> {
  const features: Array<{ type: string; name?: string; distance: number; direction: string }> = [];
  
  for (const feature of osmFeatures.features) {
    if (!feature.properties) continue;
    
    const type = 
      feature.properties.natural ||
      feature.properties.landuse ||
      feature.properties.leisure ||
      feature.properties.amenity ||
      feature.properties.waterway ||
      "landmark";
    
    const name = feature.properties.name;
    
    let featureLat, featureLng;
    if (feature.geometry.type === "Point") {
      featureLng = feature.geometry.coordinates[0];
      featureLat = feature.geometry.coordinates[1];
    } else if (feature.geometry.type === "Polygon") {
      const coords = feature.geometry.coordinates[0];
      const lats = coords.map((c: number[]) => c[1]);
      const lngs = coords.map((c: number[]) => c[0]);
      featureLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      featureLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    } else {
      continue;
    }
    
    const distance = calculateDistance({ lat: featureLat, lng: featureLng }, goalPoint);
    
    if (distance <= radiusKm) {
      const bearing = calculateBearing({ lat: featureLat, lng: featureLng }, goalPoint);
      const direction = getCardinalDirection(bearing);
      
      features.push({ type, name, distance, direction });
    }
  }
  
  return features.sort((a, b) => a.distance - b.distance);
}
