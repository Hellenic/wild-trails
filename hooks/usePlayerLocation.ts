import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database.types";
import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";

type PlayerLocation = Tables<"player_locations">;
type PlayerLocationPayload = RealtimePostgresInsertPayload<PlayerLocation>;
type PlayerLocationsMap = Record<string, PlayerLocation>;

export function usePlayerLocation(gameId: string) {
  const [locations, setLocations] = useState<PlayerLocationsMap>({});

  useEffect(() => {
    if (!gameId) return;

    const supabase = createClient();

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
        (payload: PlayerLocationPayload) => {
          setLocations((prev) => ({
            ...prev,
            [payload.new.player_id]: payload.new,
          }));
        }
      )
      .subscribe();

    // Fetch initial locations for each player
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from("player_locations")
        .select("*")
        .eq("game_id", gameId)
        .order("timestamp", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching player locations:", error);
      } else if (data) {
        const latestLocations = data.reduce(
          (acc, location) => ({
            ...acc,
            [location.player_id]: location,
          }),
          {} as PlayerLocationsMap
        );

        setLocations(latestLocations);
      }
    };

    fetchLocations();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  return { locations, loading: false };
}
