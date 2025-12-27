import React from "react";
import { render, waitFor } from "@testing-library/react";
import { SoundManagerProvider } from "@/app/components/SoundManagerProvider";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { soundManager } from "@/lib/audio/sounds";

// Mock dependencies
jest.mock("@/hooks/useUserPreferences");
jest.mock("@/lib/audio/sounds", () => ({
  soundManager: {
    loadPreferenceFromAuth: jest.fn(),
    setEnabled: jest.fn(),
  },
}));

const mockUseUserPreferences = useUserPreferences as jest.MockedFunction<
  typeof useUserPreferences
>;

describe("SoundManagerProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render children", () => {
    mockUseUserPreferences.mockReturnValue({
      preferences: {
        distance_unit: "km",
        map_tile_layer: "topo",
        sound_effects_enabled: true,
        notifications_enabled: true,
      },
      loading: false,
    });

    const { getByText } = render(
      <SoundManagerProvider>
        <div>Test Child</div>
      </SoundManagerProvider>
    );

    expect(getByText("Test Child")).toBeInTheDocument();
  });

  it("should load preferences from auth when not loading", async () => {
    mockUseUserPreferences.mockReturnValue({
      preferences: {
        distance_unit: "km",
        map_tile_layer: "topo",
        sound_effects_enabled: true,
        notifications_enabled: true,
      },
      loading: false,
    });

    render(
      <SoundManagerProvider>
        <div>Test</div>
      </SoundManagerProvider>
    );

    await waitFor(() => {
      expect(soundManager.loadPreferenceFromAuth).toHaveBeenCalled();
    });
  });

  it("should not load preferences when still loading", () => {
    mockUseUserPreferences.mockReturnValue({
      preferences: {
        distance_unit: "km",
        map_tile_layer: "topo",
        sound_effects_enabled: true,
        notifications_enabled: true,
      },
      loading: true,
    });

    render(
      <SoundManagerProvider>
        <div>Test</div>
      </SoundManagerProvider>
    );

    expect(soundManager.loadPreferenceFromAuth).not.toHaveBeenCalled();
  });

  it("should set sound enabled state based on preferences", async () => {
    mockUseUserPreferences.mockReturnValue({
      preferences: {
        distance_unit: "km",
        map_tile_layer: "topo",
        sound_effects_enabled: false,
        notifications_enabled: true,
      },
      loading: false,
    });

    render(
      <SoundManagerProvider>
        <div>Test</div>
      </SoundManagerProvider>
    );

    await waitFor(() => {
      expect(soundManager.setEnabled).toHaveBeenCalledWith(false);
    });
  });

  it("should update sound manager when preferences change", async () => {
    const { rerender } = render(
      <SoundManagerProvider>
        <div>Test</div>
      </SoundManagerProvider>
    );

    // Initial state
    mockUseUserPreferences.mockReturnValue({
      preferences: {
        distance_unit: "km",
        map_tile_layer: "topo",
        sound_effects_enabled: true,
        notifications_enabled: true,
      },
      loading: false,
    });

    rerender(
      <SoundManagerProvider>
        <div>Test</div>
      </SoundManagerProvider>
    );

    await waitFor(() => {
      expect(soundManager.setEnabled).toHaveBeenCalledWith(true);
    });

    // Change preferences
    mockUseUserPreferences.mockReturnValue({
      preferences: {
        distance_unit: "km",
        map_tile_layer: "topo",
        sound_effects_enabled: false,
        notifications_enabled: true,
      },
      loading: false,
    });

    rerender(
      <SoundManagerProvider>
        <div>Test</div>
      </SoundManagerProvider>
    );

    await waitFor(() => {
      expect(soundManager.setEnabled).toHaveBeenCalledWith(false);
    });
  });

  it("should handle multiple children", () => {
    mockUseUserPreferences.mockReturnValue({
      preferences: {
        distance_unit: "km",
        map_tile_layer: "topo",
        sound_effects_enabled: true,
        notifications_enabled: true,
      },
      loading: false,
    });

    const { getByText } = render(
      <SoundManagerProvider>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </SoundManagerProvider>
    );

    expect(getByText("Child 1")).toBeInTheDocument();
    expect(getByText("Child 2")).toBeInTheDocument();
    expect(getByText("Child 3")).toBeInTheDocument();
  });
});

