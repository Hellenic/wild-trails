"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { gameAPI } from "@/lib/api/client";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useMultiplayerLocations } from "@/hooks/useMultiplayerLocations";
import { useGameContext } from "@/app/game/components/GameContext";
import { TimeDisplay } from "./TimeDisplay";
import { GoalFoundPopup } from "./GoalFoundPopup";
import { DrawerMenu } from "./DrawerMenu";
import { GameMap } from "./GameMap";
import { CompassOverlay } from "./CompassIndicator";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { calculateDistance } from "@/app/background/geo-utils";
import { formatDistance, formatDistanceFromMeters } from "@/lib/utils/distance";
import { Icon, Button, GlassPanel } from "@/app/components/ui";
import { createClient } from "@/lib/supabase/client";
import { getRoleInfo } from "@/lib/game/roles";
import type { GameDetails, Player, GamePoint } from "@/types/game";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface PlayerAViewProps {
  gameDetails: GameDetails;
  player: Player;
  points: GamePoint[];
  collectedHints: Array<{ pointId: string; hint: string; timestamp: string }>;
  goalFound: GamePoint | null;
  /** Show all waypoints on map (true for single-player, false for multiplayer) */
  showAllWaypoints?: boolean;
}

export function PlayerAView({
  gameDetails,
  player,
  points,
  collectedHints,
  goalFound,
  showAllWaypoints = false,
}: PlayerAViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const { preferences } = useUserPreferences();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showGiveUpDialog, setShowGiveUpDialog] = useState(false);
  const [isGivingUp, setIsGivingUp] = useState(false);
  // Ref to track give-up state for use in realtime subscription callback
  // (avoids stale closure issues with useState)
  const isGivingUpRef = useRef(false);
  const { playerLocation, distanceTravelled, locationError, locationAccuracy } =
    useGameContext(true, gameDetails.id, player.id);

  // Determine if this is a multiplayer game
  const isMultiplayer = gameDetails.game_mode !== "single_player";

  // Multiplayer locations (only used in multiplayer mode)
  const { 
    playerLocations, 
    loading: locationsLoading, 
    error: locationsError, 
    updateMyLocation 
  } = useMultiplayerLocations(
    gameDetails.id,
    player.id
  );

  // Cheats for development
  const [showOwnLocation, setShowOwnLocation] = useState(false);
  const [showGoal, setShowGoal] = useState(false);

  // Update own location for other players to see (multiplayer only)
  useEffect(() => {
    if (isMultiplayer && playerLocation) {
      updateMyLocation(
        playerLocation.lat,
        playerLocation.lng,
        locationAccuracy ?? undefined
      );
    }
  }, [isMultiplayer, playerLocation, locationAccuracy, updateMyLocation]);

  // Watch for game completion (e.g., GM or another player ends the game)
  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const setupSubscription = async () => {
      channel = supabase
        .channel(`game:${gameDetails.id}:status-a`)
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
              // If player is in the process of giving up, don't redirect immediately
              // The handleGiveUp function will handle the redirect after showing the goal
              if (isGivingUpRef.current) {
                return;
              }
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

  const triggeringPoints = points.filter((p) => p.type !== "start");
  const visitedWaypoints = points.filter((p) => p.type === "clue" && p.status === "visited");
  const goalPoint = points.find((p) => p.type === "end");

  // Calculate estimated distance to goal
  let estimatedDistanceToGoal: string | undefined;
  if (playerLocation && goalPoint && collectedHints.length > 0) {
    const distance = calculateDistance(
      { lat: playerLocation.lat, lng: playerLocation.lng },
      { lat: goalPoint.latitude, lng: goalPoint.longitude }
    );
    const errorMargin = Math.max(0.5, distance * 0.2);
    const minDist = formatDistance(distance - errorMargin, preferences.distance_unit);
    const maxDist = formatDistance(distance + errorMargin, preferences.distance_unit);
    estimatedDistanceToGoal = `${minDist} - ${maxDist}`;
  }

  const handleCompleteGame = async () => {
    try {
      await gameAPI.updateStatus(gameDetails.id, { status: "completed" });
      router.push(`/game/${gameDetails.id}/results`);
    } catch (error) {
      console.error("Error completing game:", error);
      alert("Failed to complete game. Please try again.");
    }
  };

  const handleGiveUp = async () => {
    try {
      // Set ref before API call to prevent realtime subscription from redirecting
      isGivingUpRef.current = true;
      setIsGivingUp(true);
      await gameAPI.end(gameDetails.id, { gaveUp: true });
      setShowGoal(true);
      setShowGiveUpDialog(false);
      setTimeout(() => {
        router.push(`/game/${gameDetails.id}/results`);
      }, 3000);
    } catch (error) {
      console.error("Error giving up game:", error);
      alert("Failed to end game. Please try again.");
      isGivingUpRef.current = false;
      setIsGivingUp(false);
    }
  };

  // Convert player locations to marker format for the map (multiplayer only)
  const otherPlayerMarkers = isMultiplayer
    ? Array.from(playerLocations.values())
        .filter((loc) => loc.playerId !== player.id)
        .map((loc) => ({
          id: loc.playerId,
          lat: loc.latitude,
          lng: loc.longitude,
          role: loc.role,
          label: getRoleInfo(loc.role).shortName,
        }))
    : [];

  const stats = {
    showOwnLocation,
    showGoal,
    pointsVisited: visitedWaypoints.length,
    totalPoints: triggeringPoints.length,
    distanceTraveled: `~ ${formatDistanceFromMeters(distanceTravelled, preferences.distance_unit)}`,
    estimatedDistanceRemaining: estimatedDistanceToGoal,
  };

  return (
    <>
      <div className="relative z-10 h-[6vh] flex justify-between items-center px-4 bg-surface-dark/40 backdrop-blur-md border-b border-white/5 shadow-lg">
        <TimeDisplay
          startedAt={new Date(gameDetails.started_at ?? "")}
          durationMinutes={gameDetails.duration}
        />
        <div className="flex items-center gap-2">
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
          <GlassPanel className="bg-red-950/40 border-red-500/50 p-4 shadow-xl backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="bg-red-500/20 p-2 rounded-lg">
                <Icon name="warning" size="sm" className="text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-white uppercase tracking-wider">GPS Issue</p>
                <p className="text-sm text-red-100 mt-1 leading-relaxed font-medium">{locationError}</p>
                <p className="text-[10px] mt-2 font-black text-red-400 uppercase tracking-widest bg-red-500/10 inline-block px-2 py-0.5 rounded">
                  Try: Moving outside, clear view of sky
                </p>
              </div>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* Low Accuracy Warning */}
      {!locationError && locationAccuracy && locationAccuracy > 50 && (
        <div className="absolute top-[7vh] left-4 right-4 z-30 animate-fade-in">
          <GlassPanel className="bg-amber-950/40 border-amber-500/50 p-4 shadow-xl backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="bg-amber-500/20 p-2 rounded-lg">
                <Icon name="location_searching" size="sm" className="text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-white uppercase tracking-wider">Low GPS Accuracy</p>
                <p className="text-sm text-amber-100 mt-1 font-medium">
                  Accuracy: ±{Math.round(locationAccuracy)}m. Results may be imprecise.
                </p>
              </div>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* Multiplayer Locations Error */}
      {isMultiplayer && locationsError && (
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
      {isMultiplayer && locationsLoading && (
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
          playerLocation={showOwnLocation ? playerLocation : null}
          showGoal={showGoal}
          points={points}
          otherPlayers={otherPlayerMarkers}
          showAllWaypoints={showAllWaypoints}
        />

        <CompassOverlay
          playerLocation={playerLocation}
          visitedPoints={visitedWaypoints.map((p, i) => ({
            id: p.id,
            latitude: p.latitude,
            longitude: p.longitude,
            label: `Waypoint ${i + 1}`,
          }))}
          goalLocation={showGoal && goalPoint ? { lat: goalPoint.latitude, lng: goalPoint.longitude } : null}
        />

        {isMenuOpen && (
          <DrawerMenu
            stats={stats}
            onShowOwnLocation={() => setShowOwnLocation(!showOwnLocation)}
            onShowGoal={() => setShowGoal(!showGoal)}
            onGiveUp={() => setShowGiveUpDialog(true)}
            hints={collectedHints}
          />
        )}

        {goalFound && (
          <GoalFoundPopup content={goalFound.hint ?? ""} onClose={handleCompleteGame} />
        )}
      </div>

      <ConfirmDialog
        isOpen={showGiveUpDialog}
        title="Give Up?"
        message="Are you sure you want to reveal the goal location? This will end the game."
        confirmText="Reveal Goal"
        cancelText="Keep Playing"
        confirmColor="red"
        onConfirm={handleGiveUp}
        onCancel={() => setShowGiveUpDialog(false)}
      />

      {isGivingUp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <GlassPanel className="p-10 text-center max-w-sm mx-4">
            <Icon name="flag" size="xl" className="text-red-400 mb-6" />
            <h3 className="text-2xl font-black text-white mb-4">Revealing Goal</h3>
            <p className="text-gray-400">The goal marker is now visible. Redirecting to results...</p>
            <div className="mt-8 flex justify-center">
              <Icon name="progress_activity" size="md" className="text-primary animate-spin" />
            </div>
          </GlassPanel>
        </div>
      )}
    </>
  );
}
