// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  testEnvironment: "jsdom", // Default to jsdom for UI components
  silent: true, // Suppress console output during tests
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testPathIgnorePatterns: ["<rootDir>/e2e/"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  collectCoverageFrom: [
    "lib/api/**/*.ts",
    "lib/game/**/*.ts",
    "app/background/**/*.ts",
    "app/components/ui/**/*.tsx", // Add UI components to coverage
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
  // Use different environments for different test types
  testMatch: [
    "**/__tests__/**/*.(test|spec).(ts|tsx|js|jsx)",
  ],
  testEnvironmentOptions: {
    customExportConditions: ["node", "node-addons"],
  },
};

module.exports = createJestConfig(customJestConfig);
