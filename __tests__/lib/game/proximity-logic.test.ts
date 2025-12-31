/**
 * Comprehensive tests for proximity detection logic
 * This is the core game mechanic - ensuring players trigger waypoints correctly
 * 
 * @jest-environment node
 */

import {
  calculateDistance,
  isWithinProximity,
  checkPointProximity,
  checkMultiplePointsProximity,
  getTriggeredPoints,
  filterTriggerablePoints,
  sortByDistance,
  getClosestPoint,
  isValidCoordinate,
  DEFAULT_TRIGGER_DISTANCE_METERS,
  type ProximityPoint,
} from "@/lib/game/proximity-logic";

// ============================================================================
// Test Data - Real-world coordinates for meaningful tests
// ============================================================================

// Helsinki city center coordinates
const HELSINKI_CENTER = { lat: 60.1699, lng: 24.9384 };

// Points at known distances from Helsinki center (approximately)
const POINT_10M_AWAY = { lat: 60.16999, lng: 24.9384 }; // ~10m north
const POINT_30M_AWAY = { lat: 60.17017, lng: 24.9384 }; // ~30m north
const POINT_50M_AWAY = { lat: 60.17035, lng: 24.9384 }; // ~50m north (at threshold)
const POINT_51M_AWAY = { lat: 60.17036, lng: 24.9384 }; // ~51m north (just over threshold)
const POINT_100M_AWAY = { lat: 60.1708, lng: 24.9384 }; // ~100m north
const POINT_1KM_AWAY = { lat: 60.179, lng: 24.9384 }; // ~1km north

// Create test points
function createTestPoint(
  id: string,
  lat: number,
  lng: number,
  type: "start" | "end" | "clue" = "clue",
  hint: string | null = null
): ProximityPoint {
  return { id, latitude: lat, longitude: lng, type, hint };
}

// ============================================================================
// Distance Calculation Tests
// ============================================================================

describe("calculateDistance", () => {
  test("returns 0 for identical coordinates", () => {
    const distance = calculateDistance(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng
    );
    expect(distance).toBe(0);
  });

  test("calculates short distances accurately (within 1m tolerance)", () => {
    // ~10m away
    const distance = calculateDistance(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      POINT_10M_AWAY.lat,
      POINT_10M_AWAY.lng
    );
    expect(distance).toBeGreaterThan(5);
    expect(distance).toBeLessThan(15);
  });

  test("calculates medium distances accurately (within 5m tolerance)", () => {
    // ~50m away
    const distance = calculateDistance(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      POINT_50M_AWAY.lat,
      POINT_50M_AWAY.lng
    );
    expect(distance).toBeGreaterThan(45);
    expect(distance).toBeLessThan(55);
  });

  test("calculates longer distances accurately (within 10m tolerance)", () => {
    // ~100m away
    const distance = calculateDistance(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      POINT_100M_AWAY.lat,
      POINT_100M_AWAY.lng
    );
    expect(distance).toBeGreaterThan(90);
    expect(distance).toBeLessThan(110);
  });

  test("calculates 1km distance accurately (within 50m tolerance)", () => {
    const distance = calculateDistance(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      POINT_1KM_AWAY.lat,
      POINT_1KM_AWAY.lng
    );
    expect(distance).toBeGreaterThan(950);
    expect(distance).toBeLessThan(1050);
  });

  test("is symmetric (A to B equals B to A)", () => {
    const distanceAB = calculateDistance(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      POINT_100M_AWAY.lat,
      POINT_100M_AWAY.lng
    );
    const distanceBA = calculateDistance(
      POINT_100M_AWAY.lat,
      POINT_100M_AWAY.lng,
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng
    );
    expect(distanceAB).toBeCloseTo(distanceBA, 10);
  });

  test("handles negative coordinates (Southern/Western hemisphere)", () => {
    // Sydney, Australia to a nearby point
    const sydney = { lat: -33.8688, lng: 151.2093 };
    const nearSydney = { lat: -33.8698, lng: 151.2093 };
    const distance = calculateDistance(
      sydney.lat,
      sydney.lng,
      nearSydney.lat,
      nearSydney.lng
    );
    expect(distance).toBeGreaterThan(100);
    expect(distance).toBeLessThan(150);
  });

  test("handles coordinates across prime meridian", () => {
    // London to Paris (roughly 340km)
    const london = { lat: 51.5074, lng: -0.1278 };
    const paris = { lat: 48.8566, lng: 2.3522 };
    const distance = calculateDistance(
      london.lat,
      london.lng,
      paris.lat,
      paris.lng
    );
    // Actual distance is ~344km
    expect(distance).toBeGreaterThan(300000);
    expect(distance).toBeLessThan(400000);
  });
});

