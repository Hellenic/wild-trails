/**
 * Game Constants
 *
 * Centralized definitions for game-related constants.
 * Types are derived from database schema (source of truth) via types/game.ts.
 * Arrays are type-checked against those types to ensure consistency.
 */

import type {
  GameMode,
  GameMaster,
  GameStatus,
  GameRole,
  PlayerStatus,
  GameDifficulty,
  PointType,
  PointStatus,
} from "@/types/game";

// Re-export types from the source of truth
export type {
  GameMode,
  GameMaster,
  GameStatus,
  GameRole,
  PlayerStatus,
  GameDifficulty,
  PointType,
  PointStatus,
};

// ============================================================================
// Game Mode
// ============================================================================

export const GAME_MODES: readonly GameMode[] = [
  "single_player",
  "two_player",
  "multi_player",
];

// ============================================================================
// Game Master Type
// ============================================================================

export const GAME_MASTER_TYPES: readonly GameMaster[] = ["ai", "player"];

// ============================================================================
// Game Status
// ============================================================================

export const GAME_STATUSES: readonly GameStatus[] = [
  "setup",
  "ready",
  "active",
  "completed",
  "failed",
];

// ============================================================================
// Game Role
// ============================================================================

export const GAME_ROLES: readonly GameRole[] = [
  "player_a",
  "player_b",
  "game_master",
];

// ============================================================================
// Player Status
// ============================================================================

export const PLAYER_STATUSES: readonly PlayerStatus[] = [
  "waiting",
  "ready",
  "playing",
  "finished",
];

// ============================================================================
// Game Difficulty
// ============================================================================

export const GAME_DIFFICULTIES: readonly GameDifficulty[] = [
  "easy",
  "medium",
  "hard",
];

// ============================================================================
// Point Types
// ============================================================================

export const POINT_TYPES: readonly PointType[] = ["start", "end", "clue"];

export const POINT_STATUSES: readonly PointStatus[] = ["unvisited", "visited"];
