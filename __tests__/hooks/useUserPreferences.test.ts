import { renderHook, waitFor } from "@testing-library/react";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_USER_PREFERENCES } from "@/types/user";

// Mock Supabase client
jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(),
}));

describe("useUserPreferences", () => {
  let mockSupabase: {
    auth: {
      getUser: jest.Mock;
      onAuthStateChange: jest.Mock;
    };
  };
  let mockAuthStateChange: jest.Mock;

  beforeEach(() => {
    mockAuthStateChange = jest.fn();
    
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
        onAuthStateChange: jest.fn(() => ({
          data: {
            subscription: {
              unsubscribe: jest.fn(),
            },
          },
        })),
      },
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return default preferences when user has no metadata", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
    });

    const { result } = renderHook(() => useUserPreferences());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.preferences).toEqual(DEFAULT_USER_PREFERENCES);
  });

  it("should load user preferences from metadata", async () => {
    const customPreferences = {
      distance_unit: "miles" as const,
      map_tile_layer: "street" as const,
      sound_effects_enabled: false,
      notifications_enabled: false,
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          user_metadata: {
            preferences: customPreferences,
          },
        },
      },
    });

    const { result } = renderHook(() => useUserPreferences());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.preferences).toEqual(customPreferences);
  });

  it("should merge partial preferences with defaults", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          user_metadata: {
            preferences: {
              distance_unit: "miles" as const,
              // Other preferences should use defaults
            },
          },
        },
      },
    });

    const { result } = renderHook(() => useUserPreferences());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.preferences).toEqual({
      distance_unit: "miles",
      map_tile_layer: "topo",
      sound_effects_enabled: true,
      notifications_enabled: true,
    });
  });

  it("should subscribe to auth state changes", () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
    });

    renderHook(() => useUserPreferences());

    expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();
  });

  it("should handle errors gracefully", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    
    mockSupabase.auth.getUser.mockRejectedValue(new Error("Auth error"));

    const { result } = renderHook(() => useUserPreferences());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.preferences).toEqual(DEFAULT_USER_PREFERENCES);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to load user preferences:",
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it("should set loading to true initially", () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
    });

    const { result } = renderHook(() => useUserPreferences());

    expect(result.current.loading).toBe(true);
  });
});

