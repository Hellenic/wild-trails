import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // New primary brand color
        primary: {
          DEFAULT: "#13ec13",
          dark: "#0fb80f",
          light: "#4bff4b",
        },
        // Background colors
        background: {
          light: "#f6f8f6",
          dark: "#102210",
        },
        // Surface colors
        surface: {
          light: "#ffffff",
          dark: "#1a2c1a",
          "dark-elevated": "#283928",
        },
        // Legacy forest colors (for gradual migration)
        forest: {
          deep: "#1a2f25",
          pine: "#2c4a3c",
          moss: "#4a6741",
          bark: "#8b4513",
          wood: "#deb887",
          mist: "#e8eee7",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        sans: ["var(--font-body)", "sans-serif"],
        serif: ["var(--font-display)", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px",
      },
      backdropBlur: {
        glass: "12px",
      },
    },
  },
  plugins: [],
} satisfies Config;
