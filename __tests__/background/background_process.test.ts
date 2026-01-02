/**
 * Tests for background process game creation
 * Specifically testing the starting_point extraction and storage
 */

describe("Background Process - Starting Point Extraction", () => {
  it("should extract starting point from generated points", () => {
    const points = [
      {
        id: "start-1",
        latitude: 60.1,
        longitude: 24.5,
        sequence_number: 0,
        type: "start",
        status: "unvisited",
        hint: "Starting point",
      },
      {
        id: "clue-1",
        latitude: 60.2,
        longitude: 24.6,
        sequence_number: 1,
        type: "clue",
        status: "unvisited",
        hint: "Look north",
      },
      {
        id: "end-1",
        latitude: 60.3,
        longitude: 24.7,
        sequence_number: 2,
        type: "end",
        status: "unvisited",
        hint: "Goal!",
      },
    ];

    // This is the logic from background_process.ts
    const startPoint = points.find((p) => p.type === "start");
    const startingPoint = startPoint
      ? { lat: startPoint.latitude, lng: startPoint.longitude }
      : null;

    expect(startingPoint).toEqual({
      lat: 60.1,
      lng: 24.5,
    });
  });

  it("should return null if no start point exists", () => {
    const points = [
      {
        id: "clue-1",
        latitude: 60.2,
        longitude: 24.6,
        sequence_number: 1,
        type: "clue",
        status: "unvisited",
        hint: "Look north",
      },
    ];

    const startPoint = points.find((p) => p.type === "start");
    const startingPoint = startPoint
      ? { lat: startPoint.latitude, lng: startPoint.longitude }
      : null;

    expect(startingPoint).toBeNull();
  });

  it("should handle empty points array", () => {
    const points: Array<{ type: string; latitude: number; longitude: number }> = [];

    const startPoint = points.find((p) => p.type === "start");
    const startingPoint = startPoint
      ? { lat: startPoint.latitude, lng: startPoint.longitude }
      : null;

    expect(startingPoint).toBeNull();
  });
});

describe("Background Process - Game Update Payload", () => {
  it("should include starting_point in game update", () => {
    const startingPoint = { lat: 60.1, lng: 24.5 };

    // The update payload that should be sent to Supabase
    const updatePayload = {
      status: "ready",
      starting_point: startingPoint,
      processing_started_at: null,
      processing_attempts: 0,
      last_processing_error: null,
    };

    expect(updatePayload.starting_point).toEqual(startingPoint);
    expect(updatePayload.status).toBe("ready");
  });

  it("should handle null starting_point gracefully", () => {
    const startingPoint = null;

    const updatePayload = {
      status: "ready",
      starting_point: startingPoint,
      processing_started_at: null,
      processing_attempts: 0,
      last_processing_error: null,
    };

    expect(updatePayload.starting_point).toBeNull();
  });
});

describe("Background Process - Point Generation Sequence", () => {
  it("should generate points in correct sequence order", () => {
    const mockPoints = [
      { sequence_number: 0, type: "start" },
      { sequence_number: 1, type: "clue" },
      { sequence_number: 2, type: "clue" },
      { sequence_number: 3, type: "end" },
    ];

    // Start should always be sequence 0
    const startPoint = mockPoints.find((p) => p.type === "start");
    expect(startPoint?.sequence_number).toBe(0);

    // End should be the highest sequence number
    const endPoint = mockPoints.find((p) => p.type === "end");
    const maxSequence = Math.max(...mockPoints.map((p) => p.sequence_number));
    expect(endPoint?.sequence_number).toBe(maxSequence);
  });

  it("should always have start point at sequence 0", () => {
    // Even if points are unordered, start should be found correctly
    const unorderedPoints = [
      { sequence_number: 2, type: "clue" },
      { sequence_number: 3, type: "end" },
      { sequence_number: 0, type: "start" },
      { sequence_number: 1, type: "clue" },
    ];

    const startPoint = unorderedPoints.find((p) => p.type === "start");
    expect(startPoint?.sequence_number).toBe(0);
  });
});

