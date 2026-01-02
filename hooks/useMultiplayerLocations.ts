import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { GameRole } from "@/lib/game/roles";

export interface PlayerLocation {
  playerId: string;
  userId: string;
  role: GameRole;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: string;
}

interface PlayerInfo {
  userId: string;
  role: GameRole;
}

interface UseMultiplayerLocationsResult {
  playerLocations: Map<string, PlayerLocation>;
  loading: boolean;
  error: string | null;
  updateMyLocation: (
    latitude: number,
    longitude: number,
    accuracy?: number,
    altitude?: number,
    speed?: number,
    heading?: number
  ) => Promise<void>;
}

// Throttle location updates to every 10 seconds
const LOCATION_UPDATE_INTERVAL_MS = 10000;

export function useMultiplayerLocations(
  gameId: string,
  playerId: string
): UseMultiplayerLocationsResult {
  const [playerLocations, setPlayerLocations] = useState<Map<string, PlayerLocation>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastUpdateRef = useRef<number>(0);
  // Use ref for playerRoleMap to allow updates without recreating the subscription
  const playerRoleMapRef = useRef<Map<string, PlayerInfo>>(new Map());
  const supabase = createClient();

  // Fetch initial player locations and update the role map
  const fetchPlayerLocations = useCallback(async () => {
    try {
      // Get all players in the game with their roles
      const { data: players, error: playersError } = await supabase
        .from("players")
        .select("id, user_id, role")
        .eq("game_id", gameId);

      if (playersError) {
        console.error("Error fetching players:", playersError);
        setError("Failed to load players");
        return;
      }

      // Update the player role map ref
      const newRoleMap = new Map<string, PlayerInfo>();
      for (const player of players || []) {
        newRoleMap.set(player.id, {
          userId: player.user_id,
          role: player.role as GameRole,
        });
      }
      playerRoleMapRef.current = newRoleMap;

      // Get most recent location for each player
      const playerMap = new Map<string, PlayerLocation>();

      for (const player of players || []) {
        const { data: locationData } = await supabase
          .from("player_locations")
          .select("*")
          .eq("game_id", gameId)
          .eq("player_id", player.id)
          .order("timestamp", { ascending: false })
          .limit(1)
          .single();

        if (locationData && locationData.latitude && locationData.longitude) {
          playerMap.set(player.id, {
            playerId: player.id,
            userId: player.user_id,
            role: player.role as GameRole,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            accuracy: locationData.accuracy,
            altitude: locationData.altitude,
            speed: locationData.speed,
            heading: locationData.heading,
            timestamp: locationData.timestamp,
          });
        }
      }

      setPlayerLocations(playerMap);
      setError(null);
    } catch (err) {
      console.error("Error in fetchPlayerLocations:", err);
      setError("Failed to load player locations");
    } finally {
      setLoading(false);
    }
  }, [gameId, supabase]);

  // Set up realtime subscription for location updates and player changes
  useEffect(() => {
    fetchPlayerLocations();

    let locationsChannel: RealtimeChannel | null = null;
    let playersChannel: RealtimeChannel | null = null;

    const setupSubscriptions = async () => {
      // Subscribe to location updates
      locationsChannel = supabase
        .channel(`game:${gameId}:locations`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "player_locations",
            filter: `game_id=eq.${gameId}`,
          },
          async (payload) => {
            const newLocation = payload.new as {
              player_id: string;
              latitude: number | null;
              longitude: number | null;
              accuracy: number | null;
              altitude: number | null;
              speed: number | null;
              heading: number | null;
              timestamp: string;
            };

            if (!newLocation.latitude || !newLocation.longitude) return;

            // Get player info from ref, fetching if unknown (handles late-joining players)
            let playerInfo = playerRoleMapRef.current.get(newLocation.player_id);
            
            if (!playerInfo) {
              // Player not in our map - fetch their info (late joiner)
              const { data: player } = await supabase
                .from("players")
                .select("id, user_id, role")
                .eq("id", newLocation.player_id)
                .single();
              
              if (player) {
                playerInfo = {
                  userId: player.user_id,
                  role: player.role as GameRole,
                };
                // Update the ref for future lookups
                playerRoleMapRef.current.set(player.id, playerInfo);
              } else {
                // Still can't find player, skip this update
                return;
              }
            }

            setPlayerLocations((prev) => {
              const updated = new Map(prev);
              updated.set(newLocation.player_id, {
                playerId: newLocation.player_id,
                userId: playerInfo!.userId,
                role: playerInfo!.role,
                latitude: newLocation.latitude!,
                longitude: newLocation.longitude!,
                accuracy: newLocation.accuracy,
                altitude: newLocation.altitude,
                speed: newLocation.speed,
                heading: newLocation.heading,
                timestamp: newLocation.timestamp,
              });
              return updated;
            });
          }
        )
        .subscribe();

      // Subscribe to player changes to keep the role map updated
      playersChannel = supabase
        .channel(`game:${gameId}:players`)
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
              const newPlayer = payload.new as {
                id: string;
                user_id: string;
                role: GameRole;
              };
              playerRoleMapRef.current.set(newPlayer.id, {
                userId: newPlayer.user_id,
                role: newPlayer.role,
              });
            } else if (payload.eventType === "UPDATE") {
              const updatedPlayer = payload.new as {
                id: string;
                user_id: string;
                role: GameRole;
              };
              playerRoleMapRef.current.set(updatedPlayer.id, {
                userId: updatedPlayer.user_id,
                role: updatedPlayer.role,
              });
            } else if (payload.eventType === "DELETE") {
              const deletedPlayer = payload.old as { id: string };
              playerRoleMapRef.current.delete(deletedPlayer.id);
              // Also remove from locations
              setPlayerLocations((prev) => {
                const updated = new Map(prev);
                updated.delete(deletedPlayer.id);
                return updated;
              });
            }
          }
        )
        .subscribe();
    };

    setupSubscriptions();

    return () => {
      if (locationsChannel) {
        supabase.removeChannel(locationsChannel);
      }
      if (playersChannel) {
        supabase.removeChannel(playersChannel);
      }
    };
  }, [gameId, fetchPlayerLocations, supabase]);

  // Update current player's location (with throttling)
  const updateMyLocation = useCallback(
    async (
      latitude: number,
      longitude: number,
      accuracy?: number,
      altitude?: number,
      speed?: number,
      heading?: number
    ) => {
      const now = Date.now();
      
      // Throttle updates
      if (now - lastUpdateRef.current < LOCATION_UPDATE_INTERVAL_MS) {
        return;
      }
      
      lastUpdateRef.current = now;

      try {
        const { error: insertError } = await supabase
          .from("player_locations")
          .insert({
            game_id: gameId,
            player_id: playerId,
            latitude,
            longitude,
            accuracy: accuracy ?? null,
            altitude: altitude ?? null,
            speed: speed ?? null,
            heading: heading ?? null,
          });

        if (insertError) {
          console.error("Error updating location:", insertError);
        }
      } catch (err) {
        console.error("Error in updateMyLocation:", err);
      }
    },
    [gameId, playerId, supabase]
  );

  return {
    playerLocations,
    loading,
    error,
    updateMyLocation,
  };
}

