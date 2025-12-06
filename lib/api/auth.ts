import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * Error class for authentication failures
 */
export class AuthenticationError extends Error {
  constructor(message: string = "Authentication required") {
    super(message);
    this.name = "AuthenticationError";
  }
}

/**
 * Error class for authorization failures
 */
export class AuthorizationError extends Error {
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Extract the authenticated user from a Next.js request
 * @returns The authenticated user or null if not authenticated
 */
export async function getUserFromRequest(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Require authentication for an API endpoint
 * Throws AuthenticationError if user is not authenticated
 * @returns The authenticated user
 */
export async function requireAuth(): Promise<User> {
  const user = await getUserFromRequest();
  if (!user) {
    throw new AuthenticationError("Authentication required");
  }
  return user;
}

/**
 * Verify that the authenticated user is the creator of a game
 * @param userId - The user ID to check
 * @param gameId - The game ID to check
 * @throws AuthorizationError if user is not the game creator
 */
export async function requireGameCreator(
  userId: string,
  gameId: string
): Promise<void> {
  const supabase = await createClient();
  const { data: game, error } = await supabase
    .from("games")
    .select("creator_id")
    .eq("id", gameId)
    .single();

  if (error || !game) {
    throw new AuthorizationError("Game not found");
  }

  if (game.creator_id !== userId) {
    throw new AuthorizationError(
      "Only the game creator can perform this action"
    );
  }
}

/**
 * Verify that the authenticated user is a player in a game
 * @param userId - The user ID to check
 * @param gameId - The game ID to check
 * @returns The player record if found
 * @throws AuthorizationError if user is not a player in the game
 */
export async function requireGamePlayer(
  userId: string,
  gameId: string
): Promise<{ id: string; role: string }> {
  const supabase = await createClient();
  const { data: player, error } = await supabase
    .from("players")
    .select("id, role")
    .eq("game_id", gameId)
    .eq("user_id", userId)
    .single();

  if (error || !player) {
    throw new AuthorizationError("Player not found in this game");
  }

  return player;
}

/**
 * Verify that the authenticated user is either the game creator or a player
 * @param userId - The user ID to check
 * @param gameId - The game ID to check
 * @throws AuthorizationError if user is not authorized
 */
export async function requireGameAccess(
  userId: string,
  gameId: string
): Promise<void> {
  const supabase = await createClient();

  // Check if user is the creator
  const { data: game } = await supabase
    .from("games")
    .select("creator_id")
    .eq("id", gameId)
    .single();

  if (game?.creator_id === userId) {
    return;
  }

  // Check if user is a player
  const { data: player } = await supabase
    .from("players")
    .select("id")
    .eq("game_id", gameId)
    .eq("user_id", userId)
    .single();

  if (!player) {
    throw new AuthorizationError("Access denied to this game");
  }
}

/**
 * Handle API errors with proper type checking
 * Returns appropriate NextResponse based on error type
 */
export function handleApiError(error: unknown): NextResponse {
  console.error("API error:", error);

  // Check for Zod validation errors
  if (
    error &&
    typeof error === "object" &&
    "name" in error &&
    error.name === "ZodError" &&
    "errors" in error
  ) {
    return NextResponse.json(
      { error: "Validation error", details: error.errors },
      { status: 400 }
    );
  }

  // Check for authentication errors
  if (error instanceof AuthenticationError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  // Check for authorization errors
  if (error instanceof AuthorizationError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  // Default error response
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}

