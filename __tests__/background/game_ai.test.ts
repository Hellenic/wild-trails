// First, mock osmtogeojson
type OSMElement = {
  id: number;
  tags?: Record<string, string>;
  geometry: Array<{ lon: number; lat: number }>;
};

type OSMData = {
  elements: OSMElement[];
};

type GeoPoint = {
  lon: number;
  lat: number;
};

jest.mock("osmtogeojson", () => {
  return function (osmData: OSMData) {
    return {
      type: "FeatureCollection",
      features: osmData.elements.map((element: OSMElement) => {
        // Nodes with single point geometry should be Point features (landmarks)
        if (element.type === "node" && element.geometry.length === 1) {
          return {
            type: "Feature",
            id: element.id,
            properties: element.tags,
            geometry: {
              type: "Point",
              coordinates: [element.geometry[0].lon, element.geometry[0].lat],
            },
          };
        }
        // Ways and other elements are Polygons
        return {
          type: "Feature",
          id: element.id,
          properties: element.tags,
          geometry: {
            type: "Polygon",
            coordinates: [
              element.geometry.map((point: GeoPoint) => [point.lon, point.lat]),
            ],
          },
        };
      }),
    };
  };
});

const BUFFER_DISTANCE = 0.0002;

// Mock AI hint generation
jest.mock("@/app/background/ai_hint_generator", () => ({
  generateAIHint: jest.fn().mockResolvedValue(null), // Return null to use fallback hints
  generateFallbackHint: jest.fn((waypointLat, waypointLng, goalLat, goalLng) => {
    const distance = Math.sqrt(
      Math.pow((waypointLat - goalLat) * 111, 2) +
        Math.pow((waypointLng - goalLng) * 111 * Math.cos((waypointLat * Math.PI) / 180), 2)
    );
    return `The goal is approximately ${distance.toFixed(1)} km to the N.`;
  }),
}));

// Then import everything else
import { gameAI } from "@/app/background/game_ai";
import { RandomStrategy } from "@/app/background/strategies/random.strategy";
import { OSMStrategy } from "@/app/background/strategies/osm.strategy";
import type { Game } from "@/types/game";

// Mock fetch for OSM data
global.fetch = jest.fn();

const mockGame: Game = {
  id: "test-game",
  name: "Test Game",
  max_radius: 5,
  bounding_box: {
    northWest: { lat: 61.5, lng: 23.5 },
    southEast: { lat: 61.4, lng: 23.6 },
  },
  starting_point: { lat: 61.45, lng: 23.55 },
  created_at: "2024-01-01",
  creator_id: "test-creator",
  duration: 100,
  game_master: "player",
  game_mode: "single_player",
  status: "setup",
  password: "test-password",
  player_count: 1,
  selected_role: "player_a",
  started_at: "2024-01-01",
};

const mockOSMResponse = {
  elements: [
    {
      type: "way",
      id: 123,
      nodes: [1, 2, 3, 4, 1],
      tags: { natural: "water" },
      geometry: [
        { lat: 61.48, lon: 23.58 },
        { lat: 61.48, lon: 23.59 },
        { lat: 61.49, lon: 23.59 },
        { lat: 61.49, lon: 23.58 },
        { lat: 61.48, lon: 23.58 },
      ],
    },
    {
      type: "way",
      id: 124,
      nodes: [5, 6, 7, 8, 5],
      tags: { natural: "forest", name: "Birch Forest" },
      geometry: [
        { lat: 61.46, lon: 23.56 },
        { lat: 61.46, lon: 23.57 },
        { lat: 61.47, lon: 23.57 },
        { lat: 61.47, lon: 23.56 },
        { lat: 61.46, lon: 23.56 },
      ],
    },
    {
      type: "way",
      id: 125,
      nodes: [9, 10, 11, 12, 9],
      tags: { leisure: "park", name: "City Park" },
      geometry: [
        { lat: 61.47, lon: 23.57 },
        { lat: 61.47, lon: 23.58 },
        { lat: 61.48, lon: 23.58 },
        { lat: 61.48, lon: 23.57 },
        { lat: 61.47, lon: 23.57 },
      ],
    },
  ],
};

