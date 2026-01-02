import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Player } from "@/types/game";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface LobbyPlayer extends Player {
  user_email?: string;
}

interface UseLobbyResult {
  players: LobbyPlayer[];
  loading: boolean;
  error: string | null;
  isAllReady: boolean;
  setPlayerReady: (playerId: string, ready: boolean) => Promise<void>;
  kickPlayer: (playerId: string) => Promise<void>;
  startGame: () => Promise<void>;
}

export function useLobby(gameId: string): UseLobbyResult {
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch initial players
  const fetchPlayers = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("players")
        .select("*")
        .eq("game_id", gameId)
        .order("created_at", { ascending: true });

      if (fetchError) {
        console.error("Error fetching players:", fetchError);
        setError("Failed to load players");
        return;
      }

      setPlayers(data || []);
      setError(null);
    } catch (err) {
      console.error("Error in fetchPlayers:", err);
      setError("Failed to load players");
    } finally {
      setLoading(false);
    }
  }, [gameId, supabase]);

  // Set up realtime subscription
  useEffect(() => {
    fetchPlayers();

    let channel: RealtimeChannel | null = null;

    const setupSubscription = async () => {
      channel = supabase
        .channel(`lobby:${gameId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "players",
            filter: `game_id=eq.${gameId}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              setPlayers((prev) => {
                // Avoid duplicates
                if (prev.some((p) => p.id === (payload.new as Player).id)) {
                  return prev;
                }
                return [...prev, payload.new as LobbyPlayer];
              });
            } else if (payload.eventType === "UPDATE") {
              setPlayers((prev) =>
                prev.map((p) =>
                  p.id === (payload.new as Player).id
                    ? (payload.new as LobbyPlayer)
                    : p
                )
              );
            } else if (payload.eventType === "DELETE") {
              setPlayers((prev) =>
                prev.filter((p) => p.id !== (payload.old as Player).id)
              );
            }
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [gameId, fetchPlayers, supabase]);

  // Check if all players are ready
  const isAllReady = players.length > 0 && players.every((p) => p.status === "ready");

  // Set player ready status
  const setPlayerReady = useCallback(
    async (playerId: string, ready: boolean) => {
      const { error: updateError } = await supabase
        .from("players")
        .update({ status: ready ? "ready" : "waiting" })
        .eq("id", playerId);

      if (updateError) {
        console.error("Error updating player status:", updateError);
        throw new Error("Failed to update ready status");
      }
    },
    [supabase]
  );

  // Kick player (creator only)
  const kickPlayer = useCallback(
    async (playerId: string) => {
      const { error: deleteError } = await supabase
        .from("players")
        .delete()
        .eq("id", playerId);

      if (deleteError) {
        console.error("Error kicking player:", deleteError);
        throw new Error("Failed to kick player");
      }
    },
    [supabase]
  );

  // Start the game
  const startGame = useCallback(async () => {
    // Update game status to ready (which will trigger point generation for AI games)
    const { error: updateError } = await supabase
      .from("games")
      .update({ status: "ready" })
      .eq("id", gameId);

    if (updateError) {
      console.error("Error starting game:", updateError);
      throw new Error("Failed to start game");
    }

    // Update all players to playing status
    const { error: playersError } = await supabase
      .from("players")
      .update({ status: "playing" })
      .eq("game_id", gameId);

    if (playersError) {
      console.error("Error updating player statuses:", playersError);
      throw new Error("Failed to update player statuses");
    }
  }, [gameId, supabase]);

  return {
    players,
    loading,
    error,
    isAllReady,
    setPlayerReady,
    kickPlayer,
    startGame,
  };
}

