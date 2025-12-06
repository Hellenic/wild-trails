import {
  createGameSchema,
  updateGameStatusSchema,
  joinGameSchema,
  updatePlayerStatusSchema,
  updatePointStatusSchema,
  locationUpdateSchema,
} from "@/lib/api/validation";

describe("API Validation Schemas", () => {
  describe("createGameSchema", () => {
    it("should validate a valid game creation request", () => {
      const validGame = {
        name: "Test Game",
        password: "password123",
        duration: 60,
        max_radius: 5000,
        player_count: 2,
        game_mode: "two_player" as const,
        game_master: "ai" as const,
        selected_role: "player_a" as const,
        bounding_box: {
          northWest: { lat: 40.7128, lng: -74.006 },
          southEast: { lat: 40.7108, lng: -73.996 },
        },
      };

      const result = createGameSchema.safeParse(validGame);
      expect(result.success).toBe(true);
    });

    it("should reject game without name", () => {
      const invalidGame = {
        password: "password123",
        duration: 60,
        max_radius: 5000,
        player_count: 2,
        game_mode: "single_player" as const,
        game_master: "player" as const,
        bounding_box: {
          northWest: { lat: 40.7128, lng: -74.006 },
          southEast: { lat: 40.7108, lng: -73.996 },
        },
      };

      const result = createGameSchema.safeParse(invalidGame);
      expect(result.success).toBe(false);
    });

    it("should reject negative duration", () => {
      const invalidGame = {
        name: "Test Game",
        password: "password123",
        duration: -60,
        max_radius: 5000,
        player_count: 2,
        game_mode: "single_player" as const,
        game_master: "player" as const,
        bounding_box: {
          northWest: { lat: 40.7128, lng: -74.006 },
          southEast: { lat: 40.7108, lng: -73.996 },
        },
      };

      const result = createGameSchema.safeParse(invalidGame);
      expect(result.success).toBe(false);
    });

    it("should accept optional starting_point", () => {
      const gameWithStartPoint = {
        name: "Test Game",
        password: "password123",
        duration: 60,
        max_radius: 5000,
        player_count: 2,
        game_mode: "single_player" as const,
        game_master: "ai" as const,
        starting_point: { lat: 40.7118, lng: -74.001 },
        bounding_box: {
          northWest: { lat: 40.7128, lng: -74.006 },
          southEast: { lat: 40.7108, lng: -73.996 },
        },
      };

      const result = createGameSchema.safeParse(gameWithStartPoint);
      expect(result.success).toBe(true);
    });
  });

  describe("updateGameStatusSchema", () => {
    it("should validate valid game status", () => {
      const statuses = ["setup", "ready", "active", "completed"];
      
      statuses.forEach((status) => {
        const result = updateGameStatusSchema.safeParse({ status });
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid game status", () => {
      const result = updateGameStatusSchema.safeParse({ status: "invalid" });
      expect(result.success).toBe(false);
    });
  });

  describe("locationUpdateSchema", () => {
    it("should validate valid location update", () => {
      const validLocation = {
        game_id: "123e4567-e89b-12d3-a456-426614174000",
        player_id: "123e4567-e89b-12d3-a456-426614174001",
        latitude: 40.7128,
        longitude: -74.006,
        altitude: 10.5,
        altitude_accuracy: 5.0,
        accuracy: 10.0,
        speed: 1.5,
        heading: 90.0,
      };

      const result = locationUpdateSchema.safeParse(validLocation);
      expect(result.success).toBe(true);
    });

    it("should accept null values for optional fields", () => {
      const locationWithNulls = {
        game_id: "123e4567-e89b-12d3-a456-426614174000",
        player_id: "123e4567-e89b-12d3-a456-426614174001",
        latitude: 40.7128,
        longitude: -74.006,
        altitude: null,
        altitude_accuracy: null,
        accuracy: 10.0,
        speed: null,
        heading: null,
      };

      const result = locationUpdateSchema.safeParse(locationWithNulls);
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID format", () => {
      const invalidLocation = {
        game_id: "not-a-uuid",
        player_id: "123e4567-e89b-12d3-a456-426614174001",
        latitude: 40.7128,
        longitude: -74.006,
        altitude: null,
        altitude_accuracy: null,
        accuracy: 10.0,
        speed: null,
        heading: null,
      };

      const result = locationUpdateSchema.safeParse(invalidLocation);
      expect(result.success).toBe(false);
    });
  });

  describe("joinGameSchema", () => {
    it("should validate valid join game request", () => {
      const roles = ["player_a", "player_b", "game_master"];
      
      roles.forEach((role) => {
        const result = joinGameSchema.safeParse({ role });
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid role", () => {
      const result = joinGameSchema.safeParse({ role: "invalid_role" });
      expect(result.success).toBe(false);
    });
  });

  describe("updatePlayerStatusSchema", () => {
    it("should validate valid player status", () => {
      const statuses = ["waiting", "ready", "playing", "finished"];
      
      statuses.forEach((status) => {
        const result = updatePlayerStatusSchema.safeParse({ status });
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid player status", () => {
      const result = updatePlayerStatusSchema.safeParse({ status: "invalid" });
      expect(result.success).toBe(false);
    });
  });

  describe("updatePointStatusSchema", () => {
    it("should validate valid point status", () => {
      const statuses = ["unvisited", "visited"];
      
      statuses.forEach((status) => {
        const result = updatePointStatusSchema.safeParse({ status });
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid point status", () => {
      const result = updatePointStatusSchema.safeParse({ status: "invalid" });
      expect(result.success).toBe(false);
    });
  });
});

