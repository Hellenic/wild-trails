import type {
  CreateGameInput,
  GameResponse,
  UpdateGameStatusInput,
  JoinGameInput,
  PlayerResponse,
  UpdatePlayerStatusInput,
  CreatePointsInput,
  PointResponse,
  UpdatePointStatusInput,
  LocationUpdateInput,
  ProximityEvent,
} from "./validation";

/**
 * Base error class for API errors
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "APIError";
  }
}

/**
 * Generic API request handler with type safety
 */
async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "An error occurred",
    }));
    throw new APIError(
      error.error || "An error occurred",
      response.status,
      error.code
    );
  }

  return response.json();
}

// ============================================================================
// Game API Client
// ============================================================================

export const gameAPI = {
  /**
   * Create a new game
   */
  create: async (data: CreateGameInput): Promise<GameResponse> => {
    return apiRequest<GameResponse>("/api/game/setup", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Get game status
   */
  getStatus: async (gameId: string): Promise<GameResponse> => {
    return apiRequest<GameResponse>(`/api/game/${gameId}/status`, {
      method: "GET",
    });
  },

  /**
   * Update game status
   */
  updateStatus: async (
    gameId: string,
    data: UpdateGameStatusInput
  ): Promise<GameResponse> => {
    return apiRequest<GameResponse>(`/api/game/${gameId}/status`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Join a game
   */
  join: async (gameId: string, data: JoinGameInput): Promise<PlayerResponse> => {
    return apiRequest<PlayerResponse>(`/api/game/${gameId}/join`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// ============================================================================
// Location API Client
// ============================================================================

export const locationAPI = {
  /**
   * Update player location
   */
  update: async (
    data: LocationUpdateInput
  ): Promise<{ success: boolean; proximity_events?: ProximityEvent[] }> => {
    return apiRequest("/api/game/location-update", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// ============================================================================
// Player API Client
// ============================================================================

export const playerAPI = {
  /**
   * Update player status
   */
  updateStatus: async (
    playerId: string,
    data: UpdatePlayerStatusInput
  ): Promise<PlayerResponse> => {
    return apiRequest(`/api/player/${playerId}/status`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// ============================================================================
// Points API Client
// ============================================================================

export const pointsAPI = {
  /**
   * Generate game points (AI or manual)
   */
  generate: async (gameId: string): Promise<{ success: boolean }> => {
    return apiRequest(`/api/points/generate`, {
      method: "POST",
      body: JSON.stringify({ game_id: gameId }),
    });
  },

  /**
   * Manually create points
   */
  createManual: async (
    gameId: string,
    data: CreatePointsInput
  ): Promise<{ success: boolean; points: PointResponse[] }> => {
    return apiRequest(`/api/points/manual-create`, {
      method: "POST",
      body: JSON.stringify({ game_id: gameId, ...data }),
    });
  },

  /**
   * Update point status
   */
  updateStatus: async (
    pointId: string,
    data: UpdatePointStatusInput
  ): Promise<PointResponse> => {
    return apiRequest(`/api/points/${pointId}/status`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

