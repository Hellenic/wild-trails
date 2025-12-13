/**
 * Tests for the sound effects and haptic feedback system
 * @jest-environment jsdom
 */

import { soundManager, triggerHaptic } from "@/lib/audio/sounds";

describe("Sound Manager", () => {
  let getItemSpy: jest.SpyInstance;
  let setItemSpy: jest.SpyInstance;

  beforeAll(() => {
    // Spy on the real localStorage methods provided by jsdom
    getItemSpy = jest.spyOn(Storage.prototype, "getItem");
    setItemSpy = jest.spyOn(Storage.prototype, "setItem");
  });

  afterAll(() => {
    // Restore original methods
    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    getItemSpy.mockReturnValue(null);
  });

  describe("User Preferences", () => {
    it("should load preference from localStorage", () => {
      getItemSpy.mockReturnValue("false");
      soundManager.loadPreference();
      expect(getItemSpy).toHaveBeenCalledWith("sound_effects_enabled");
      expect(soundManager.isEnabled()).toBe(false);
    });

    it("should save preference to localStorage", () => {
      soundManager.savePreference(true);
      expect(setItemSpy).toHaveBeenCalledWith(
        "sound_effects_enabled",
        "true"
      );
      expect(soundManager.isEnabled()).toBe(true);
    });

    it("should default to enabled if no preference stored", () => {
      getItemSpy.mockReturnValue(null);
      soundManager.loadPreference();
      expect(soundManager.isEnabled()).toBe(true);
    });
  });

  describe("Enable/Disable", () => {
    it("should enable sound effects", () => {
      soundManager.setEnabled(true);
      expect(soundManager.isEnabled()).toBe(true);
    });

    it("should disable sound effects", () => {
      soundManager.setEnabled(false);
      expect(soundManager.isEnabled()).toBe(false);
    });
  });
});

describe("Haptic Feedback", () => {
  let mockVibrate: jest.Mock;
  const originalWindow = global.window;

  beforeAll(() => {
    // Define window on global (Node environment doesn't have it)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).window = {};
  });

  afterAll(() => {
    // Restore original window state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).window = originalWindow;
  });

  beforeEach(() => {
    mockVibrate = jest.fn();
    
    // Mock navigator.vibrate
    Object.defineProperty(navigator, "vibrate", {
      writable: true,
      configurable: true,
      value: mockVibrate,
    });
  });

  it("should trigger vibration with single pattern", () => {
    triggerHaptic(200);
    expect(mockVibrate).toHaveBeenCalledWith(200);
  });

  it("should trigger vibration with array pattern", () => {
    const pattern = [100, 50, 100];
    triggerHaptic(pattern);
    expect(mockVibrate).toHaveBeenCalledWith(pattern);
  });

  it("should handle missing vibrate API gracefully", () => {
    // Remove vibrate API
    Object.defineProperty(navigator, "vibrate", {
      value: undefined,
      configurable: true,
    });
    
    expect(() => triggerHaptic(200)).not.toThrow();
  });
});
