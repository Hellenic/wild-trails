import { generateGamePoints } from "@/app/background/game_ai";
import type { Game } from "@/types/game";

describe("generateGamePoints", () => {
  const mockGame: Game = {
    id: "123",
    name: "Test Game",
    bounding_box: {
      northWest: { lat: 51.5, lng: -0.2 },
      southEast: { lat: 51.4, lng: -0.1 },
    },
    max_radius: 5,
    created_at: new Date().toISOString(),
  };

  it("generates correct number of points (4-7 plus start and end)", async () => {
    const points = await generateGamePoints(mockGame);
    expect(points.length).toBeGreaterThanOrEqual(6); // min 4 + start + end
    expect(points.length).toBeLessThanOrEqual(9); // max 7 + start + end
  });

  it("includes start and end points with correct types", async () => {
    const points = await generateGamePoints(mockGame);

    const startPoint = points.find((p) => p.type === "start");
    expect(startPoint).toBeDefined();
    expect(startPoint?.sequence_number).toBe(0);

    const endPoint = points.find((p) => p.type === "end");
    expect(endPoint).toBeDefined();
    expect(endPoint?.sequence_number).toBe(points.length - 1);
  });

  it("generates points within the bounding box", async () => {
    const points = await generateGamePoints(mockGame);

    points.forEach((point) => {
      expect(point.latitude).toBeLessThanOrEqual(
        mockGame.bounding_box.northWest.lat
      );
      expect(point.latitude).toBeGreaterThanOrEqual(
        mockGame.bounding_box.southEast.lat
      );
      expect(point.longitude).toBeGreaterThanOrEqual(
        mockGame.bounding_box.northWest.lng
      );
      expect(point.longitude).toBeLessThanOrEqual(
        mockGame.bounding_box.southEast.lng
      );
    });
  });

  it("uses provided starting point when available", async () => {
    const gameWithStartingPoint: Game = {
      ...mockGame,
      starting_point: { lat: 51.45, lng: -0.15 },
    };

    const points = await generateGamePoints(gameWithStartingPoint);
    const startPoint = points.find((p) => p.type === "start");

    expect(startPoint?.latitude).toBe(51.45);
    expect(startPoint?.longitude).toBe(-0.15);
  });

  it("throws error when bounding box is not defined", async () => {
    const invalidGame = { ...mockGame, bounding_box: undefined };

    await expect(generateGamePoints(invalidGame as Game)).rejects.toThrow(
      "Bounding box not defined"
    );
  });
});
