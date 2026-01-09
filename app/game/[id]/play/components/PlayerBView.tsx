"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useMultiplayerLocations } from "@/hooks/useMultiplayerLocations";
import { useGameContext } from "@/app/game/components/GameContext";
import { TimeDisplay } from "./TimeDisplay";
import { GameMap } from "./GameMap";
import { createClient } from "@/lib/supabase/client";
import { calculateDistance } from "@/app/background/geo-utils";
import { formatDistance } from "@/lib/utils/distance";
import { Icon, Button, GlassPanel } from "@/app/components/ui";
import { getRoleInfo } from "@/lib/game/roles";
import type { GameDetails, Player, GamePoint } from "@/types/game";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface PlayerBViewProps {
  gameDetails: GameDetails;
  player: Player;
  points: GamePoint[];
}

export function PlayerBView({
  gameDetails,
  player,
  points,
}: PlayerBViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const { preferences } = useUserPreferences();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { playerLocation, locationError, locationAccuracy } =
    useGameContext(true, gameDetails.id, player.id);

  // Multiplayer locations
  const { playerLocations, loading: locationsLoading, error: locationsError, updateMyLocation } = useMultiplayerLocations(
    gameDetails.id,
    player.id
  );

  // Update own location
  useEffect(() => {
    if (playerLocation) {
      updateMyLocation(
        playerLocation.lat,
        playerLocation.lng,
        locationAccuracy ?? undefined
      );
    }
  }, [playerLocation, locationAccuracy, updateMyLocation]);

  // Watch for game completion
  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const setupSubscription = async () => {
      channel = supabase
        .channel(`game:${gameDetails.id}:status-b`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "games",
            filter: `id=eq.${gameDetails.id}`,
          },
          (payload) => {
            const newStatus = (payload.new as { status: string }).status;
            if (newStatus === "completed") {
              router.push(`/game/${gameDetails.id}/results`);
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
  }, [gameDetails.id, router, supabase]);

  const goalPoint = points.find((p) => p.type === "end");
  const visitedWaypoints = points.filter((p) => p.type === "clue" && p.status === "visited");

  // Get Player A's location
  const playerALocation = Array.from(playerLocations.values()).find(
    (loc) => loc.role === "player_a"
  );

  // Calculate distance from Player A to goal
  let distanceToGoal: string | undefined;
  if (playerALocation && goalPoint) {
    const distance = calculateDistance(
      { lat: playerALocation.latitude, lng: playerALocation.longitude },
      { lat: goalPoint.latitude, lng: goalPoint.longitude }
    );
    distanceToGoal = formatDistance(distance, preferences.distance_unit);
  }

  // Convert player locations to marker format
  const otherPlayerMarkers = Array.from(playerLocations.values())
    .filter((loc) => loc.playerId !== player.id)
    .map((loc) => ({
      id: loc.playerId,
      lat: loc.latitude,
      lng: loc.longitude,
      role: loc.role,
      label: getRoleInfo(loc.role).shortName,
    }));

  return (
    <>
      <div className="relative z-10 h-[6vh] flex justify-between items-center px-4 bg-surface-dark/40 backdrop-blur-md border-b border-white/5 shadow-lg">
        <TimeDisplay
          startedAt={new Date(gameDetails.started_at ?? "")}
          durationMinutes={gameDetails.duration}
        />
        <div className="flex items-center gap-3">
          {/* Role Badge */}
          <span className="text-xs bg-role-guide/20 text-role-guide-light px-2 py-1 rounded-full font-bold uppercase tracking-wide">
            Guide
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 text-white hover:bg-white/10 rounded-full transition-all"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            <Icon name={isMenuOpen ? "close" : "menu"} size="sm" />
          </Button>
        </div>
      </div>

      {/* Location Error Banner */}
      {locationError && (
        <div className="absolute top-[7vh] left-4 right-4 z-30 animate-fade-in">
          <GlassPanel className="bg-red-950/40 border-red-500/50 p-3 shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <Icon name="warning" size="sm" className="text-red-400" />
              <p className="text-sm text-red-100">{locationError}</p>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* Multiplayer Locations Error */}
      {locationsError && (
        <div className="absolute top-[7vh] left-4 right-4 z-30 animate-fade-in">
          <GlassPanel className="bg-orange-950/40 border-orange-500/50 p-3 shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <Icon name="group_off" size="sm" className="text-orange-400" />
              <p className="text-sm text-orange-100">{locationsError}</p>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* Multiplayer Locations Loading */}
      {locationsLoading && (
        <div className="absolute top-[7vh] right-4 z-30">
          <div className="bg-surface-dark/80 backdrop-blur-sm px-3 py-2 rounded-full flex items-center gap-2">
            <Icon name="progress_activity" size="sm" className="text-primary animate-spin" />
            <span className="text-xs text-gray-400">Syncing players...</span>
          </div>
        </div>
      )}

      <div className="flex-grow h-[94vh] relative">
        <GameMap
          bounds={gameDetails.bounding_box}
          playerLocation={playerLocation}
          showGoal={false} // Player B cannot see the goal - must guide using waypoint hints
          points={points}
          otherPlayers={otherPlayerMarkers}
          showAllWaypoints={true} // Player B sees all waypoints
        />

        {/* Info Panel */}
        {isMenuOpen && (
          <div className="absolute top-4 right-4 z-20 animate-slide-up">
            <GlassPanel className="p-4 w-72 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Icon name="info" className="text-primary" />
                Guide Dashboard
              </h3>

              {/* Player A Status */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Seeker Status</h4>
                {playerALocation ? (
                  <div className="bg-surface-dark-elevated p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-sm text-white">Online</span>
                    </div>
                    {distanceToGoal && (
                      <p className="text-xs text-gray-400">
                        Distance to goal: <span className="text-primary font-bold">{distanceToGoal}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-surface-dark-elevated p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-500" />
                      <span className="text-sm text-gray-400">Waiting for location...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Progress</h4>
                <div className="bg-surface-dark-elevated p-3 rounded-lg">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Waypoints</span>
                    <span className="text-white font-bold">
                      {visitedWaypoints.length} / {points.filter((p) => p.type === "clue").length}
                    </span>
                  </div>
                  <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{
                        width: `${
                          (visitedWaypoints.length /
                            Math.max(1, points.filter((p) => p.type === "clue").length)) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

            </GlassPanel>
          </div>
        )}
      </div>
    </>
  );
}