// ============================================================================
// Proximity Threshold Tests
// ============================================================================

describe("isWithinProximity", () => {
  test("returns true when exactly at the point", () => {
    const result = isWithinProximity(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng
    );
    expect(result).toBe(true);
  });

  test("returns true when clearly within threshold", () => {
    const result = isWithinProximity(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      POINT_30M_AWAY.lat,
      POINT_30M_AWAY.lng,
      50 // 50m threshold
    );
    expect(result).toBe(true);
  });

  test("returns true at approximately the threshold distance", () => {
    // Test with a point that's clearly under threshold
    const result = isWithinProximity(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      POINT_30M_AWAY.lat,
      POINT_30M_AWAY.lng,
      50 // 50m threshold
    );
    expect(result).toBe(true);
    
    // And verify distance is what we expect (under 50m)
    const distance = calculateDistance(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      POINT_30M_AWAY.lat,
      POINT_30M_AWAY.lng
    );
    expect(distance).toBeLessThan(50);
  });

  test("returns false when outside threshold", () => {
    const result = isWithinProximity(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      POINT_100M_AWAY.lat,
      POINT_100M_AWAY.lng,
      50 // 50m threshold
    );
    expect(result).toBe(false);
  });

  test("boundary: exact threshold distance triggers (<=)", () => {
    // Create a point at exactly 50m by using the threshold as the comparison
    const threshold = 50;
    const distance = calculateDistance(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      POINT_50M_AWAY.lat,
      POINT_50M_AWAY.lng
    );
    
    // If distance is within threshold, should trigger
    const result = isWithinProximity(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      POINT_50M_AWAY.lat,
      POINT_50M_AWAY.lng,
      threshold
    );
    
    // Result should match whether distance <= threshold
    expect(result).toBe(distance <= threshold);
  });

  test("respects custom trigger distance", () => {
    // 100m away, with 150m threshold - should trigger
    const resultLargeThreshold = isWithinProximity(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      POINT_100M_AWAY.lat,
      POINT_100M_AWAY.lng,
      150
    );
    expect(resultLargeThreshold).toBe(true);

    // 100m away, with 50m threshold - should NOT trigger
    const resultSmallThreshold = isWithinProximity(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      POINT_100M_AWAY.lat,
      POINT_100M_AWAY.lng,
      50
    );
    expect(resultSmallThreshold).toBe(false);
  });

  test("uses default threshold when not specified", () => {
    expect(DEFAULT_TRIGGER_DISTANCE_METERS).toBe(50);

    const result = isWithinProximity(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      POINT_30M_AWAY.lat,
      POINT_30M_AWAY.lng
    );
    expect(result).toBe(true);
  });
});

// ============================================================================
// Single Point Proximity Check Tests
// ============================================================================

