/**
 * @jest-environment node
 */
import {
  ROLE_PERMISSIONS,
  ROLE_INFO,
  getRolePermissions,
  getRoleInfo,
  hasPermission,
  getRolesWithPermission,
  getAvailableRoles,
  isRoleValidForGameMode,
  type GameRole,
} from "@/lib/game/roles";

describe("Role System", () => {
  describe("ROLE_PERMISSIONS", () => {
    it("should define permissions for all three roles", () => {
      expect(ROLE_PERMISSIONS).toHaveProperty("player_a");
      expect(ROLE_PERMISSIONS).toHaveProperty("player_b");
      expect(ROLE_PERMISSIONS).toHaveProperty("game_master");
    });

    it("should have correct Player A permissions", () => {
      const permissions = ROLE_PERMISSIONS.player_a;
      
      expect(permissions.canSeeOwnLocation).toBe(true);
      expect(permissions.canSeeGoalLocation).toBe(false);
      expect(permissions.canSeeOtherPlayers).toBe(true);
      expect(permissions.canRequestHints).toBe(true);
      expect(permissions.canSeeHints).toBe(false);
      expect(permissions.canManuallyTriggerHints).toBe(false);
      expect(permissions.canSeeAllWaypoints).toBe(false);
      expect(permissions.receivesProximityAlerts).toBe(true);
    });

    it("should have correct Player B permissions", () => {
      const permissions = ROLE_PERMISSIONS.player_b;
      
      expect(permissions.canSeeOwnLocation).toBe(true);
      expect(permissions.canSeeGoalLocation).toBe(true);
      expect(permissions.canSeeOtherPlayers).toBe(true);
      expect(permissions.canRequestHints).toBe(false);
      expect(permissions.canSeeHints).toBe(true);
      expect(permissions.canManuallyTriggerHints).toBe(false);
      expect(permissions.canSeeAllWaypoints).toBe(true);
      expect(permissions.receivesProximityAlerts).toBe(false);
    });

    it("should have correct Game Master permissions", () => {
      const permissions = ROLE_PERMISSIONS.game_master;
      
      expect(permissions.canSeeOwnLocation).toBe(true);
      expect(permissions.canSeeGoalLocation).toBe(true);
      expect(permissions.canSeeOtherPlayers).toBe(true);
      expect(permissions.canRequestHints).toBe(false);
      expect(permissions.canSeeHints).toBe(true);
      expect(permissions.canManuallyTriggerHints).toBe(true);
      expect(permissions.canEditPoints).toBe(true);
      expect(permissions.canStartGame).toBe(true);
    });
  });

  describe("ROLE_INFO", () => {
    it("should define info for all three roles", () => {
      expect(ROLE_INFO).toHaveProperty("player_a");
      expect(ROLE_INFO).toHaveProperty("player_b");
      expect(ROLE_INFO).toHaveProperty("game_master");
    });

    it("should have name, shortName, description, icon, and color for each role", () => {
      const roles: GameRole[] = ["player_a", "player_b", "game_master"];
      
      roles.forEach((role) => {
        const info = ROLE_INFO[role];
        expect(info.name).toBeDefined();
        expect(info.shortName).toBeDefined();
        expect(info.description).toBeDefined();
        expect(info.icon).toBeDefined();
        expect(info.color).toBeDefined();
        expect(info.permissions).toBeDefined();
      });
    });

    it("should have correct display names", () => {
      expect(ROLE_INFO.player_a.name).toBe("Player A (Seeker)");
      expect(ROLE_INFO.player_a.shortName).toBe("Seeker");
      
      expect(ROLE_INFO.player_b.name).toBe("Player B (Guide)");
      expect(ROLE_INFO.player_b.shortName).toBe("Guide");
      
      expect(ROLE_INFO.game_master.name).toBe("Game Master");
      expect(ROLE_INFO.game_master.shortName).toBe("GM");
    });
  });

  describe("getRolePermissions", () => {
    it("should return permissions for valid role", () => {
      const permissions = getRolePermissions("player_a");
      expect(permissions).toEqual(ROLE_PERMISSIONS.player_a);
    });

    it("should return correct permissions for each role", () => {
      expect(getRolePermissions("player_a")).toBe(ROLE_PERMISSIONS.player_a);
      expect(getRolePermissions("player_b")).toBe(ROLE_PERMISSIONS.player_b);
      expect(getRolePermissions("game_master")).toBe(ROLE_PERMISSIONS.game_master);
    });
  });

  describe("getRoleInfo", () => {
    it("should return info for valid role", () => {
      const info = getRoleInfo("player_b");
      expect(info).toEqual(ROLE_INFO.player_b);
    });

    it("should return correct info for each role", () => {
      expect(getRoleInfo("player_a")).toBe(ROLE_INFO.player_a);
      expect(getRoleInfo("player_b")).toBe(ROLE_INFO.player_b);
      expect(getRoleInfo("game_master")).toBe(ROLE_INFO.game_master);
    });
  });

  describe("hasPermission", () => {
    it("should return true when role has permission", () => {
      expect(hasPermission("player_a", "canRequestHints")).toBe(true);
      expect(hasPermission("player_b", "canSeeGoalLocation")).toBe(true);
      expect(hasPermission("game_master", "canManuallyTriggerHints")).toBe(true);
    });

    it("should return false when role lacks permission", () => {
      expect(hasPermission("player_a", "canSeeGoalLocation")).toBe(false);
      expect(hasPermission("player_b", "canRequestHints")).toBe(false);
      expect(hasPermission("player_a", "canManuallyTriggerHints")).toBe(false);
    });
  });

  describe("getRolesWithPermission", () => {
    it("should return roles that can see goal location", () => {
      const roles = getRolesWithPermission("canSeeGoalLocation");
      expect(roles).toContain("player_b");
      expect(roles).toContain("game_master");
      expect(roles).not.toContain("player_a");
    });

    it("should return roles that can request hints", () => {
      const roles = getRolesWithPermission("canRequestHints");
      expect(roles).toContain("player_a");
      expect(roles).not.toContain("player_b");
      expect(roles).not.toContain("game_master");
    });

    it("should return all roles for common permissions", () => {
      const roles = getRolesWithPermission("canSeeOwnLocation");
      expect(roles).toHaveLength(3);
      expect(roles).toContain("player_a");
      expect(roles).toContain("player_b");
      expect(roles).toContain("game_master");
    });
  });

  describe("getAvailableRoles", () => {
    it("should return only player_a for single player", () => {
      const roles = getAvailableRoles(1);
      expect(roles).toEqual(["player_a"]);
    });

    it("should return player_a and player_b for two players", () => {
      const roles = getAvailableRoles(2);
      expect(roles).toEqual(["player_a", "player_b"]);
    });

    it("should return all roles for three or more players", () => {
      const roles = getAvailableRoles(3);
      expect(roles).toEqual(["player_a", "player_b", "game_master"]);
      
      const rolesForFour = getAvailableRoles(4);
      expect(rolesForFour).toEqual(["player_a", "player_b", "game_master"]);
    });
  });

  describe("isRoleValidForGameMode", () => {
    describe("single_player mode", () => {
      it("should only allow player_a", () => {
        expect(isRoleValidForGameMode("player_a", "single_player", "ai")).toBe(true);
        expect(isRoleValidForGameMode("player_b", "single_player", "ai")).toBe(false);
        expect(isRoleValidForGameMode("game_master", "single_player", "ai")).toBe(false);
      });
    });

    describe("two_player mode", () => {
      it("should allow player_a and player_b with AI game master", () => {
        expect(isRoleValidForGameMode("player_a", "two_player", "ai")).toBe(true);
        expect(isRoleValidForGameMode("player_b", "two_player", "ai")).toBe(true);
        expect(isRoleValidForGameMode("game_master", "two_player", "ai")).toBe(false);
      });

      it("should allow player_a and game_master with player game master", () => {
        expect(isRoleValidForGameMode("player_a", "two_player", "player")).toBe(true);
        expect(isRoleValidForGameMode("player_b", "two_player", "player")).toBe(false);
        expect(isRoleValidForGameMode("game_master", "two_player", "player")).toBe(true);
      });
    });

    describe("multi_player mode", () => {
      it("should allow all roles when game_master is player", () => {
        expect(isRoleValidForGameMode("player_a", "multi_player", "player")).toBe(true);
        expect(isRoleValidForGameMode("player_b", "multi_player", "player")).toBe(true);
        expect(isRoleValidForGameMode("game_master", "multi_player", "player")).toBe(true);
      });

      it("should not allow game_master role when game_master is AI", () => {
        expect(isRoleValidForGameMode("player_a", "multi_player", "ai")).toBe(true);
        expect(isRoleValidForGameMode("player_b", "multi_player", "ai")).toBe(true);
        expect(isRoleValidForGameMode("game_master", "multi_player", "ai")).toBe(false);
      });
    });
  });
});

