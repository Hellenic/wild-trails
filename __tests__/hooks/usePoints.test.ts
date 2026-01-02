import { renderHook, act, waitFor } from "@testing-library/react";
import { usePoints } from "@/hooks/usePoints";
import { createClient } from "@/lib/supabase/client";

// Mock Supabase client
jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(),
}));

describe("usePoints", () => {
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
  };

  const mockPoints = [
    {
      id: "point-1",
      game_id: "game-123",
      latitude: 60.1,
      longitude: 24.5,
      sequence_number: 1,
      type: "start",
      status: "unvisited",
      hint: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "point-2",
      game_id: "game-123",
      latitude: 60.2,
      longitude: 24.6,
      sequence_number: 2,
      type: "clue",
      status: "unvisited",
      hint: "Look north",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
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
      order: jest.fn().mockResolvedValue({ data: mockPoints, error: null }),
    };

    mockSupabase = {
      from: jest.fn().mockReturnValue(mockQuery),
      channel: jest.fn().mockReturnValue(mockChannel),
      removeChannel: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    // Mock document.visibilityState
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should load points on mount", async () => {
    const { result } = renderHook(() => usePoints("game-123"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.points).toEqual(mockPoints);
    expect(mockSupabase.from).toHaveBeenCalledWith("game_points");
    expect(mockQuery.eq).toHaveBeenCalledWith("game_id", "game-123");
  });

  it("should subscribe to realtime updates", async () => {
    renderHook(() => usePoints("game-123"));

    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalledWith("game_points_game-123");
    });

    expect(mockChannel.on).toHaveBeenCalledWith(
      "postgres_changes",
      expect.objectContaining({
        event: "UPDATE",
        schema: "public",
        table: "game_points",
        filter: "game_id=eq.game-123",
      }),
      expect.any(Function)
    );
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it("should re-fetch points when visibility changes to visible", async () => {
    const { result } = renderHook(() => usePoints("game-123"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear the initial call count
    mockQuery.order.mockClear();

    // Simulate visibility change
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });

    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    await waitFor(() => {
      expect(mockQuery.order).toHaveBeenCalled();
    });
  });

  it("should not re-fetch when visibility changes to hidden", async () => {
    const { result } = renderHook(() => usePoints("game-123"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear the initial call count
    mockQuery.order.mockClear();

    // Simulate visibility change to hidden
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });

    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    // Should not have refetched
    expect(mockQuery.order).not.toHaveBeenCalled();
  });

  it("should expose a refetch function", async () => {
    const { result } = renderHook(() => usePoints("game-123"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe("function");

    // Clear and call refetch
    mockQuery.order.mockClear();
    
    await act(async () => {
      await result.current.refetch();
    });

    expect(mockQuery.order).toHaveBeenCalled();
  });

  it("should handle errors gracefully", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    
    mockQuery.order.mockResolvedValueOnce({
      data: null,
      error: { message: "Database error" },
    });

    const { result } = renderHook(() => usePoints("game-123"));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error loading points:",
        expect.objectContaining({ message: "Database error" })
      );
    });

    expect(result.current.points).toEqual([]);

    consoleErrorSpy.mockRestore();
  });

  it("should update point when realtime update is received", async () => {
    const { result } = renderHook(() => usePoints("game-123"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Get the callback passed to .on()
    const onCallback = mockChannel.on.mock.calls[0][2];

    // Simulate a realtime update
    const updatedPoint = {
      ...mockPoints[1],
      status: "visited",
    };

    act(() => {
      onCallback({ new: updatedPoint });
    });

    expect(result.current.points[1].status).toBe("visited");
  });

  it("should cleanup channel on unmount", async () => {
    const { unmount } = renderHook(() => usePoints("game-123"));

    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalled();
    });

    unmount();

    expect(mockSupabase.removeChannel).toHaveBeenCalled();
  });

  it("should not load points if gameId is empty", () => {
    const { result } = renderHook(() => usePoints(""));

    expect(result.current.loading).toBe(true);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });
});

