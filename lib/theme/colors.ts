/**
 * Theme colors - Single source of truth for role-specific colors
 * Used by both Tailwind config and TypeScript code
 */

export const ROLE_COLORS = {
  // Game Master (purple theme)
  gm: {
    DEFAULT: "#a855f7", // purple-500
    light: "#c084fc",   // purple-400
    dark: "#7e22ce",    // purple-700
    bg: "#3b0764",      // purple-950
    "bg-elevated": "#581c87", // purple-900
    border: "#7c3aed",  // violet-600
  },
  // Player A / Seeker (blue theme)
  seeker: {
    DEFAULT: "#3b82f6", // blue-500
    light: "#60a5fa",   // blue-400
  },
  // Player B / Guide (yellow theme)
  guide: {
    DEFAULT: "#eab308", // yellow-500
    light: "#facc15",   // yellow-400
  },
} as const;

// Type for role color keys
export type RoleColorKey = keyof typeof ROLE_COLORS;

// Helper to get hex color for a role (for non-Tailwind usage like map polylines)
export function getRoleHexColor(role: "gm" | "seeker" | "guide"): string {
  return ROLE_COLORS[role].DEFAULT;
}

