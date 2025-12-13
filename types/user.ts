/**
 * User-related type definitions
 */

/**
 * User preferences stored in Supabase Auth user_metadata
 * These are stored as arbitrary JSON in the auth.users table
 */
export interface UserPreferences {
  distance_unit: "km" | "miles";
  map_tile_layer: "topo" | "street" | "satellite";
  sound_effects_enabled: boolean;
  notifications_enabled: boolean;
}

/**
 * Complete user metadata structure
 * This is what's stored in auth.users.user_metadata
 */
export interface UserMetadata {
  display_name?: string;
  preferences?: Partial<UserPreferences>;
}

/**
 * Default user preferences
 */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  distance_unit: "km",
  map_tile_layer: "topo",
  sound_effects_enabled: true,
  notifications_enabled: true,
};

/**
 * Type guard to validate user preferences
 */
export function isValidUserPreferences(
  obj: unknown
): obj is Partial<UserPreferences> {
  if (typeof obj !== "object" || obj === null) return false;

  const prefs = obj as Record<string, unknown>;

  // Check distance_unit if present
  if (
    "distance_unit" in prefs &&
    prefs.distance_unit !== "km" &&
    prefs.distance_unit !== "miles"
  ) {
    return false;
  }

  // Check map_tile_layer if present
  if (
    "map_tile_layer" in prefs &&
    prefs.map_tile_layer !== "topo" &&
    prefs.map_tile_layer !== "street" &&
    prefs.map_tile_layer !== "satellite"
  ) {
    return false;
  }

  // Check boolean fields if present
  if (
    "sound_effects_enabled" in prefs &&
    typeof prefs.sound_effects_enabled !== "boolean"
  ) {
    return false;
  }

  if (
    "notifications_enabled" in prefs &&
    typeof prefs.notifications_enabled !== "boolean"
  ) {
    return false;
  }

  return true;
}

/**
 * Safely parse user preferences from user_metadata
 * Returns default preferences merged with stored preferences
 */
export function parseUserPreferences(
  metadata?: UserMetadata | null
): UserPreferences {
  if (!metadata?.preferences) {
    return DEFAULT_USER_PREFERENCES;
  }

  // Validate and merge with defaults
  if (!isValidUserPreferences(metadata.preferences)) {
    console.warn("Invalid user preferences in metadata, using defaults");
    return DEFAULT_USER_PREFERENCES;
  }

  return {
    ...DEFAULT_USER_PREFERENCES,
    ...metadata.preferences,
  };
}

/**
 * Profile data combining preferences and display name
 */
export interface UserProfile {
  display_name?: string;
  preferences: UserPreferences;
}

/**
 * Parse complete user profile from metadata
 */
export function parseUserProfile(metadata?: UserMetadata | null): UserProfile {
  return {
    display_name: metadata?.display_name,
    preferences: parseUserPreferences(metadata),
  };
}