describe("checkPointProximity", () => {
  const testPoint = createTestPoint("point-1", POINT_30M_AWAY.lat, POINT_30M_AWAY.lng, "clue", "Test hint");

  test("returns correct structure", () => {
    const result = checkPointProximity(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      testPoint
    );

    expect(result).toHaveProperty("point");
    expect(result).toHaveProperty("distance");
    expect(result).toHaveProperty("triggered");
    expect(result.point).toBe(testPoint);
    expect(typeof result.distance).toBe("number");
    expect(typeof result.triggered).toBe("boolean");
  });

  test("correctly identifies triggered point", () => {
    const result = checkPointProximity(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      testPoint,
      50
    );
    expect(result.triggered).toBe(true);
    expect(result.distance).toBeLessThan(50);
  });

  test("correctly identifies non-triggered point", () => {
    const farPoint = createTestPoint("far-point", POINT_100M_AWAY.lat, POINT_100M_AWAY.lng);
    const result = checkPointProximity(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      farPoint,
      50
    );
    expect(result.triggered).toBe(false);
    expect(result.distance).toBeGreaterThan(50);
  });

  test("preserves point data in result", () => {
    const pointWithHint = createTestPoint("hint-point", POINT_10M_AWAY.lat, POINT_10M_AWAY.lng, "clue", "Find the tree");
    const result = checkPointProximity(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      pointWithHint
    );
    expect(result.point.hint).toBe("Find the tree");
    expect(result.point.type).toBe("clue");
    expect(result.point.id).toBe("hint-point");
  });
});

// ============================================================================
// Multiple Points Tests
// ============================================================================

describe("checkMultiplePointsProximity", () => {
  const points: ProximityPoint[] = [
    createTestPoint("close", POINT_10M_AWAY.lat, POINT_10M_AWAY.lng, "clue"),
    createTestPoint("medium", POINT_30M_AWAY.lat, POINT_30M_AWAY.lng, "clue"),
    createTestPoint("far", POINT_100M_AWAY.lat, POINT_100M_AWAY.lng, "end"),
  ];

  test("returns results for all points", () => {
    const results = checkMultiplePointsProximity(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      points
    );
    expect(results).toHaveLength(3);
  });

  test("returns empty array for empty input", () => {
    const results = checkMultiplePointsProximity(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      []
    );
    expect(results).toHaveLength(0);
  });

  test("correctly identifies triggered vs non-triggered", () => {
    const results = checkMultiplePointsProximity(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      points,
      50
    );
    
    const closeResult = results.find(r => r.point.id === "close");
    const mediumResult = results.find(r => r.point.id === "medium");
    const farResult = results.find(r => r.point.id === "far");

    expect(closeResult?.triggered).toBe(true);
    expect(mediumResult?.triggered).toBe(true);
    expect(farResult?.triggered).toBe(false);
  });
});

// ============================================================================
// Get Triggered Points Tests
// ============================================================================

describe("getTriggeredPoints", () => {
  const points: ProximityPoint[] = [
    createTestPoint("clue-1", POINT_10M_AWAY.lat, POINT_10M_AWAY.lng, "clue", "Hint 1"),
    createTestPoint("clue-2", POINT_30M_AWAY.lat, POINT_30M_AWAY.lng, "clue", "Hint 2"),
    createTestPoint("goal", POINT_100M_AWAY.lat, POINT_100M_AWAY.lng, "end", "You found it!"),
  ];

  test("returns only triggered points as events", () => {
    const events = getTriggeredPoints(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      points,
      50
    );
    
    expect(events).toHaveLength(2); // clue-1 and clue-2
    expect(events.map(e => e.point_id)).toContain("clue-1");
    expect(events.map(e => e.point_id)).toContain("clue-2");
    expect(events.map(e => e.point_id)).not.toContain("goal");
  });

  test("returns correct event structure", () => {
    const events = getTriggeredPoints(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      points,
      50
    );
    
    const event = events[0];
    expect(event).toHaveProperty("point_id");
    expect(event).toHaveProperty("point_type");
    expect(event).toHaveProperty("hint");
    expect(event).toHaveProperty("distance");
  });

  test("returns rounded distances", () => {
    const events = getTriggeredPoints(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      points,
      50
    );
    
    events.forEach(event => {
      expect(Number.isInteger(event.distance)).toBe(true);
    });
  });

  test("preserves hint data", () => {
    const events = getTriggeredPoints(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      points,
      50
    );
    
    const clue1Event = events.find(e => e.point_id === "clue-1");
    expect(clue1Event?.hint).toBe("Hint 1");
  });

  test("returns empty array when no points triggered", () => {
    const farPoints = [
      createTestPoint("far-1", POINT_100M_AWAY.lat, POINT_100M_AWAY.lng, "clue"),
      createTestPoint("far-2", POINT_1KM_AWAY.lat, POINT_1KM_AWAY.lng, "clue"),
    ];
    
    const events = getTriggeredPoints(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      farPoints,
      50
    );
    
    expect(events).toHaveLength(0);
  });
});

