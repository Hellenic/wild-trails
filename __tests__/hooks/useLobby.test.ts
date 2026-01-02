import { renderHook, act, waitFor } from "@testing-library/react";
import { useLobby } from "@/hooks/useLobby";
import { createClient } from "@/lib/supabase/client";
import { playerAPI } from "@/lib/api/client";

// Mock Supabase client
jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(),
}));

// Mock playerAPI
jest.mock("@/lib/api/client", () => ({
  playerAPI: {
    setReady: jest.fn(),
    kick: jest.fn(),
  },
}));

describe("useLobby", () => {
  let mockSupabase: {
    from: jest.Mock;
    channel: jest.Mock;
    removeChannel: jest.Mock;
  };
  let mockChannel: {
    on: jest.Mock;
    subscribe: jest.Mock;
  };
  let mockQuery: {
    select: jest.Mock;
    eq: jest.Mock;
    order: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  const mockPlayers = [
    {
      id: "player-1",
      game_id: "game-123",
      user_id: "user-1",
      role: "player_a",
      status: "waiting",
      created_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "player-2",
      game_id: "game-123",
      user_id: "user-2",
      role: "player_b",
      status: "waiting",
      created_at: "2024-01-01T00:01:00Z",
    },
  ];

  beforeEach(() => {
    mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    };

    mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockPlayers, error: null }),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };

    mockSupabase = {
      from: jest.fn().mockReturnValue(mockQuery),
      channel: jest.fn().mockReturnValue(mockChannel),
      removeChannel: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    // Reset playerAPI mocks
    (playerAPI.setReady as jest.Mock).mockReset().mockResolvedValue({ id: "player-1", status: "ready" });
    (playerAPI.kick as jest.Mock).mockReset().mockResolvedValue({ success: true, message: "Player kicked" });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("initial state", () => {
    it("should start with loading state", async () => {
      const { result } = renderHook(() => useLobby("game-123"));

      expect(result.current.loading).toBe(true);
      expect(result.current.players).toEqual([]);
    });

    it("should load players on mount", async () => {
      const { result } = renderHook(() => useLobby("game-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.players).toEqual(mockPlayers);
      expect(mockSupabase.from).toHaveBeenCalledWith("players");
      expect(mockQuery.eq).toHaveBeenCalledWith("game_id", "game-123");
    });
  });

  describe("isAllReady", () => {
    it("should be false when not all players are ready", async () => {
      const { result } = renderHook(() => useLobby("game-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAllReady).toBe(false);
    });

    it("should be true when all players are ready", async () => {
      const readyPlayers = mockPlayers.map((p) => ({ ...p, status: "ready" }));
      mockQuery.order.mockResolvedValueOnce({ data: readyPlayers, error: null });

      const { result } = renderHook(() => useLobby("game-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAllReady).toBe(true);
    });

    it("should be false when there are no players", async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [], error: null });

      const { result } = renderHook(() => useLobby("game-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAllReady).toBe(false);
    });
  });

  describe("realtime subscription", () => {
    it("should subscribe to player changes", async () => {
      renderHook(() => useLobby("game-123"));

      await waitFor(() => {
        expect(mockSupabase.channel).toHaveBeenCalledWith("lobby:game-123");
      });

      expect(mockChannel.on).toHaveBeenCalledWith(
        "postgres_changes",
        expect.objectContaining({
          event: "*",
          schema: "public",
          table: "players",
          filter: "game_id=eq.game-123",
        }),
        expect.any(Function)
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it("should add new player on INSERT event", async () => {
      const { result } = renderHook(() => useLobby("game-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const onCallback = mockChannel.on.mock.calls[0][2];
      const newPlayer = {
        id: "player-3",
        game_id: "game-123",
        user_id: "user-3",
        role: "game_master",
        status: "waiting",
        created_at: "2024-01-01T00:02:00Z",
      };

      act(() => {
        onCallback({ eventType: "INSERT", new: newPlayer });
      });

      expect(result.current.players).toHaveLength(3);
      expect(result.current.players[2]).toEqual(newPlayer);
    });

    it("should update player on UPDATE event", async () => {
      const { result } = renderHook(() => useLobby("game-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const onCallback = mockChannel.on.mock.calls[0][2];
      const updatedPlayer = { ...mockPlayers[0], status: "ready" };

      act(() => {
        onCallback({ eventType: "UPDATE", new: updatedPlayer });
      });

      expect(result.current.players[0].status).toBe("ready");
    });

    it("should remove player on DELETE event", async () => {
      const { result } = renderHook(() => useLobby("game-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const onCallback = mockChannel.on.mock.calls[0][2];

      act(() => {
        onCallback({ eventType: "DELETE", old: { id: "player-1" } });
      });

      expect(result.current.players).toHaveLength(1);
      expect(result.current.players[0].id).toBe("player-2");
    });

    it("should not add duplicate players on INSERT", async () => {
      const { result } = renderHook(() => useLobby("game-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const onCallback = mockChannel.on.mock.calls[0][2];

      act(() => {
        onCallback({ eventType: "INSERT", new: mockPlayers[0] });
      });

      expect(result.current.players).toHaveLength(2);
    });

    it("should cleanup subscription on unmount", async () => {
      const { unmount } = renderHook(() => useLobby("game-123"));

      await waitFor(() => {
        expect(mockSupabase.channel).toHaveBeenCalled();
      });

      unmount();

      expect(mockSupabase.removeChannel).toHaveBeenCalled();
    });
  });

  describe("setPlayerReady", () => {
    it("should update player status to ready via API", async () => {
      const { result } = renderHook(() => useLobby("game-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.setPlayerReady("player-1", true);
      });

      expect(playerAPI.setReady).toHaveBeenCalledWith("game-123", "player-1", true);
    });

    it("should update player status to waiting via API", async () => {
      const { result } = renderHook(() => useLobby("game-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.setPlayerReady("player-1", false);
      });

      expect(playerAPI.setReady).toHaveBeenCalledWith("game-123", "player-1", false);
    });

    it("should throw error on API failure", async () => {
      (playerAPI.setReady as jest.Mock).mockRejectedValueOnce(new Error("API Error"));

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const { result } = renderHook(() => useLobby("game-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.setPlayerReady("player-1", true);
        })
      ).rejects.toThrow("API Error");

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe("kickPlayer", () => {
    it("should kick player via API", async () => {
      const { result } = renderHook(() => useLobby("game-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.kickPlayer("player-2");
      });

      expect(playerAPI.kick).toHaveBeenCalledWith("game-123", "player-2");
    });

    it("should throw error on API failure", async () => {
      (playerAPI.kick as jest.Mock).mockRejectedValueOnce(new Error("API Error"));

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const { result } = renderHook(() => useLobby("game-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.kickPlayer("player-2");
        })
      ).rejects.toThrow("API Error");

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });


  describe("error handling", () => {
    it("should set error state on fetch failure", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      mockQuery.order.mockResolvedValueOnce({
        data: null,
        error: { message: "Database error" },
      });

      const { result } = renderHook(() => useLobby("game-123"));

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to load players");
      });

      expect(result.current.players).toEqual([]);
      consoleErrorSpy.mockRestore();
    });
  });
});

