"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useMultiplayerLocations } from "@/hooks/useMultiplayerLocations";
import { useGameContext } from "@/app/game/components/GameContext";
import { gameAPI } from "@/lib/api/client";
import { TimeDisplay } from "./TimeDisplay";
import { GameMap } from "./GameMap";
import { createClient } from "@/lib/supabase/client";
import { calculateDistance } from "@/app/background/geo-utils";
import { formatDistance } from "@/lib/utils/distance";
import { Icon, Button, GlassPanel, useToast } from "@/app/components/ui";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { getRoleInfo, ROLE_INFO } from "@/lib/game/roles";
import type { GameDetails, Player, GamePoint } from "@/types/game";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface GameMasterMultiplayerViewProps {
  gameDetails: GameDetails;
  player: Player;
  points: GamePoint[];
  allPlayers: Player[];
}

export function GameMasterMultiplayerView({
  gameDetails,
  player,
  points,
  allPlayers,
}: GameMasterMultiplayerViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const { preferences } = useUserPreferences();
  const { showToast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(true); // Default open for GM
  const [endingGame, setEndingGame] = useState(false);
  const [showEndGameDialog, setShowEndGameDialog] = useState(false);
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
        .channel(`game:${gameDetails.id}:status-gm`)
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

  // Calculate distances
  let distanceToGoal: number | undefined;
  if (playerALocation && goalPoint) {
    distanceToGoal = calculateDistance(
      { lat: playerALocation.latitude, lng: playerALocation.longitude },
      { lat: goalPoint.latitude, lng: goalPoint.longitude }
    );
  }

  // End the game
  const handleEndGame = async () => {
    setShowEndGameDialog(false);
    setEndingGame(true);
    
    try {
      await gameAPI.end(gameDetails.id);
      // Redirect happens via realtime subscription when game status changes
    } catch (error) {
      console.error("Error ending game:", error);
      showToast("error", "Failed to end game. Please try again.");
      setEndingGame(false);
    }
  };

  // Convert player locations to marker format
  const allPlayerMarkers = Array.from(playerLocations.values()).map((loc) => ({
    id: loc.playerId,
    lat: loc.latitude,
    lng: loc.longitude,
    role: loc.role,
    label: getRoleInfo(loc.role).shortName,
  }));

  // Get Player B info for status display
  const playerBInfo = allPlayers.find((p) => p.role === "player_b");

  return (
    <>
      <div className="relative z-10 h-[6vh] flex justify-between items-center px-4 bg-role-gm-bg/60 backdrop-blur-md border-b border-role-gm/20 shadow-lg">
        <TimeDisplay
          startedAt={new Date(gameDetails.started_at ?? "")}
          durationMinutes={gameDetails.duration}
        />
        <div className="flex items-center gap-3">
          {/* Role Badge */}
          <span className="text-xs bg-role-gm/20 text-role-gm-light px-2 py-1 rounded-full font-bold uppercase tracking-wide">
            Game Master
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
        <div className="absolute top-[7vh] left-4 z-30">
          <div className="bg-role-gm-bg/80 backdrop-blur-sm px-3 py-2 rounded-full flex items-center gap-2">
            <Icon name="progress_activity" size="sm" className="text-role-gm-light animate-spin" />
            <span className="text-xs text-role-gm-light/70">Syncing players...</span>
          </div>
        </div>
      )}

      <div className="flex-grow h-[94vh] relative">
        <GameMap
          bounds={gameDetails.bounding_box}
          playerLocation={playerLocation}
          showGoal={true}
          points={points}
          otherPlayers={allPlayerMarkers.filter((m) => m.id !== player.id)}
          showAllWaypoints={true}
        />

        {/* GM Control Panel */}
        {isMenuOpen && (
          <div className="absolute top-4 right-4 z-20 animate-slide-up">
            <GlassPanel className="p-4 w-80 border border-role-gm/30 bg-role-gm-bg/90 backdrop-blur-xl shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Icon name="admin_panel_settings" className="text-role-gm-light" />
                Game Master Controls
              </h3>

              {/* Player Status */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Players</h4>
                <div className="space-y-2">
                  {/* Player A */}
                  <div className="bg-surface-dark-elevated p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Icon name={ROLE_INFO.player_a.icon} className="text-role-seeker-light" size="sm" />
                        <span className="text-sm text-white font-medium">
                          {ROLE_INFO.player_a.shortName}
                        </span>
                      </div>
                      {playerALocation ? (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          <span className="text-xs text-green-400">Online</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">Offline</span>
                      )}
                    </div>
                    {distanceToGoal !== undefined && (
                      <p className="text-xs text-gray-400">
                        To goal: <span className="text-primary font-bold">{formatDistance(distanceToGoal, preferences.distance_unit)}</span>
                      </p>
                    )}
                  </div>

                  {/* Player B */}
                  {playerBInfo && (
                    <div className="bg-surface-dark-elevated p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon name={ROLE_INFO.player_b.icon} className="text-role-guide-light" size="sm" />
                          <span className="text-sm text-white font-medium">
                            {ROLE_INFO.player_b.shortName}
                          </span>
                        </div>
                        {playerLocations.has(playerBInfo.id) ? (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-xs text-green-400">Online</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">Offline</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Game Progress</h4>
                <div className="bg-surface-dark-elevated p-3 rounded-lg">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Waypoints Found</span>
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

              {/* End Game */}
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => setShowEndGameDialog(true)}
                disabled={endingGame}
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                {endingGame ? (
                  <>
                    <Icon name="progress_activity" size="sm" className="mr-2 animate-spin" />
                    Ending...
                  </>
                ) : (
                  <>
                    <Icon name="stop" size="sm" className="mr-2" />
                    End Game
                  </>
                )}
              </Button>
            </GlassPanel>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showEndGameDialog}
        title="End Game?"
        message="Are you sure you want to end the game for all players? This action cannot be undone."
        confirmText="End Game"
        cancelText="Cancel"
        onConfirm={handleEndGame}
        onCancel={() => setShowEndGameDialog(false)}
        confirmColor="red"
      />
    </>
  );
}