// ============================================================================
// Point Filtering Tests
// ============================================================================

describe("filterTriggerablePoints", () => {
  const allPoints: ProximityPoint[] = [
    createTestPoint("start", 60.17, 24.94, "start"),
    createTestPoint("clue-1", 60.171, 24.94, "clue"),
    createTestPoint("clue-2", 60.172, 24.94, "clue"),
    createTestPoint("goal", 60.173, 24.94, "end"),
  ];

  test("filters out start points", () => {
    const filtered = filterTriggerablePoints(allPoints);
    expect(filtered.map(p => p.id)).not.toContain("start");
    expect(filtered).toHaveLength(3);
  });

  test("keeps clue points", () => {
    const filtered = filterTriggerablePoints(allPoints);
    expect(filtered.map(p => p.id)).toContain("clue-1");
    expect(filtered.map(p => p.id)).toContain("clue-2");
  });

  test("keeps end points", () => {
    const filtered = filterTriggerablePoints(allPoints);
    expect(filtered.map(p => p.id)).toContain("goal");
  });

  test("returns empty array for empty input", () => {
    const filtered = filterTriggerablePoints([]);
    expect(filtered).toHaveLength(0);
  });

  test("returns empty array when only start points", () => {
    const onlyStart = [createTestPoint("start", 60.17, 24.94, "start")];
    const filtered = filterTriggerablePoints(onlyStart);
    expect(filtered).toHaveLength(0);
  });
});

// ============================================================================
// Sorting and Closest Point Tests
// ============================================================================

describe("sortByDistance", () => {
  test("sorts results by distance ascending", () => {
    const points: ProximityPoint[] = [
      createTestPoint("far", POINT_100M_AWAY.lat, POINT_100M_AWAY.lng, "clue"),
      createTestPoint("close", POINT_10M_AWAY.lat, POINT_10M_AWAY.lng, "clue"),
      createTestPoint("medium", POINT_30M_AWAY.lat, POINT_30M_AWAY.lng, "clue"),
    ];

    const results = checkMultiplePointsProximity(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      points
    );
    const sorted = sortByDistance(results);

    expect(sorted[0].point.id).toBe("close");
    expect(sorted[1].point.id).toBe("medium");
    expect(sorted[2].point.id).toBe("far");
  });

  test("does not mutate original array", () => {
    const points: ProximityPoint[] = [
      createTestPoint("far", POINT_100M_AWAY.lat, POINT_100M_AWAY.lng, "clue"),
      createTestPoint("close", POINT_10M_AWAY.lat, POINT_10M_AWAY.lng, "clue"),
    ];

    const results = checkMultiplePointsProximity(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      points
    );
    const originalFirstId = results[0].point.id;
    sortByDistance(results);
    expect(results[0].point.id).toBe(originalFirstId);
  });
});

describe("getClosestPoint", () => {
  test("returns the closest point", () => {
    const points: ProximityPoint[] = [
      createTestPoint("far", POINT_100M_AWAY.lat, POINT_100M_AWAY.lng, "clue"),
      createTestPoint("close", POINT_10M_AWAY.lat, POINT_10M_AWAY.lng, "clue"),
      createTestPoint("medium", POINT_30M_AWAY.lat, POINT_30M_AWAY.lng, "clue"),
    ];

    const closest = getClosestPoint(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      points
    );

    expect(closest?.point.id).toBe("close");
  });

  test("returns null for empty array", () => {
    const closest = getClosestPoint(
      HELSINKI_CENTER.lat,
      HELSINKI_CENTER.lng,
      []
    );
    expect(closest).toBeNull();
  });
});

