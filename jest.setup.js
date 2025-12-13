// Jest setup file for unit tests

// Mock fetch for external API calls (used by OSM strategy tests)
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
  })
);