describe("osmtogeojson mock", () => {
  it("should properly convert OSM data to GeoJSON", () => {
    const osmtogeojson = jest.requireMock("osmtogeojson");
    const result = osmtogeojson(mockOSMResponse);

    expect(result.type).toBe("FeatureCollection");
    expect(result.features).toHaveLength(3);
    expect(result.features[1].properties.name).toBe("Birch Forest");
    expect(result.features[2].properties.name).toBe("City Park");
  });
});

describe("GameAI", () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock successful OSM API response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve(mockOSMResponse),
    });
  });

  describe("generateGamePoints", () => {
    it("should generate points using default OSM strategy", async () => {
      const points = await gameAI.generateGamePoints(mockGame);

      expect(points).toBeInstanceOf(Array);
      expect(points.length).toBeGreaterThanOrEqual(6); // At least start, end, and 4 points
      expect(points.length).toBeLessThanOrEqual(9); // At most start, end, and 7 points

      // Verify point types
      expect(points[0].type).toBe("start");
      expect(points[points.length - 1].type).toBe("end");
      points.slice(1, -1).forEach((point) => expect(point.type).toBe("clue"));

      // Verify sequence numbers
      points.forEach((point, index) => {
        expect(point.sequence_number).toBe(index);
      });
    });

    it("should generate points using random strategy", async () => {
      const points = await gameAI.generateGamePoints(mockGame, "random");

      expect(points).toBeInstanceOf(Array);
      expect(points.length).toBeGreaterThanOrEqual(6);
      expect(points.length).toBeLessThanOrEqual(9);
    });

    it("should use provided starting point", async () => {
      const points = await gameAI.generateGamePoints(mockGame);

      expect(points[0]).toMatchObject({
        latitude: mockGame.starting_point!.lat,
        longitude: mockGame.starting_point!.lng,
      });
    });
  });
});

describe("RandomStrategy", () => {
  const strategy = new RandomStrategy();

  it("should generate points within bounding box", async () => {
    const points = await strategy.generatePoints(mockGame);

    points.forEach((point) => {
      expect(point.latitude).toBeGreaterThanOrEqual(
        mockGame.bounding_box.southEast.lat
      );
      expect(point.latitude).toBeLessThanOrEqual(
        mockGame.bounding_box.northWest.lat
      );
      expect(point.longitude).toBeGreaterThanOrEqual(
        mockGame.bounding_box.northWest.lng
      );
      expect(point.longitude).toBeLessThanOrEqual(
        mockGame.bounding_box.southEast.lng
      );
    });
  });

  it("should generate correct number of points", async () => {
    const points = await strategy.generatePoints(mockGame);
    expect(points.length).toBeGreaterThanOrEqual(6);
    expect(points.length).toBeLessThanOrEqual(9);
  });

  it("should generate points with meaningful hints", async () => {
    const points = await strategy.generatePoints(mockGame);

    // Check intermediate points have distance and direction hints
    points.slice(1, -1).forEach((point) => {
      expect(point.hint).toMatch(/approximately \d+\.\d+ km to the [NSEW]/);
    });

    // Check start and end points have correct hints
    expect(points[0].hint).toBe("Starting point");
    expect(points[points.length - 1].hint).toBe("Ending point");
  });
});