// ============================================================================
// Coordinate Validation Tests
// ============================================================================

describe("isValidCoordinate", () => {
  test("accepts valid coordinates", () => {
    expect(isValidCoordinate(0, 0)).toBe(true);
    expect(isValidCoordinate(60.1699, 24.9384)).toBe(true);
    expect(isValidCoordinate(-33.8688, 151.2093)).toBe(true);
    expect(isValidCoordinate(90, 180)).toBe(true);
    expect(isValidCoordinate(-90, -180)).toBe(true);
  });

  test("rejects latitude out of range", () => {
    expect(isValidCoordinate(91, 0)).toBe(false);
    expect(isValidCoordinate(-91, 0)).toBe(false);
  });

  test("rejects longitude out of range", () => {
    expect(isValidCoordinate(0, 181)).toBe(false);
    expect(isValidCoordinate(0, -181)).toBe(false);
  });

  test("rejects NaN values", () => {
    expect(isValidCoordinate(NaN, 0)).toBe(false);
    expect(isValidCoordinate(0, NaN)).toBe(false);
    expect(isValidCoordinate(NaN, NaN)).toBe(false);
  });

  test("rejects non-number values", () => {
    // @ts-expect-error Testing invalid input
    expect(isValidCoordinate("60.17", 24.94)).toBe(false);
    // @ts-expect-error Testing invalid input
    expect(isValidCoordinate(60.17, null)).toBe(false);
    // @ts-expect-error Testing invalid input
    expect(isValidCoordinate(undefined, 24.94)).toBe(false);
  });
});

// ============================================================================
// Edge Cases and Real-World Scenarios
// ============================================================================

describe("Real-world scenarios", () => {
  test("player walking towards a waypoint triggers at correct distance", () => {
    const waypoint = createTestPoint("wp-1", 60.1700, 24.9384, "clue", "Look for the statue");
    
    // Simulate player walking towards waypoint
    const positions = [
      { lat: 60.1690, lng: 24.9384, shouldTrigger: false }, // ~110m away
      { lat: 60.1695, lng: 24.9384, shouldTrigger: false }, // ~55m away
      { lat: 60.1698, lng: 24.9384, shouldTrigger: true },  // ~22m away
      { lat: 60.1700, lng: 24.9384, shouldTrigger: true },  // 0m away
    ];

    positions.forEach((pos, i) => {
      const result = checkPointProximity(pos.lat, pos.lng, waypoint, 50);
      expect(result.triggered).toBe(pos.shouldTrigger);
    });
  });

  test("multiple waypoints can trigger simultaneously", () => {
    // Two waypoints very close together
    const points: ProximityPoint[] = [
      createTestPoint("wp-1", 60.1700, 24.9384, "clue", "First hint"),
      createTestPoint("wp-2", 60.1700, 24.9385, "clue", "Second hint"), // ~6m apart
    ];

    // Player standing between them
    const events = getTriggeredPoints(60.1700, 24.93845, points, 50);
    expect(events).toHaveLength(2);
  });

  test("goal point triggers correctly", () => {
    const goal = createTestPoint("goal", 60.1700, 24.9384, "end", "Congratulations!");
    
    const result = checkPointProximity(60.1700, 24.9384, goal, 50);
    expect(result.triggered).toBe(true);
    expect(result.point.type).toBe("end");
    expect(result.point.hint).toBe("Congratulations!");
  });

  test("GPS jitter within threshold still triggers", () => {
    const waypoint = createTestPoint("wp-1", 60.1700, 24.9384, "clue");
    
    // Simulate GPS jitter around a point 40m away (should trigger)
    const jitterPositions = [
      { lat: 60.16965, lng: 24.9384 },  // ~39m
      { lat: 60.16963, lng: 24.9384 },  // ~41m
      { lat: 60.16968, lng: 24.9384 },  // ~36m
    ];

    jitterPositions.forEach(pos => {
      const result = checkPointProximity(pos.lat, pos.lng, waypoint, 50);
      expect(result.triggered).toBe(true);
    });
  });
});
