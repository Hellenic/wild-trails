/**
 * Difficulty presets for Wild Trails games
 * Single source of truth used by:
 * - Form mode (GameSettings.tsx)
 * - AI chat mode (prompts.ts, tools.ts)
 * - Background process (osm.strategy.ts)
 */

export type DifficultyLevel = "easy" | "medium" | "hard";

export interface DifficultyPreset {
  /** Default duration in hours */
  duration: number;
  /** Default max radius in kilometers */
  maxRadius: number;
  /** Human-readable duration range for hints */
  durationRange: string;
  /** Human-readable distance range for hints */
  distanceRange: string;
  /** Short description of the difficulty */
  description: string;
  /** Icon name for UI */
  icon: string;
}

export const DIFFICULTY_PRESETS: Record<DifficultyLevel, DifficultyPreset> = {
  easy: {
    duration: 2,
    maxRadius: 1,
    durationRange: "1-2 hours",
    distanceRange: "up to 1 km",
    description: "Relaxed walk",
    icon: "hiking",
  },
  medium: {
    duration: 4,
    maxRadius: 3,
    durationRange: "2-4 hours",
    distanceRange: "1-3 km",
    description: "Trail adventure",
    icon: "landscape",
  },
  hard: {
    duration: 5,
    maxRadius: 5,
    durationRange: "4+ hours",
    distanceRange: "3-5 km",
    description: "Expedition",
    icon: "terrain",
  },
};

/**
 * Generate difficulty description for AI prompts
 */
export function getDifficultyPromptText(): string {
  const entries = Object.entries(DIFFICULTY_PRESETS) as [DifficultyLevel, DifficultyPreset][];
  
  return entries.map(([level, preset]) => {
    const name = level.charAt(0).toUpperCase() + level.slice(1);
    return `**${name}** (${preset.description}):
- Radius: ${preset.distanceRange}
- Duration: ${preset.durationRange}`;
  }).join("\n\n");
}

/**
 * Get default values for a difficulty level
 */
export function getDifficultyDefaults(difficulty: DifficultyLevel) {
  const preset = DIFFICULTY_PRESETS[difficulty];
  return {
    duration: preset.duration,
    maxRadius: preset.maxRadius,
  };
}