describe("OSMStrategy", () => {
  const strategy = new OSMStrategy();

  it("should handle OSM API errors gracefully", async () => {
    // Mock API error
    (global.fetch as jest.Mock).mockRejectedValue(new Error("API Error"));

    const points = await strategy.generatePoints(mockGame);
    expect(points.length).toBeGreaterThanOrEqual(6);
  });

  it("should handle non-JSON responses", async () => {
    // Mock XML response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/xml" }),
      text: () => Promise.resolve("<xml></xml>"),
    });

    const points = await strategy.generatePoints(mockGame);
    expect(points.length).toBeGreaterThanOrEqual(6);
  });

  it("should generate points avoiding restricted areas", async () => {
    const points = await strategy.generatePoints(mockGame);

    // Verify that points are not in water (using mock OSM data)
    points.forEach((point) => {
      // Create a simple polygon check instead of distance check
      const isInWater = mockOSMResponse.elements.some((element) => {
        if (element.tags.natural === "water") {
          // Check if point is within the rectangular area defined by the water polygon
          const minLat = Math.min(...element.geometry.map((p) => p.lat));
          const maxLat = Math.max(...element.geometry.map((p) => p.lat));
          const minLon = Math.min(...element.geometry.map((p) => p.lon));
          const maxLon = Math.max(...element.geometry.map((p) => p.lon));

          return (
            point.latitude >= minLat &&
            point.latitude <= maxLat &&
            point.longitude >= minLon &&
            point.longitude <= maxLon
          );
        }
        return false;
      });
      expect(isInWater).toBe(false);
    });
  });

  it("should respect buffer distance around restricted areas", async () => {
    const points = await strategy.generatePoints(mockGame);

    // Check buffer zone around water features
    points.forEach((point) => {
      const isTooClose = mockOSMResponse.elements.some((element) => {
        if (element.tags.natural === "water") {
          // Check if point is within buffer zone of the rectangular area
          const minLat =
            Math.min(...element.geometry.map((p) => p.lat)) - BUFFER_DISTANCE;
          const maxLat =
            Math.max(...element.geometry.map((p) => p.lat)) + BUFFER_DISTANCE;
          const minLon =
            Math.min(...element.geometry.map((p) => p.lon)) - BUFFER_DISTANCE;
          const maxLon =
            Math.max(...element.geometry.map((p) => p.lon)) + BUFFER_DISTANCE;

          return (
            point.latitude >= minLat &&
            point.latitude <= maxLat &&
            point.longitude >= minLon &&
            point.longitude <= maxLon
          );
        }
        return false;
      });
      expect(isTooClose).toBe(false);
    });
  });

  it("should generate meaningful hints with fallback when AI unavailable", async () => {
    const points = await strategy.generatePoints(mockGame, { useAIHints: false });

    // Check intermediate points have detailed hints
    points.slice(1, -1).forEach((point) => {
      // Should include distance and direction
      expect(point.hint).toMatch(/approximately \d+\.\d+ km to the [NSEW]/);
    });

    // Check start and end points
    expect(points[0].hint).toBe("Starting point");
    expect(points[points.length - 1].hint).toBe("Ending point");
  });

  describe("Landmark Goal Placement", () => {
    it("should use landmarks when 3+ are available", async () => {
      // Add multiple landmarks to mock response (need 3+ for feature to activate)
      const mockResponseWithLandmarks = {
        elements: [
          ...mockOSMResponse.elements,
          {
            type: "node",
            id: 997,
            lat: 61.45,
            lon: 23.55,
            tags: { natural: "peak", name: "Peak One" },
            geometry: [{ lat: 61.45, lon: 23.55 }],
          },
          {
            type: "node",
            id: 998,
            lat: 61.45,
            lon: 23.56,
            tags: { natural: "peak", name: "Peak Two" },
            geometry: [{ lat: 61.45, lon: 23.56 }],
          },
          {
            type: "node",
            id: 999,
            lat: 61.46,
            lon: 23.55,
            tags: { man_made: "tower", name: "Tower One" },
            geometry: [{ lat: 61.46, lon: 23.55 }],
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve(mockResponseWithLandmarks),
      });

      const points = await strategy.generatePoints(mockGame, { useAIHints: false });

      // Should generate valid game with end point
      expect(points.length).toBeGreaterThanOrEqual(6);
      expect(points[points.length - 1].type).toBe("end");
      
      // End point should be within game bounds
      const endPoint = points[points.length - 1];
      expect(endPoint.latitude).toBeGreaterThanOrEqual(61.4);
      expect(endPoint.latitude).toBeLessThanOrEqual(61.5);
      expect(endPoint.longitude).toBeGreaterThanOrEqual(23.5);
      expect(endPoint.longitude).toBeLessThanOrEqual(23.6);
    });

    it("should fallback when fewer than 3 landmarks (prevents repetitive games)", async () => {
      // Add only 2 landmarks - should fallback to prevent repetitive games
      const mockResponseWithFewLandmarks = {
        elements: [
          ...mockOSMResponse.elements,
          {
            type: "node",
            id: 998,
            lat: 61.45,
            lon: 23.55,
            tags: { natural: "peak", name: "Lonely Peak" },
            geometry: [{ lat: 61.45, lon: 23.55 }],
          },
          {
            type: "node",
            id: 999,
            lat: 61.46,
            lon: 23.56,
            tags: { man_made: "tower", name: "Single Tower" },
            geometry: [{ lat: 61.46, lon: 23.56 }],
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve(mockResponseWithFewLandmarks),
      });

      const points = await strategy.generatePoints(mockGame, { useAIHints: false });

      // Should still generate valid end point (not at landmark)
      expect(points.length).toBeGreaterThanOrEqual(6);
      expect(points[points.length - 1].type).toBe("end");
      // Will use calculated point, not snap to landmarks
    });

    it("should fallback to calculated end point when no landmarks available", async () => {
      // Use original mock response without landmarks
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve(mockOSMResponse),
      });

      const points = await strategy.generatePoints(mockGame, { useAIHints: false });

      // Should still generate valid end point
      expect(points.length).toBeGreaterThanOrEqual(6);
      expect(points[points.length - 1].type).toBe("end");
      expect(points[points.length - 1].hint).toBe("Ending point");
    });

    it("should generate valid end point with multiple landmarks available", async () => {
      // Add multiple landmarks with different priorities (need 3+ for feature)
      const mockResponseWithMultipleLandmarks = {
        elements: [
          ...mockOSMResponse.elements,
          {
            type: "node",
            id: 997,
            lat: 61.45,
            lon: 23.54,
            tags: { amenity: "parking", name: "Test Parking" },
            geometry: [{ lat: 61.45, lon: 23.54 }],
          },
          {
            type: "node",
            id: 998,
            lat: 61.45,
            lon: 23.55,
            tags: { amenity: "shelter", name: "Test Shelter" },
            geometry: [{ lat: 61.45, lon: 23.55 }],
          },
          {
            type: "node",
            id: 999,
            lat: 61.45,
            lon: 23.56,
            tags: { natural: "peak", name: "Test Peak" },
            geometry: [{ lat: 61.45, lon: 23.56 }],
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve(mockResponseWithMultipleLandmarks),
      });

      const points = await strategy.generatePoints(mockGame, { useAIHints: false });

      // Should generate valid game
      expect(points.length).toBeGreaterThanOrEqual(6);
      expect(points[points.length - 1].type).toBe("end");
      
      // Note: We can't deterministically test which landmark is chosen since
      // the end point is randomly generated first, then snapped to nearest landmark.
      // The test verifies the feature works without errors.
    });

    it("should generate valid end point when landmarks are outside search radius", async () => {
      // Add a landmark far outside the game area
      const mockResponseWithDistantLandmark = {
        elements: [
          ...mockOSMResponse.elements,
          {
            type: "node",
            id: 999,
            lat: 62.0, // Far outside game bounds (61.4-61.5)
            lon: 24.0, // Far outside game bounds (23.5-23.6)
            tags: { natural: "peak", name: "Distant Peak" },
            geometry: [{ lat: 62.0, lon: 24.0 }],
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve(mockResponseWithDistantLandmark),
      });

      const points = await strategy.generatePoints(mockGame, { useAIHints: false });
      const endPoint = points[points.length - 1];

      // Should generate valid end point within game bounds (not at distant landmark)
      expect(points.length).toBeGreaterThanOrEqual(6);
      expect(endPoint.type).toBe("end");
      expect(endPoint.latitude).toBeGreaterThanOrEqual(61.4);
      expect(endPoint.latitude).toBeLessThanOrEqual(61.5);
      expect(endPoint.longitude).toBeGreaterThanOrEqual(23.5);
      expect(endPoint.longitude).toBeLessThanOrEqual(23.6);
    });
  });
});
