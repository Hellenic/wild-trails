import type { Game } from "@/types/game";

// Helper function to generate a random point within a radius
function generateRandomPoint(center: [number, number], radiusInKm: number) {
  // Convert radius from kilometers to degrees (rough approximation)
  const radiusInDeg = radiusInKm / 111;

  const w = radiusInDeg * Math.sqrt(Math.random());
  const t = 2 * Math.PI * Math.random();

  // Adjust for cos of latitude to fix distortion
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);

  return {
    lat: center[0] + y,
    lng: center[1] + x,
  };
}

// Helper function to generate a random point within a bounding box
function generateRandomPointInBox(boundingBox: {
  min_lat: number;
  min_lng: number;
  max_lat: number;
  max_lng: number;
}) {
  return {
    lat:
      boundingBox.min_lat +
      Math.random() * (boundingBox.max_lat - boundingBox.min_lat),
    lng:
      boundingBox.min_lng +
      Math.random() * (boundingBox.max_lng - boundingBox.min_lng),
  };
}

// Helper function to generate game points
export async function generateGamePoints(game: Game) {
  const numPoints = Math.floor(Math.random() * 4) + 4; // 4-7 points
  const points = [];

  if (!game.bounding_box || typeof game.bounding_box !== "object") {
    throw new Error("Bounding box not defined");
  }

  const boundingBox = {
    min_lat: game.bounding_box.northWest.lat,
    min_lng: game.bounding_box.northWest.lng,
    max_lat: game.bounding_box.southEast.lat,
    max_lng: game.bounding_box.southEast.lng,
  };
  // Generate starting point if not defined
  const startingPoint = game.starting_point
    ? (game.starting_point as { lat: number; lng: number })
    : generateRandomPointInBox(boundingBox);

  // Add starting point to points array
  points.push({
    latitude: startingPoint.lat,
    longitude: startingPoint.lng,
    sequence_number: 0,
    hint: "Starting point",
    type: "start" as const,
  });

  // Generate ending point (point B) within max_radius of the center
  const centerPoint = {
    latitude: (boundingBox.min_lat + boundingBox.max_lat) / 2,
    longitude: (boundingBox.min_lng + boundingBox.max_lng) / 2,
  };

  const endPoint = generateRandomPoint(
    [centerPoint.latitude, centerPoint.longitude],
    game.max_radius || 5 // Default to 5km if max_radius not set
  );

  // Add ending point
  points.push({
    latitude: endPoint.lat,
    longitude: endPoint.lng,
    sequence_number: numPoints + 1,
    hint: "Ending point",
    type: "end" as const,
  });

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
    const point = generateRandomPoint(
      [centerLat, centerLng],
      (distance / 2) * spreadFactor
    );

    points.push({
      latitude: point.lat,
      longitude: point.lng,
      sequence_number: i + 1,
      hint: `This is point ${i + 1}`,
      type: "clue" as const,
    });
  }

  return points;
}
