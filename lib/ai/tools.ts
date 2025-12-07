import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { processCreateGame } from "@/app/background/background_process";
import type { CreateGameInput } from "@/lib/api/validation";
import type { User } from "@supabase/supabase-js";

/**
 * AI Tool Definitions for Wild Trails Game Creation
 * 
 * These tools enable the AI to orchestrate game creation through
 * conversational interfaces, calling the Core API endpoints.
 */

// ============================================================================
// Tool Schemas
// ============================================================================

const createGameSchema = z.object({
  name: z.string().min(1).describe("The name of the game"),
  password: z.string().min(1).describe("Password to join the game"),
  duration: z.number().int().positive().describe("Game duration in minutes"),
  max_radius: z.number().positive().describe("Maximum radius in kilometers from center"),
  player_count: z.number().int().positive().describe("Number of players allowed"),
  game_master: z.enum(["ai", "player"]).describe("Who sets up the game points: ai or player"),
  bounding_box: z.object({
    northWest: z.object({
      lat: z.number().describe("North-west corner latitude"),
      lng: z.number().describe("North-west corner longitude"),
    }),
    southEast: z.object({
      lat: z.number().describe("South-east corner latitude"),
      lng: z.number().describe("South-east corner longitude"),
    }),
  }).describe("Geographic boundaries for the game area"),
  starting_point: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional().describe("Optional starting point coordinates"),
  selected_role: z.enum(["player_a", "player_b", "game_master"]).optional()
    .describe("Optional role for the creator to join as player"),
});

const getGameStatusSchema = z.object({
  game_id: z.string().uuid().describe("The UUID of the game to check"),
});

// ============================================================================
// Tool Definitions (for Vercel AI SDK v5)
// ============================================================================

export const wildTrailsTools = (user: User) => ({
  create_game: {
    description: `Create a new Wild Trails game with the specified parameters. 
This tool should be used after gathering all necessary information from the user:
- Game name and password
- Map area (bounding box with northWest and southEast coordinates)
- Duration in minutes (convert from hours if user specifies hours)
- Maximum distance/radius in kilometers
- Number of players
- Game master type (ai or player)
- Optional: starting point coordinates
- Optional: player role if they want to join immediately

The game will be created in 'setup' status. If game_master is 'ai', 
point generation will start automatically in the background.`,
    inputSchema: createGameSchema,
    execute: async (params: z.infer<typeof createGameSchema>) => {
      try {
        if (!user?.id) {
          return {
            success: false,
            error: "User not authenticated",
          };
        }

        const supabase = await createClient();

        // Create the game directly in the database
        const { data: game, error } = await supabase
          .from("games")
          .insert({
            creator_id: user.id,
            status: "setup",
            name: params.name,
            password: params.password,
            player_count: params.player_count,
            selected_role: params.selected_role || null,
            max_radius: params.max_radius,
            bounding_box: params.bounding_box,
            duration: params.duration,
            game_master: params.game_master,
            game_mode: "single_player",
            starting_point: params.starting_point || null,
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating game:", error);
          return {
            success: false,
            error: error.message || "Failed to create game",
          };
        }

        // Create a player for the creator if they've selected a role
        if (params.selected_role) {
          const { error: playerError } = await supabase.from("players").insert({
            game_id: game.id,
            user_id: user.id,
            role: params.selected_role,
          });

          if (playerError) {
            console.error("Error creating player:", playerError);
            // Don't fail the request, but log the error
          }
        }

        // Generate points if AI is game master
        if (params.game_master === "ai") {
          // Trigger point generation in the background
          processCreateGame(game.id).catch((error) => {
            console.error("Error while processing the game:", error);
          });
        }

        return {
          success: true,
          game_id: game.id,
          status: game.status,
          selected_role: params.selected_role,
          message: params.game_master === "ai"
            ? "Game created! AI is now generating waypoints with hints. This may take a few moments..."
            : "Game created! You can now set up the waypoints manually.",
        };
      } catch (error) {
        console.error("Error creating game:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to create game",
        };
      }
    },
  },

  get_game_status: {
    description: `Check the status of a game by its ID. 
Use this to:
- Monitor if AI point generation is complete (status changes from 'setup' to 'ready')
- Get current game details
- Verify game was created successfully

The game status can be:
- 'setup': Game created, points being generated or need manual setup
- 'ready': Points are set, ready to start
- 'active': Game is currently being played
- 'completed': Game has ended`,
    inputSchema: getGameStatusSchema,
    execute: async (params: z.infer<typeof getGameStatusSchema>) => {
      try {
        const supabase = await createClient();

        // Get game status directly from the database
        const { data: game, error } = await supabase
          .from("games")
          .select("*")
          .eq("id", params.game_id)
          .single();

        if (error || !game) {
          return {
            success: false,
            error: "Game not found",
          };
        }

        return {
          success: true,
          game_id: game.id,
          name: game.name,
          status: game.status,
          game_master: game.game_master,
          player_count: game.player_count,
          duration: game.duration,
          created_at: game.created_at,
          started_at: game.started_at,
          message: game.status === "ready"
            ? "Game is ready to start!"
            : game.status === "setup" && game.game_master === "ai"
            ? "AI is still generating waypoints..."
            : `Game status: ${game.status}`,
        };
      } catch (error) {
        console.error("Error getting game status:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to get game status",
        };
      }
    },
  },
});
