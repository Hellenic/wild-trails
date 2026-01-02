import { renderHook, act } from "@testing-library/react";
import { useProximityEvents } from "@/hooks/useProximityEvents";
import { createClient } from "@/lib/supabase/client";

// Mock Supabase client
jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(),
}));

describe("useProximityEvents", () => {
  let mockSupabase: {
    channel: jest.Mock;
    removeChannel: jest.Mock;
  };
  let mockChannel: {
    on: jest.Mock;
    subscribe: jest.Mock;
  };

  const mockCluePoint = {
    id: "clue-1",
    game_id: "game-123",
    latitude: 60.2,
    longitude: 24.6,
    sequence_number: 2,
    type: "clue",
    status: "visited",
    hint: "Look north",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const mockEndPoint = {
    id: "end-1",
    game_id: "game-123",
    latitude: 60.3,
    longitude: 24.7,
    sequence_number: 5,
    type: "end",
    status: "visited",
    hint: "Congratulations!",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    };

    mockSupabase = {
      channel: jest.fn().mockReturnValue(mockChannel),
      removeChannel: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should use a unique channel name to avoid conflicts with usePoints", () => {
    renderHook(() =>
      useProximityEvents("game-123", {
        onClueDiscovered: jest.fn(),
        onGoalFound: jest.fn(),
      })
    );

    // Should use "game_points_events_" prefix, NOT "game_points_"
    expect(mockSupabase.channel).toHaveBeenCalledWith("game_points_events_game-123");
  });

  it("should subscribe to UPDATE events on game_points table", () => {
    renderHook(() =>
      useProximityEvents("game-123", {
        onClueDiscovered: jest.fn(),
      })
    );

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
  });

  it("should call onClueDiscovered when a clue point is marked as visited", () => {
    const onClueDiscovered = jest.fn();
    const onGoalFound = jest.fn();

    renderHook(() =>
      useProximityEvents("game-123", {
        onClueDiscovered,
        onGoalFound,
      })
    );

    // Get the callback passed to .on()
    const onCallback = mockChannel.on.mock.calls[0][2];

    // Simulate a realtime update for a clue point
    act(() => {
      onCallback({ new: mockCluePoint });
    });

    expect(onClueDiscovered).toHaveBeenCalledWith(mockCluePoint);
    expect(onGoalFound).not.toHaveBeenCalled();
  });

  it("should call onGoalFound when an end point is marked as visited", () => {
    const onClueDiscovered = jest.fn();
    const onGoalFound = jest.fn();

    renderHook(() =>
      useProximityEvents("game-123", {
        onClueDiscovered,
        onGoalFound,
      })
    );

    // Get the callback passed to .on()
    const onCallback = mockChannel.on.mock.calls[0][2];

    // Simulate a realtime update for the end point
    act(() => {
      onCallback({ new: mockEndPoint });
    });

    expect(onGoalFound).toHaveBeenCalledWith(mockEndPoint);
    expect(onClueDiscovered).not.toHaveBeenCalled();
  });

  it("should call onPointReached for any visited point if provided", () => {
    const onPointReached = jest.fn();
    const onClueDiscovered = jest.fn();

    renderHook(() =>
      useProximityEvents("game-123", {
        onPointReached,
        onClueDiscovered,
      })
    );

    const onCallback = mockChannel.on.mock.calls[0][2];

    act(() => {
      onCallback({ new: mockCluePoint });
    });

    expect(onPointReached).toHaveBeenCalledWith(mockCluePoint);
    expect(onClueDiscovered).toHaveBeenCalledWith(mockCluePoint);
  });

  it("should not trigger callbacks for unvisited points", () => {
    const onClueDiscovered = jest.fn();
    const onGoalFound = jest.fn();

    renderHook(() =>
      useProximityEvents("game-123", {
        onClueDiscovered,
        onGoalFound,
      })
    );

    const onCallback = mockChannel.on.mock.calls[0][2];

    // Simulate an update where status is NOT visited
    act(() => {
      onCallback({
        new: { ...mockCluePoint, status: "unvisited" },
      });
    });

    expect(onClueDiscovered).not.toHaveBeenCalled();
    expect(onGoalFound).not.toHaveBeenCalled();
  });

  it("should not subscribe if gameId is null", () => {
    renderHook(() =>
      useProximityEvents(null, {
        onClueDiscovered: jest.fn(),
      })
    );

    expect(mockSupabase.channel).not.toHaveBeenCalled();
  });

  it("should not subscribe if gameId is undefined", () => {
    renderHook(() =>
      useProximityEvents(undefined, {
        onClueDiscovered: jest.fn(),
      })
    );

    expect(mockSupabase.channel).not.toHaveBeenCalled();
  });

  it("should not subscribe if enabled is false", () => {
    renderHook(() =>
      useProximityEvents("game-123", {
        enabled: false,
        onClueDiscovered: jest.fn(),
      })
    );

    expect(mockSupabase.channel).not.toHaveBeenCalled();
  });

  it("should subscribe when enabled is explicitly true", () => {
    renderHook(() =>
      useProximityEvents("game-123", {
        enabled: true,
        onClueDiscovered: jest.fn(),
      })
    );

    expect(mockSupabase.channel).toHaveBeenCalledWith("game_points_events_game-123");
  });

  it("should subscribe when enabled is not provided (defaults to true)", () => {
    renderHook(() =>
      useProximityEvents("game-123", {
        onClueDiscovered: jest.fn(),
      })
    );

    expect(mockSupabase.channel).toHaveBeenCalledWith("game_points_events_game-123");
  });

  it("should cleanup and re-subscribe when enabled changes from false to true", () => {
    const { rerender } = renderHook(
      ({ enabled }) =>
        useProximityEvents("game-123", {
          enabled,
          onClueDiscovered: jest.fn(),
        }),
      { initialProps: { enabled: false } }
    );

    // Should not subscribe initially when disabled
    expect(mockSupabase.channel).not.toHaveBeenCalled();

    // Enable the hook
    rerender({ enabled: true });

    // Should now subscribe
    expect(mockSupabase.channel).toHaveBeenCalledWith("game_points_events_game-123");
  });

  it("should cleanup channel when enabled changes from true to false", () => {
    const { rerender } = renderHook(
      ({ enabled }) =>
        useProximityEvents("game-123", {
          enabled,
          onClueDiscovered: jest.fn(),
        }),
      { initialProps: { enabled: true } }
    );

    // Should subscribe initially
    expect(mockSupabase.channel).toHaveBeenCalledWith("game_points_events_game-123");

    // Disable the hook
    rerender({ enabled: false });

    // Should cleanup the channel
    expect(mockSupabase.removeChannel).toHaveBeenCalled();
  });

  it("should cleanup channel on unmount", () => {
    const { unmount } = renderHook(() =>
      useProximityEvents("game-123", {
        onClueDiscovered: jest.fn(),
      })
    );

    unmount();

    expect(mockSupabase.removeChannel).toHaveBeenCalled();
  });

  it("should handle subscription errors gracefully", () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    mockChannel.subscribe.mockImplementation((callback) => {
      callback("CHANNEL_ERROR", new Error("Connection failed"));
      return mockChannel;
    });

    renderHook(() =>
      useProximityEvents("game-123", {
        onClueDiscovered: jest.fn(),
      })
    );

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});

