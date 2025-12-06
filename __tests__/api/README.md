# API Integration Tests (Not Implemented)

API integration tests have been intentionally excluded from this test suite.

## Why Not Included?

1. **Complex Mocking**: Next.js API routes with Request/Response objects are difficult to mock properly in Jest
2. **Supabase Client**: The chainable Supabase query builder requires extensive mocking infrastructure that doesn't reflect real behavior
3. **Better Alternatives**: E2E tests with Playwright or integration tests with a test database are more reliable and maintainable

## Recommended Testing Approach

Instead of unit testing API routes with mocks, we recommend:

### 1. **Unit Tests** (✅ Implemented)
Test the core business logic in isolation:
- Validation schemas (`lib/api/validation.ts`)
- Authentication utilities (`lib/api/auth.ts`)
- Game logic (`lib/game/proximity.ts`)
- AI generation (`app/background/`)

### 2. **E2E Tests** (Recommended Next Step)
Use Playwright to test complete user flows including API calls:
```typescript
test('create and play game', async ({ page }) => {
  await page.goto('/game/create');
  await page.fill('[name="gameName"]', 'Test Game');
  // ... interact with real UI and APIs
});
```

### 3. **Integration Tests with Test Database**
If you need to test API routes specifically:
1. Set up a Supabase test project or local instance
2. Run tests against real database with cleanup
3. Use actual HTTP requests instead of mocking

## Future Implementation

To add API tests later, consider:
- **Supabase Local Dev**: Use `supabase start` for local Postgres + Auth
- **Test Fixtures**: Seed test data before tests
- **Cleanup Hooks**: Reset database after each test
- **MSW (Mock Service Worker)**: For external API mocking

See `__tests__/README.md` for currently implemented tests.

