# Wild Trails Test Suite

This directory contains the test suite for the Wild Trails API-first architecture.

## Test Structure

```
__tests__/
├── api/                   # API testing documentation
│   └── README.md         # Why API tests aren't included
├── lib/                  # Library/utility tests (✅ ACTIVE)
│   ├── api/             # API utilities
│   │   ├── validation.test.ts
│   │   └── auth.test.ts
│   └── game/            # Game logic
│       └── proximity.test.ts
└── background/          # Background job tests (✅ ACTIVE)
    └── game_ai.test.ts  # AI point generation tests
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- __tests__/lib/api/validation.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="proximity"
```

## Test Categories

### Unit Tests (✅ Active)
- **Validation Tests** (`lib/api/validation.test.ts`): Test Zod schemas for API request/response validation
- **Auth Tests** (`lib/api/auth.test.ts`): Test authentication and authorization utilities  
- **Proximity Tests** (`lib/game/proximity.test.ts`): Test distance calculations using LatLng utility
- **AI Tests** (`background/game_ai.test.ts`): Test AI point generation strategies

### API Integration Tests (Not Implemented)
- See `__tests__/api/README.md` for why these aren't included and recommended alternatives

## Mocking Strategy

### External API Mocking
Tests that would call external APIs (OSM, AI services) should:
1. Mock the service at the module level
2. Return predictable test data
3. Verify the service was called with correct parameters

Example:
```typescript
jest.mock("@/app/background/background_process", () => ({
  triggerAiGeneration: jest.fn(),
}));
```

## Test Coverage Goals

We aim for:
- **API Routes**: 80%+ coverage
- **Business Logic** (`lib/game/`, `lib/api/`): 90%+ coverage
- **Validation Schemas**: 100% coverage (all branches)

## Writing New Tests

### For New Utilities

1. Create test file in `__tests__/lib/[category]/[utility].test.ts`
2. Import the utility functions
3. Test edge cases, error handling, and expected behavior

## CI/CD Integration

Tests run automatically:
- On every commit (pre-commit hook via `npm run predeploy`)
- On pull requests
- Before deployment

## Best Practices

1. **Isolate tests**: Each test should be independent and not rely on others
2. **Mock external dependencies**: Never make real API calls in unit tests
3. **Test error cases**: Test both success and failure paths
4. **Use descriptive names**: Test names should clearly describe what's being tested
5. **Keep tests fast**: Unit tests should run in milliseconds
6. **Follow AAA pattern**: Arrange, Act, Assert

## Future Improvements

- [ ] Add E2E tests with Playwright for critical user flows
- [ ] Add performance benchmarks for proximity calculations
- [ ] Add integration tests with test database
- [ ] Add contract tests for API endpoints
- [ ] Set up test coverage reporting in CI

