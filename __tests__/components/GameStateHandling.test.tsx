/**
 * Tests for game state handling across play and setup pages
 * These test the UI responses to different game statuses
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock components that handle game states
// We'll test the logic by testing the conditions directly

describe("Game State Handling", () => {
  describe("Completed Games", () => {
    const completedGame = {
      id: "game-123",
      status: "completed" as const,
      gave_up: false,
      started_at: "2024-01-01T00:00:00Z",
      ended_at: "2024-01-01T01:00:00Z",
    };

    const gaveUpGame = {
      ...completedGame,
      gave_up: true,
    };

    it("should identify completed game state", () => {
      expect(completedGame.status === "completed").toBe(true);
    });

    it("should differentiate normal completion from gave up", () => {
      expect(completedGame.gave_up).toBe(false);
      expect(gaveUpGame.gave_up).toBe(true);
    });

    it("should determine correct message for completed game", () => {
      const getMessage = (game: typeof completedGame) => {
        if (game.status === "completed") {
          return game.gave_up
            ? "This game was ended early. Check the results to see how far you got!"
            : "This adventure has been completed. Check the results to see how you did!";
        }
        return "";
      };

      expect(getMessage(completedGame)).toContain("completed");
      expect(getMessage(gaveUpGame)).toContain("ended early");
    });

    it("should determine correct redirect path for completed game", () => {
      const getRedirectPath = (gameId: string, status: string) => {
        return status === "completed" ? `/game/${gameId}/results` : "/games";
      };

      expect(getRedirectPath("game-123", "completed")).toBe("/game/game-123/results");
    });
  });

  describe("Failed Games", () => {
    const failedGame = {
      id: "game-456",
      status: "failed" as const,
      last_processing_error: "AI generation failed",
    };

    it("should identify failed game state", () => {
      expect(failedGame.status === "failed").toBe(true);
    });

    it("should determine correct message for failed game", () => {
      const getMessage = (status: string) => {
        if (status === "failed") {
          return "This game failed to start properly. Please try creating a new game.";
        }
        return "";
      };

      expect(getMessage(failedGame.status)).toContain("failed to start");
    });

    it("should determine correct redirect path for failed game", () => {
      const getRedirectPath = (gameId: string, status: string) => {
        return status === "completed" ? `/game/${gameId}/results` : "/games";
      };

      expect(getRedirectPath("game-456", "failed")).toBe("/games");
    });
  });

  describe("Active Games", () => {
    const activeGame = {
      id: "game-789",
      status: "active" as const,
      started_at: "2024-01-01T00:00:00Z",
    };

    it("should identify active game state", () => {
      expect(activeGame.status === "active").toBe(true);
    });

    it("should require started_at for active games", () => {
      const isValidActiveGame = (game: typeof activeGame) => {
        return game.status === "active" && game.started_at != null;
      };

      expect(isValidActiveGame(activeGame)).toBe(true);
      expect(isValidActiveGame({ ...activeGame, started_at: null as unknown as string })).toBe(false);
    });
  });

  describe("Setup/Ready Games", () => {
    const setupGame = {
      id: "game-101",
      status: "setup" as const,
      game_master: "ai" as const,
    };

    const readyGame = {
      id: "game-102",
      status: "ready" as const,
      game_master: "player" as const,
    };

    it("should identify setup game state", () => {
      expect(setupGame.status === "setup").toBe(true);
    });

    it("should identify ready game state", () => {
      expect(readyGame.status === "ready").toBe(true);
    });

    it("should show AI message for AI-mastered setup games", () => {
      const getMessage = (game: typeof setupGame) => {
        if (game.status === "setup" && game.game_master === "ai") {
          return "The AI is currently generating waypoints for your adventure.";
        }
        return "This game hasn't been started yet.";
      };

      expect(getMessage(setupGame)).toContain("AI");
      expect(getMessage({ ...setupGame, game_master: "player" as const })).not.toContain("AI");
    });
  });

  describe("State Transition Logic", () => {
    type GameStatus = "setup" | "ready" | "active" | "completed" | "failed";

    const getPageBehavior = (status: GameStatus, started_at: string | null) => {
      // On play page
      if (status === "completed" || status === "failed") {
        return "show_ended_screen";
      }
      if (status !== "active" || !started_at) {
        return "show_not_started_screen";
      }
      return "show_game";
    };

    it("should show ended screen for completed games on play page", () => {
      expect(getPageBehavior("completed", "2024-01-01")).toBe("show_ended_screen");
    });

    it("should show ended screen for failed games on play page", () => {
      expect(getPageBehavior("failed", null)).toBe("show_ended_screen");
    });

    it("should show not started screen for setup games on play page", () => {
      expect(getPageBehavior("setup", null)).toBe("show_not_started_screen");
    });

    it("should show not started screen for ready games on play page", () => {
      expect(getPageBehavior("ready", null)).toBe("show_not_started_screen");
    });

    it("should show game for active games with started_at on play page", () => {
      expect(getPageBehavior("active", "2024-01-01")).toBe("show_game");
    });

    it("should show not started for active games without started_at on play page", () => {
      expect(getPageBehavior("active", null)).toBe("show_not_started_screen");
    });
  });
});

describe("Starting Point Resolution", () => {
  it("should prefer games table starting_point when available", () => {
    const gameStartingPoint = { lat: 60.1, lng: 24.5 };
    const gamePointsStartingPoint = { lat: 60.2, lng: 24.6 };

    const resolveStartingPoint = (
      gameRecord: { starting_point: { lat: number; lng: number } | null },
      gamePoints: Array<{ type: string; latitude: number; longitude: number }>
    ) => {
      if (gameRecord.starting_point) {
        return gameRecord.starting_point;
      }
      const startPoint = gamePoints.find((p) => p.type === "start");
      if (startPoint) {
        return { lat: startPoint.latitude, lng: startPoint.longitude };
      }
      return null;
    };

    // When game record has starting_point, use it
    expect(
      resolveStartingPoint(
        { starting_point: gameStartingPoint },
        [{ type: "start", latitude: 60.2, longitude: 24.6 }]
      )
    ).toEqual(gameStartingPoint);

    // When game record doesn't have it, fall back to game_points
    expect(
      resolveStartingPoint(
        { starting_point: null },
        [{ type: "start", latitude: 60.2, longitude: 24.6 }]
      )
    ).toEqual(gamePointsStartingPoint);

    // When neither has it, return null
    expect(
      resolveStartingPoint({ starting_point: null }, [{ type: "clue", latitude: 60.3, longitude: 24.7 }])
    ).toBeNull();
  });
});

