import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        forest: {
          deep: "var(--deep-forest)",
          pine: "var(--pine-green)",
          moss: "var(--moss-green)",
          bark: "var(--bark-brown)",
          wood: "var(--warm-wood)",
          mist: "var(--forest-mist)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)"],
        serif: ["var(--font-bitter)"],
      },
    },
  },
  plugins: [],
} satisfies Config;
