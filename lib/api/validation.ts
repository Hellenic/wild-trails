import { z } from "zod";

// ============================================================================
// Shared Base Schemas
// ============================================================================

const uuidSchema = z.string().uuid();

// ============================================================================
// Game Schemas
// ============================================================================

export const gameMasterTypeSchema = z.enum(["player", "ai"]);
export const gameModeTypeSchema = z.enum(["single_player", "two_player", "multi_player"]);
export const gameStatusTypeSchema = z.enum(["setup", "ready", "active", "completed"]);
export const gameRoleTypeSchema = z.enum(["player_a", "player_b", "game_master"]);
export const gameDifficultyTypeSchema = z.enum(["easy", "medium", "hard"]);

export const boundingBoxSchema = z.object({
  northWest: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  southEast: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
});

export const startingPointSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export const createGameSchema = z.object({
  name: z.string().min(1, "Game name is required"),
  password: z.string().min(1, "Password is required"),
  duration: z.number().int().positive(),
  max_radius: z.number().positive(),
  player_count: z.number().int().positive(),
  game_mode: gameModeTypeSchema,
  game_master: gameMasterTypeSchema,
  difficulty: gameDifficultyTypeSchema.optional().default("easy"),
  selected_role: gameRoleTypeSchema.optional(),
  starting_point: startingPointSchema.optional(),
  bounding_box: boundingBoxSchema,
});

export const updateGameStatusSchema = z.object({
  status: gameStatusTypeSchema,
});

export const gameResponseSchema = z.object({
  id: uuidSchema,
  created_at: z.string(),
  started_at: z.string().nullable(),
  ended_at: z.string().nullable(),
  creator_id: uuidSchema,
  name: z.string(),
  password: z.string(),
  duration: z.number(),
  max_radius: z.number(),
  player_count: z.number(),
  game_mode: gameModeTypeSchema,
  game_master: gameMasterTypeSchema,
  difficulty: gameDifficultyTypeSchema,
  selected_role: gameRoleTypeSchema.nullable(),
  starting_point: startingPointSchema.nullable(),
  bounding_box: boundingBoxSchema,
  status: gameStatusTypeSchema,
});

// ============================================================================
// Player Schemas
// ============================================================================

export const playerStatusTypeSchema = z.enum(["waiting", "ready", "playing", "finished"]);

export const joinGameSchema = z.object({
  role: gameRoleTypeSchema,
});

export const updatePlayerStatusSchema = z.object({
  status: playerStatusTypeSchema,
});

export const playerResponseSchema = z.object({
  id: uuidSchema,
  created_at: z.string(),
  game_id: uuidSchema,
  user_id: uuidSchema,
  role: gameRoleTypeSchema,
  status: playerStatusTypeSchema,
});

// ============================================================================
// Point Schemas
// ============================================================================

export const pointTypeSchema = z.enum(["start", "end", "clue"]);
export const pointStatusTypeSchema = z.enum(["unvisited", "visited"]);

export const pointSetupSchema = z.object({
  id: uuidSchema,
  type: pointTypeSchema,
  position: z.tuple([z.number(), z.number()]),
  hint: z.string().optional(),
});

export const createPointsSchema = z.object({
  points: z.array(pointSetupSchema).min(1),
});

export const updatePointStatusSchema = z.object({
  status: pointStatusTypeSchema,
});

export const pointResponseSchema = z.object({
  id: uuidSchema,
  game_id: uuidSchema,
  latitude: z.number(),
  longitude: z.number(),
  sequence_number: z.number(),
  hint: z.string().nullable(),
  type: pointTypeSchema,
  status: pointStatusTypeSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

// ============================================================================
// Location Schemas
// ============================================================================

export const locationUpdateSchema = z.object({
  game_id: uuidSchema,
  player_id: uuidSchema,
  latitude: z.number(),
  longitude: z.number(),
  altitude: z.number().nullable(),
  altitude_accuracy: z.number().nullable(),
  accuracy: z.number(),
  speed: z.number().nullable(),
  heading: z.number().nullable(),
});

export const proximityEventSchema = z.object({
  point_id: uuidSchema,
  point_type: pointTypeSchema,
  hint: z.string().nullable(),
  distance: z.number(),
});

// ============================================================================
// Type Exports (for use in frontend and API)
// ============================================================================

export type CreateGameInput = z.infer<typeof createGameSchema>;
export type UpdateGameStatusInput = z.infer<typeof updateGameStatusSchema>;
export type GameResponse = z.infer<typeof gameResponseSchema>;

export type JoinGameInput = z.infer<typeof joinGameSchema>;
export type UpdatePlayerStatusInput = z.infer<typeof updatePlayerStatusSchema>;
export type PlayerResponse = z.infer<typeof playerResponseSchema>;

export type PointSetup = z.infer<typeof pointSetupSchema>;
export type CreatePointsInput = z.infer<typeof createPointsSchema>;
export type UpdatePointStatusInput = z.infer<typeof updatePointStatusSchema>;
export type PointResponse = z.infer<typeof pointResponseSchema>;

export type LocationUpdateInput = z.infer<typeof locationUpdateSchema>;
export type ProximityEvent = z.infer<typeof proximityEventSchema>;

