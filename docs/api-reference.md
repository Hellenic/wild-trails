# Wild Trails API Reference

This document describes the RESTful API endpoints for the Wild Trails game.

## Authentication

All API endpoints (except where noted) require authentication using Supabase session tokens. The authentication is handled automatically through the `proxy.ts` middleware which validates the session on each request.

## Error Responses

All API endpoints follow a consistent error response format:

```json
{
  "error": "Error message",
  "details": "Optional detailed error information"
}
```

Common HTTP status codes:
- `400`: Bad Request (validation error)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (authorization failed)
- `404`: Not Found
- `500`: Internal Server Error

## Game Endpoints

### Create Game

**Endpoint:** `POST /api/game/setup`

**Description:** Creates a new game with the specified settings.

**Request Body:**
```typescript
{
  name: string;                    // Game name (required)
  password: string;                // Game password (required)
  duration: number;                // Duration in minutes (required)
  max_radius: number;              // Maximum radius for gameplay area (required)
  player_count: number;            // Number of players (required)
  game_mode: "single_player" | "two_player" | "multi_player";
  game_master: "player" | "ai";    // Who creates the points
  selected_role?: "player_a" | "player_b" | "game_master";
  starting_point?: {               // Optional starting point
    lat: number;
    lng: number;
  };
  bounding_box: {                  // Required gameplay area bounds
    northWest: { lat: number; lng: number };
    southEast: { lat: number; lng: number };
  };
}
```

**Response:** `201 Created`
```typescript
{
  id: string;
  created_at: string;
  creator_id: string;
  name: string;
  status: "setup" | "ready" | "active" | "completed";
  // ... other game fields
}
```

**Notes:**
- Automatically creates a player record for the creator if `selected_role` is provided
- If `game_master` is "ai", triggers automatic point generation in the background

### Get Game Status

**Endpoint:** `GET /api/game/[id]/status`

**Description:** Retrieves the current status and details of a game.

**Response:** `200 OK`
```typescript
{
  id: string;
  status: "setup" | "ready" | "active" | "completed";
  started_at: string | null;
  ended_at: string | null;
  // ... other game fields
}
```

### Update Game Status

**Endpoint:** `POST /api/game/[id]/status`

**Description:** Updates the status of a game.

**Request Body:**
```typescript
{
  status: "setup" | "ready" | "active" | "completed";
}
```

**Response:** `200 OK`
```typescript
{
  id: string;
  status: string;
  started_at: string | null;  // Set when status becomes "active"
  ended_at: string | null;    // Set when status becomes "completed"
  // ... other game fields
}
```

**Notes:**
- Automatically sets `started_at` when status changes to "active"
- Automatically sets `ended_at` when status changes to "completed"

## Player Endpoints

### Join Game

**Endpoint:** `POST /api/game/[id]/join`

**Description:** Join a game as a player.

**Request Body:**
```typescript
{
  role: "player_a" | "player_b" | "game_master";
}
```

**Response:** `201 Created`
```typescript
{
  id: string;
  created_at: string;
  game_id: string;
  user_id: string;
  role: string;
  status: "waiting" | "ready" | "playing" | "finished";
}
```

### Update Player Status

**Endpoint:** `POST /api/player/[id]/status`

**Description:** Update a player's status in a game.

**Request Body:**
```typescript
{
  status: "waiting" | "ready" | "playing" | "finished";
}
```

**Response:** `200 OK`
```typescript
{
  id: string;
  game_id: string;
  user_id: string;
  role: string;
  status: string;
}
```

## Points Endpoints

### Generate Points

**Endpoint:** `POST /api/points/generate`

**Description:** Trigger automatic point generation for a game (AI game master).

**Request Body:**
```typescript
{
  game_id: string;
}
```

**Response:** `200 OK`
```typescript
{
  success: true;
  message: "Point generation started";
}
```

**Notes:**
- Point generation happens asynchronously in the background
- Only the game creator can trigger point generation

### Manually Create Points

**Endpoint:** `POST /api/points/manual-create`

**Description:** Manually create game points (player game master).

**Request Body:**
```typescript
{
  game_id: string;
  points: Array<{
    id: string;                      // UUID
    type: "start" | "end" | "clue";
    position: [number, number];      // [latitude, longitude]
    hint?: string;                   // Optional hint text
  }>;
}
```

**Response:** `201 Created`
```typescript
{
  success: true;
  points: Array<{
    id: string;
    game_id: string;
    type: string;
    latitude: number;
    longitude: number;
    sequence_number: number;
    hint: string | null;
    status: "unvisited" | "visited";
    created_at: string;
    updated_at: string;
  }>;
}
```

**Notes:**
- Only the game creator can create points
- Points are automatically sequenced based on array order

### Update Point Status

**Endpoint:** `POST /api/points/[id]/status`

**Description:** Update a point's status (typically done by server-side proximity checking).

**Request Body:**
```typescript
{
  status: "unvisited" | "visited";
}
```

**Response:** `200 OK`
```typescript
{
  id: string;
  game_id: string;
  type: string;
  latitude: number;
  longitude: number;
  status: string;
  updated_at: string;
  // ... other point fields
}
```

## Location & Proximity Endpoint

### Update Location

**Endpoint:** `POST /api/game/location-update`

**Description:** Update player location and trigger server-side proximity checks.

**Request Body:**
```typescript
{
  game_id: string;
  player_id: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  altitude_accuracy: number | null;
  accuracy: number;
  speed: number | null;
  heading: number | null;
}
```

**Response:** `200 OK`
```typescript
{
  success: true;
  proximity_events?: Array<{
    point_id: string;
    point_type: "start" | "end" | "clue";
    hint: string | null;
    distance: number;  // Distance in meters
  }>;
}
```

**Notes:**
- Automatically performs server-side proximity checking
- Returns proximity events if player is within trigger distance (50 meters) of any unvisited points
- Updates point status to "visited" when triggered
- Emits real-time events via Supabase for point reached notifications

## Real-time Events

The application uses Supabase Realtime for real-time updates:

### Game Points Updates

Subscribe to changes on the `game_points` table filtered by `game_id`:

```typescript
const channel = supabase
  .channel(`game_points_${gameId}`)
  .on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "game_points",
      filter: `game_id=eq.${gameId}`,
    },
    (payload) => {
      // Handle point status changes
      if (payload.new.status === "visited") {
        // Point was reached by a player
      }
    }
  )
  .subscribe();
```

### Player Locations

Subscribe to location updates on the `player_locations` table:

```typescript
const channel = supabase
  .channel("player_locations")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "player_locations",
      filter: `game_id=eq.${gameId}`,
    },
    (payload) => {
      // Handle new location updates
    }
  )
  .subscribe();
```

## Type Safety

All API endpoints use Zod schemas for validation. The schemas are shared between the API and frontend via `lib/api/validation.ts`, ensuring type safety across the entire application.

TypeScript types can be imported from:
```typescript
import type {
  CreateGameInput,
  GameResponse,
  UpdateGameStatusInput,
  // ... other types
} from "@/lib/api/validation";
```

## API Client

A typed API client is available at `lib/api/client.ts`:

```typescript
import { gameAPI, pointsAPI, locationAPI } from "@/lib/api/client";

// Create a game
const game = await gameAPI.create(gameData);

// Update game status
await gameAPI.updateStatus(gameId, { status: "active" });

// Update location
await locationAPI.update(locationData);
```

The API client handles error responses and provides type-safe interfaces for all endpoints.

