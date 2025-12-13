/**
 * Audio utility for playing game sounds
 * Supports both web and future native app compatibility
 */

class SoundManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== "undefined" && "AudioContext" in window) {
      this.audioContext = new AudioContext();
    }
  }

  /**
   * Load a sound file
   */
  async loadSound(name: string, url: string): Promise<void> {
    if (!this.audioContext) return;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.sounds.set(name, audioBuffer);
    } catch (error) {
      console.error(`Failed to load sound ${name}:`, error);
    }
  }

  /**
   * Play a sound by name
   */
  async playSound(name: string): Promise<void> {
    if (!this.enabled || !this.audioContext) return;

    try {
      // Resume audio context if suspended (required by some browsers)
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      const audioBuffer = this.sounds.get(name);
      if (!audioBuffer) {
        console.warn(`Sound ${name} not loaded`);
        return;
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start(0);
    } catch (error) {
      console.error(`Failed to play sound ${name}:`, error);
    }
  }

  /**
   * Simple fallback using HTML Audio API
   */
  async playSimple(url: string): Promise<void> {
    if (!this.enabled) return;

    try {
      const audio = new Audio(url);
      await audio.play();
    } catch (error) {
      console.error(`Failed to play sound from ${url}:`, error);
    }
  }

  /**
   * Enable or disable sound effects
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if sounds are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get user preference from localStorage or user metadata
   */
  loadPreference(): void {
    try {
      const pref = localStorage.getItem("sound_effects_enabled");
      if (pref !== null) {
        this.enabled = pref === "true";
      }
    } catch (error) {
      console.error("Failed to load sound preference:", error);
    }
  }

  /**
   * Save user preference to localStorage
   */
  savePreference(enabled: boolean): void {
    try {
      this.enabled = enabled;
      localStorage.setItem("sound_effects_enabled", enabled.toString());
    } catch (error) {
      console.error("Failed to save sound preference:", error);
    }
  }
}

// Singleton instance
export const soundManager = new SoundManager();

// Load preferences on initialization
if (typeof window !== "undefined") {
  soundManager.loadPreference();
}

/**
 * Play waypoint discovery sound
 */
export async function playWaypointFound(): Promise<void> {
  await soundManager.playSimple("/sounds/waypoint-found.mp3");
}

/**
 * Play goal discovery sound
 */
export async function playGoalFound(): Promise<void> {
  await soundManager.playSimple("/sounds/goal-found.mp3");
}

/**
 * Trigger haptic feedback (mobile vibration)
 */
export function triggerHaptic(pattern: number | number[] = 200): void {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.error("Haptic feedback failed:", error);
    }
  }
}
