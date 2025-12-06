// Jest setup file for unit tests

// Mock fetch for external API calls (used by OSM strategy tests)
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
  })
);

// Suppress expected console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    // Only show errors that aren't expected test errors
    const message = typeof args[0] === "string" ? args[0] : String(args[0]);
    
    // Suppress expected errors from tests
    const expectedErrors = [
      "Error fetching OSM data",
      "API error:", // From handleApiError tests
    ];
    
    if (!expectedErrors.some(err => message.includes(err))) {
      originalError.call(console, ...args);
    }
  };
});

afterAll(() => {
  console.error = originalError;
});

