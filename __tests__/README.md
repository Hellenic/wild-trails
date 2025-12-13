# Wild Trails Test Suite

## Overview

This directory contains unit tests for the Wild Trails application.

## Test Structure

```
__tests__/
├── api/                    # API endpoint tests
├── background/             # Background processing tests
│   ├── game_ai.test.ts
│   └── geo-utils.test.ts
├── lib/                    # Library/utility tests
│   ├── api/
│   │   ├── auth.test.ts
│   │   └── validation.test.ts
│   ├── audio/              # Sound system tests (NEW in Phase 1A)
│   │   └── sounds.test.ts
│   └── game/
│       └── proximity.test.ts
└── utils/                  # Utility function tests (NEW in Phase 1A)
    └── distance-estimation.test.ts
```

## Running Tests

### All Tests
```bash
npm test
# or
bun test
```

### Watch Mode
```bash
npm test -- --watch
# or
bun test --watch
```

### Coverage
```bash
npm test -- --coverage
# or
bun test --coverage
```

### Specific Test File
```bash
npm test geo-utils.test.ts
# or
bun test geo-utils.test.ts
```

## Phase 1A Test Coverage

### New Tests Added
1. **Sound System** (`lib/audio/sounds.test.ts`)
   - User preference management (localStorage)
   - Enable/disable functionality
   - Haptic feedback triggering (navigator.vibrate)
   - Graceful handling of missing APIs

2. **Distance Estimation** (`utils/distance-estimation.test.ts`)
   - Distance calculation accuracy
   - Error margin logic (20% with 500m minimum)
   - Edge cases (same point, negative coordinates)

### Existing Tests Enhanced
The existing geo-utils tests already cover:
- `calculateBearing()` - Used by compass
- `getCardinalDirection()` - Used by compass
- `calculateDistance()` - Used by distance estimates

## Test Configuration

- **Test Runner**: Jest with Next.js preset
- **Environment**: Node (default) or jsdom (per-test override)
- **Coverage**: Collected from `lib/`, `app/background/`
- **Mock Setup**: Browser APIs (localStorage, navigator.vibrate) are mocked

### Test Environments

Most tests use Node environment (faster, no DOM overhead):
- API tests
- Utility function tests
- Algorithm tests

Some tests require jsdom (browser APIs):
- Sound system tests (uses `navigator.vibrate`)
- Tests using `window`, `document`, `localStorage`

Use the `@jest-environment jsdom` docblock comment to override on a per-file basis:
```typescript
/**
 * @jest-environment jsdom
 */
```

## Testing Philosophy

We focus on **unit testing business logic** rather than component testing:
- ✅ Core algorithms and calculations
- ✅ Utility functions and helpers
- ✅ Data transformations
- ❌ Component rendering (covered by E2E tests)
- ❌ UI interactions (covered by field testing)

## Mocking Strategy

### Browser APIs
- **localStorage**: Mocked in sound tests
- **navigator.vibrate**: Mocked for haptic feedback
- **navigator.geolocation**: Mocked in location tracking tests

### External Dependencies
- Geo-utils functions mocked in compass tests
- Supabase client mocked where needed
- Next.js router mocked in navigation tests

## Coverage Goals

Current coverage targets:
- **lib/**: 80%+ line coverage
- **app/background/**: 70%+ line coverage
- **components/**: 60%+ line coverage (new components)

## What's NOT Tested (Yet)

### E2E/Integration Tests
- Full game flows (create → play → complete)
- Real GPS tracking
- Supabase Realtime events
- Map rendering and interactions

These will be covered by:
1. Playwright E2E tests (in `e2e/` directory)
2. Field testing in Phase 1B

### Not Unit Tested (Covered by E2E/Field Testing)
- **React Components**: Better tested through E2E with Playwright
- **Page flows**: Game list, results, onboarding, profile
- **Supabase integration**: Real database interactions
- **UI interactions**: Click handlers, form submissions

**Rationale**: Unit tests focus on pure logic; integration/E2E tests handle the rest.

## Running Specific Test Suites

### Core Functionality
```bash
npm test geo-utils
npm test proximity
```

### Phase 1A Features
```bash
npm test sounds
npm test distance-estimation
```

### All New Tests
```bash
npm test -- lib/audio/ utils/
```

## Adding New Tests

When adding new features, create tests following this pattern:

```typescript
import { render, screen } from "@testing-library/react";
import { YourComponent } from "@/path/to/component";

describe("YourComponent", () => {
  it("should do something", () => {
    render(<YourComponent />);
    expect(screen.getByText("Expected")).toBeInTheDocument();
  });
});
```

## Continuous Integration

Tests run automatically on:
- Pre-commit hooks (if configured)
- Pull request creation
- Main branch pushes

---

## Phase 1B Testing

Field testing (Phase 1B) will focus on:
- Real-world GPS accuracy
- Battery consumption
- User experience in various terrains
- Duration estimate accuracy
- Bug discovery and fixes

Unit tests help ensure code correctness, but field testing validates real-world usability.
