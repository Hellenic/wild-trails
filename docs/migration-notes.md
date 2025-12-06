# API Refactoring Migration Notes

## Overview

This document describes the migration from Server Actions to a RESTful API architecture in the Wild Trails application.

## What Changed

### Server Actions Removed

The following Server Action files have been removed:
- `app/actions/games.ts`
- `app/actions/points.ts`
- `app/actions/players.ts`

### New API Structure

All functionality has been migrated to RESTful API endpoints under `app/api/`:

```
app/api/
  ├── game/
  │   ├── setup/route.ts                 # POST: Create game
  │   ├── [id]/status/route.ts           # GET/POST: Game status
  │   ├── [id]/join/route.ts             # POST: Join game
  │   └── location-update/route.ts       # POST: Location updates
  ├── points/
  │   ├── generate/route.ts              # POST: Generate points
  │   ├── manual-create/route.ts         # POST: Create points manually
  │   └── [id]/status/route.ts           # POST: Update point status
  └── player/
      └── [id]/status/route.ts           # POST: Update player status
```

### New Infrastructure

**Type-Safe Validation:**
- `lib/api/validation.ts` - Zod schemas for all API endpoints
- Shared types between API and frontend

**Authentication:**
- `lib/api/auth.ts` - Authentication and authorization utilities
- Reuses existing session management from `proxy.ts`

**API Client:**
- `lib/api/client.ts` - Typed API client for frontend

**Server-Side Logic:**
- `lib/game/proximity.ts` - Server-side proximity checking

## Breaking Changes

### 1. Game Creation

**Before (Server Action):**
```typescript
import { createGame } from "@/app/actions/games";

await createGame(gameSettings);
// Automatically redirects to setup page
```

**After (API):**
```typescript
import { gameAPI } from "@/lib/api/client";
import { useRouter } from "next/navigation";

const game = await gameAPI.create(gameSettings);
router.push(`/game/${game.id}/setup`);
```

### 2. Game Status Updates

**Before:**
```typescript
import { updateGameStatus } from "@/app/actions/games";

await updateGameStatus(gameId, "active");
```

**After:**
```typescript
import { gameAPI } from "@/lib/api/client";

await gameAPI.updateStatus(gameId, { status: "active" });
```

### 3. Points Management

**Before:**
```typescript
import { saveGamePoints } from "@/app/actions/points";

await saveGamePoints(gameId, points);
```

**After:**
```typescript
import { pointsAPI } from "@/lib/api/client";

await pointsAPI.createManual(gameId, { points });
```

### 4. Player Status

**Before:**
```typescript
import { updatePlayerStatus } from "@/app/actions/players";

await updatePlayerStatus(gameId, "ready");
```

**After:**
```typescript
const response = await fetch(`/api/player/${playerId}/status`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ status: "ready" }),
});
```

### 5. Location Tracking

**Before:**
```typescript
// Direct Supabase insert
const { error } = await supabase
  .from("player_locations")
  .insert(locationData);
```

**After:**
```typescript
import { locationAPI } from "@/lib/api/client";

const response = await locationAPI.update(locationData);
// Returns proximity events if any points were reached
```

### 6. Proximity Checking

**Before:**
```typescript
// Client-side proximity checking
import { useProximityCheck } from "@/hooks/useProximityCheck";

useProximityCheck({
  playerLocation,
  points,
  onPointReached: (point) => {
    // Handle point reached
  },
});
```

**After:**
```typescript
// Server-side proximity checking + Realtime events
useEffect(() => {
  const supabase = createClient();
  
  const channel = supabase
    .channel(`game_points_${gameId}`)
    .on("postgres_changes", {
      event: "UPDATE",
      schema: "public",
      table: "game_points",
      filter: `game_id=eq.${gameId}`,
    }, (payload) => {
      if (payload.new.status === "visited") {
        // Handle point reached
      }
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [gameId]);
```

## Benefits

### 1. Security

- **Server-side proximity checking** prevents cheating
- Points can only be marked as visited by the server based on actual location
- Client cannot manipulate point status directly

### 2. Mobile Compatibility

- RESTful API can be called from any client (web, iOS, Android)
- No dependency on Next.js Server Actions

### 3. Type Safety

- Zod schemas shared between API and frontend
- Type inference from schemas ensures consistency
- Validation errors caught at compile time

### 4. Testability

- API endpoints can be tested independently
- Clear separation of concerns
- Mock API responses for frontend tests

### 5. Scalability

- API endpoints can be cached, rate-limited, or optimized independently
- Background processing separated from request/response cycle
- Better monitoring and logging capabilities

## Database Changes

No database schema changes were required for this refactoring. All existing tables continue to work as before:

- `games`
- `players`
- `game_points`
- `player_locations`

## Real-time Updates

The application continues to use Supabase Realtime for:

- Game status changes
- Player status updates
- Point discovery notifications (now triggered by server)
- Player location updates

## Testing

All existing UI functionality should work exactly as before. The user experience remains unchanged, but the underlying implementation is now more secure and scalable.

### Testing Checklist

- [ ] Create new game (both AI and player game master)
- [ ] Join existing game
- [ ] Set up game points (manual and AI-generated)
- [ ] Start game
- [ ] Track player location during gameplay
- [ ] Reach points and verify notifications
- [ ] Complete game
- [ ] Verify real-time updates work for all players

## Rollback Plan

If issues are discovered, the Server Actions files can be restored from git history:

```bash
git checkout main -- app/actions/
```

Then revert the frontend changes to use Server Actions instead of API calls.

## Future Enhancements

This API-first architecture enables:

1. **Mobile Apps**: Native iOS and Android apps can use the same API
2. **AI Integration**: AI tools can interact with the game via API
3. **Third-party Integrations**: External services can trigger game events
4. **Analytics**: Better tracking of API usage and performance
5. **Rate Limiting**: Protect against abuse
6. **API Versioning**: Support multiple API versions simultaneously

## Questions or Issues

If you encounter any issues during migration or have questions about the new API structure, please refer to:

- `docs/api-reference.md` - Complete API documentation
- `lib/api/validation.ts` - Request/response schemas
- `lib/api/client.ts` - Usage examples

