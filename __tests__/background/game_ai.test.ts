// First, mock osmtogeojson
jest.mock("osmtogeojson", () => {
  return function (osmData: any) {
    return {
      type: "FeatureCollection",
      features: osmData.elements.map((element: any) => ({
        type: "Feature",
        id: element.id,
        properties: element.tags, // Simplified: just use tags directly as properties
        geometry: {
          type: "Polygon",
          coordinates: [
            element.geometry.map((point: any) => [point.lon, point.lat]),
          ],
        },
      })),
    };
  };
});

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
            Math.min(...element.geometry.map((p) => p.lat)) - 0.0001;
          const maxLat =
            Math.max(...element.geometry.map((p) => p.lat)) + 0.0001;
          const minLon =
            Math.min(...element.geometry.map((p) => p.lon)) - 0.0001;
          const maxLon =
            Math.max(...element.geometry.map((p) => p.lon)) + 0.0001;

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

  it("should generate meaningful hints with nearby features", async () => {
    const points = await strategy.generatePoints(mockGame);

    // Check intermediate points have detailed hints
    points.slice(1, -1).forEach((point) => {
      // Should include distance and direction
      expect(point.hint).toMatch(/approximately \d+\.\d+ km to the [NSEW]/);

      // Should include nearby features when available
      if (point.hint.includes("Nearby:")) {
        expect(point.hint).toMatch(/Nearby: [^.]+\./);
        // Should mention specific features from our mock data
        expect(point.hint).toMatch(/forest|park|water/);
      }

      // Should include warnings when relevant
      if (point.hint.includes("Caution:")) {
        expect(point.hint).toMatch(/Caution: water ahead/);
      }
    });
  });
});
