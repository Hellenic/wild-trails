/**
 * Role System Constants and Permissions
 * 
 * Defines the roles available in Wild Trails multiplayer games
 * and their associated permissions.
 */

import {
  type GameRole,
  type GameMode,
  type GameMaster,
} from "./constants";
import { ROLE_COLORS } from "@/lib/theme/colors";

// Re-export GameRole for convenience
export type { GameRole };

export interface RolePermissions {
  /** Can see their own location on the map */
  canSeeOwnLocation: boolean;
  /** Can see the goal location (end point) */
  canSeeGoalLocation: boolean;
  /** Can see other players' locations on the map */
  canSeeOtherPlayers: boolean;
  /** Can request hints from the system */
  canRequestHints: boolean;
  /** Can receive and see hints */
  canSeeHints: boolean;
  /** Can manually trigger hints for other players */
  canManuallyTriggerHints: boolean;
  /** Can edit game points */
  canEditPoints: boolean;
  /** Can see all waypoints (clues) from the start */
  canSeeAllWaypoints: boolean;
  /** Can start the game */
  canStartGame: boolean;
  /** Receives proximity alerts for waypoints */
  receivesProximityAlerts: boolean;
}

export interface RoleInfo {
  name: string;
  shortName: string;
  description: string;
  icon: string;
  color: string;
  hexColor: string;
  permissions: RolePermissions;
}

/**
 * Permission configurations for each role
 */
export const ROLE_PERMISSIONS: Record<GameRole, RolePermissions> = {
  player_a: {
    canSeeOwnLocation: true,
    canSeeGoalLocation: false,  // Sees goal only when reached
    canSeeOtherPlayers: true,
    canRequestHints: true,
    canSeeHints: false,         // Gets hints relayed from Player B
    canManuallyTriggerHints: false,
    canEditPoints: false,
    canSeeAllWaypoints: false,  // Discovers waypoints as they go
    canStartGame: false,
    receivesProximityAlerts: true,
  },
  player_b: {
    canSeeOwnLocation: true,
    canSeeGoalLocation: false,  // Cannot see goal - must guide using waypoint hints
    canSeeOtherPlayers: true,
    canRequestHints: false,
    canSeeHints: true,          // Receives hints to relay
    canManuallyTriggerHints: false,
    canEditPoints: false,
    canSeeAllWaypoints: true,   // Can see all waypoints to help guide
    canStartGame: false,
    receivesProximityAlerts: false,
  },
  game_master: {
    canSeeOwnLocation: true,
    canSeeGoalLocation: true,
    canSeeOtherPlayers: true,
    canRequestHints: false,
    canSeeHints: true,
    canManuallyTriggerHints: true,
    canEditPoints: true,
    canSeeAllWaypoints: true,
    canStartGame: true,
    receivesProximityAlerts: false,
  },
};

/**
 * Role information including display names, icons, and colors
 */
export const ROLE_INFO: Record<GameRole, RoleInfo> = {
  player_a: {
    name: "Player A (Seeker)",
    shortName: "Seeker",
    description: "Starts at the beginning and seeks the goal. Requests and receives hints from the guide.",
    icon: "directions_walk",
    color: "text-role-seeker-light",
    hexColor: ROLE_COLORS.seeker.DEFAULT,
    permissions: ROLE_PERMISSIONS.player_a,
  },
  player_b: {
    name: "Player B (Guide)",
    shortName: "Guide",
    description: "Located at the goal position. Receives hints from the system to relay to the seeker.",
    icon: "assistant_navigation",
    color: "text-role-guide-light",
    hexColor: ROLE_COLORS.guide.DEFAULT,
    permissions: ROLE_PERMISSIONS.player_b,
  },
  game_master: {
    name: "Game Master",
    shortName: "GM",
    description: "Monitors all players, can trigger hints, and manages the game flow.",
    icon: "admin_panel_settings",
    color: "text-role-gm-light",
    hexColor: ROLE_COLORS.gm.DEFAULT,
    permissions: ROLE_PERMISSIONS.game_master,
  },
};

/**
 * Get permissions for a specific role
 */
export function getRolePermissions(role: GameRole): RolePermissions {
  return ROLE_PERMISSIONS[role];
}

/**
 * Get role info including name, description, and permissions
 */
export function getRoleInfo(role: GameRole): RoleInfo {
  return ROLE_INFO[role];
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  role: GameRole,
  permission: keyof RolePermissions
): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

/**
 * Get all roles that have a specific permission
 */
export function getRolesWithPermission(
  permission: keyof RolePermissions
): GameRole[] {
  return (Object.keys(ROLE_PERMISSIONS) as GameRole[]).filter(
    (role) => ROLE_PERMISSIONS[role][permission]
  );
}

/**
 * Get available roles for a game based on player count
 */
export function getAvailableRoles(playerCount: number): GameRole[] {
  if (playerCount === 1) {
    return ["player_a"];
  }
  if (playerCount === 2) {
    return ["player_a", "player_b"];
  }
  // 3+ players
  return ["player_a", "player_b", "game_master"];
}

/**
 * Validate if a role is allowed for a given game mode
 */
export function isRoleValidForGameMode(
  role: GameRole,
  gameMode: GameMode,
  gameMasterType: GameMaster
): boolean {
  if (gameMode === "single_player") {
    return role === "player_a";
  }
  
  if (gameMode === "two_player") {
    if (gameMasterType === "player") {
      // 2-player with Player GM: player_a + game_master (no player_b)
      return role === "player_a" || role === "game_master";
    }
    // 2-player with AI GM: player_a + player_b
    return role === "player_a" || role === "player_b";
  }
  
  // multi_player
  if (role === "game_master") {
    return gameMasterType === "player";
  }
  
  return true;
}

