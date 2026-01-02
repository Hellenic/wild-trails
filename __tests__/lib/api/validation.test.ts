/**
 * @jest-environment node
 */
import {
  createGameSchema,
  updateGameStatusSchema,
  joinGameSchema,
  updatePlayerStatusSchema,
  updatePointStatusSchema,
  locationUpdateSchema,
  gameResponseSchema,
} from "@/lib/api/validation";
import { GAME_MODES } from "@/lib/game/constants";

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

    it("should accept optional max_players", () => {
      const gameWithMaxPlayers = {
        name: "Test Game",
        password: "password123",
        duration: 60,
        max_radius: 5000,
        player_count: 2,
        max_players: 3,
        game_mode: "multi_player" as const,
        game_master: "player" as const,
        bounding_box: {
          northWest: { lat: 40.7128, lng: -74.006 },
          southEast: { lat: 40.7108, lng: -73.996 },
        },
      };

      const result = createGameSchema.safeParse(gameWithMaxPlayers);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.max_players).toBe(3);
      }
    });

    it("should accept optional generate_game_code flag", () => {
      const gameWithCodeGeneration = {
        name: "Test Game",
        password: "password123",
        duration: 60,
        max_radius: 5000,
        player_count: 2,
        game_mode: "two_player" as const,
        game_master: "ai" as const,
        generate_game_code: true,
        bounding_box: {
          northWest: { lat: 40.7128, lng: -74.006 },
          southEast: { lat: 40.7108, lng: -73.996 },
        },
      };

      const result = createGameSchema.safeParse(gameWithCodeGeneration);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.generate_game_code).toBe(true);
      }
    });

    it("should default generate_game_code to false", () => {
      const gameWithoutCodeFlag = {
        name: "Test Game",
        password: "password123",
        duration: 60,
        max_radius: 5000,
        player_count: 1,
        game_mode: "single_player" as const,
        game_master: "ai" as const,
        bounding_box: {
          northWest: { lat: 40.7128, lng: -74.006 },
          southEast: { lat: 40.7108, lng: -73.996 },
        },
      };

      const result = createGameSchema.safeParse(gameWithoutCodeFlag);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.generate_game_code).toBe(false);
      }
    });

    it("should validate all game modes", () => {
      GAME_MODES.forEach((mode) => {
        const game = {
          name: "Test Game",
          password: "password123",
          duration: 60,
          max_radius: 5000,
          player_count: mode === "single_player" ? 1 : mode === "two_player" ? 2 : 3,
          game_mode: mode,
          game_master: "ai" as const,
          bounding_box: {
            northWest: { lat: 40.7128, lng: -74.006 },
            southEast: { lat: 40.7108, lng: -73.996 },
          },
        };

        const result = createGameSchema.safeParse(game);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid game mode", () => {
      const invalidGame = {
        name: "Test Game",
        password: "password123",
        duration: 60,
        max_radius: 5000,
        player_count: 2,
        game_mode: "invalid_mode",
        game_master: "ai" as const,
        bounding_box: {
          northWest: { lat: 40.7128, lng: -74.006 },
          southEast: { lat: 40.7108, lng: -73.996 },
        },
      };

      const result = createGameSchema.safeParse(invalidGame);
      expect(result.success).toBe(false);
    });

    it("should accept selected_role for multiplayer games", () => {
      const multiplayerGame = {
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

      const result = createGameSchema.safeParse(multiplayerGame);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.selected_role).toBe("player_a");
      }
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

    it("should accept optional password", () => {
      const joinWithPassword = {
        role: "player_a",
        password: "game_password",
      };

      const result = joinGameSchema.safeParse(joinWithPassword);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.password).toBe("game_password");
      }
    });

    it("should validate without password", () => {
      const joinWithoutPassword = {
        role: "player_b",
      };

      const result = joinGameSchema.safeParse(joinWithoutPassword);
      expect(result.success).toBe(true);
    });
  });

  describe("gameResponseSchema", () => {
    const validGameResponse = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      created_at: "2024-01-01T00:00:00Z",
      started_at: null,
      ended_at: null,
      creator_id: "123e4567-e89b-12d3-a456-426614174001",
      name: "Test Game",
      password: "password123",
      duration: 60,
      max_radius: 5000,
      player_count: 2,
      max_players: 3,
      game_code: "ABC123",
      is_public: false,
      game_mode: "two_player" as const,
      game_master: "ai" as const,
      difficulty: "medium" as const,
      selected_role: "player_a" as const,
      starting_point: { lat: 40.7118, lng: -74.001 },
      bounding_box: {
        northWest: { lat: 40.7128, lng: -74.006 },
        southEast: { lat: 40.7108, lng: -73.996 },
      },
      status: "setup" as const,
    };

    it("should validate a complete game response", () => {
      const result = gameResponseSchema.safeParse(validGameResponse);
      expect(result.success).toBe(true);
    });

    it("should accept null for game_code", () => {
      const responseWithNullCode = {
        ...validGameResponse,
        game_code: null,
      };

      const result = gameResponseSchema.safeParse(responseWithNullCode);
      expect(result.success).toBe(true);
    });

    it("should accept null for max_players", () => {
      const responseWithNullMaxPlayers = {
        ...validGameResponse,
        max_players: null,
      };

      const result = gameResponseSchema.safeParse(responseWithNullMaxPlayers);
      expect(result.success).toBe(true);
    });

    it("should accept null for is_public", () => {
      const responseWithNullPublic = {
        ...validGameResponse,
        is_public: null,
      };

      const result = gameResponseSchema.safeParse(responseWithNullPublic);
      expect(result.success).toBe(true);
    });

    it("should validate all game modes in response", () => {
      const modes = ["single_player", "two_player", "multi_player"] as const;
      
      modes.forEach((mode) => {
        const response = { ...validGameResponse, game_mode: mode };
        const result = gameResponseSchema.safeParse(response);
        expect(result.success).toBe(true);
      });
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

