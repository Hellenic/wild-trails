"use client";

import React, { useState, useEffect } from "react";
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
import { createClient } from "@/lib/supabase/client";
import { playWaypointFound, triggerHaptic } from "@/lib/audio/sounds";
import { calculateDistance } from "@/app/background/geo-utils";
import { formatDistance, formatDistanceFromMeters } from "@/lib/utils/distance";
import { Icon, Button, GlassPanel } from "@/app/components/ui";
import { getRoleInfo } from "@/lib/game/roles";
import type { GameDetails, Player, GamePoint } from "@/types/game";

interface PlayerAViewProps {
  gameDetails: GameDetails;
  player: Player;
  points: GamePoint[];
  collectedHints: Array<{ pointId: string; hint: string; timestamp: string }>;
  onClueDiscovered: (point: GamePoint) => void;
  goalFound: GamePoint | null;
}

export function PlayerAView({
  gameDetails,
  player,
  points,
  collectedHints,
  onClueDiscovered,
  goalFound,
}: PlayerAViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const { preferences } = useUserPreferences();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showGiveUpDialog, setShowGiveUpDialog] = useState(false);
  const [isGivingUp, setIsGivingUp] = useState(false);
  const { playerLocation, distanceTravelled, locationError, locationAccuracy, sendLocalNotification } =
    useGameContext(true, gameDetails.id, player.id);

  // Multiplayer locations
  const { playerLocations, updateMyLocation } = useMultiplayerLocations(
    gameDetails.id,
    player.id
  );

  // Cheats for development
  const [showOwnLocation, setShowOwnLocation] = useState(false);
  const [showGoal, setShowGoal] = useState(false);

  // Update own location for other players to see
  useEffect(() => {
    if (playerLocation) {
      updateMyLocation(
        playerLocation.lat,
        playerLocation.lng,
        locationAccuracy ?? undefined
      );
    }
  }, [playerLocation, locationAccuracy, updateMyLocation]);

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
      setIsGivingUp(true);
      const { error } = await supabase
        .from("games")
        .update({
          status: "completed",
          gave_up: true,
          ended_at: new Date().toISOString(),
        })
        .eq("id", gameDetails.id);

      if (error) throw error;
      setShowGoal(true);
      setShowGiveUpDialog(false);
      setTimeout(() => {
        router.push(`/game/${gameDetails.id}/results`);
      }, 3000);
    } catch (error) {
      console.error("Error giving up game:", error);
      alert("Failed to end game. Please try again.");
      setIsGivingUp(false);
    }
  };

  // Convert player locations to marker format for the map
  const otherPlayerMarkers = Array.from(playerLocations.values())
    .filter((loc) => loc.playerId !== player.id)
    .map((loc) => ({
      id: loc.playerId,
      lat: loc.latitude,
      lng: loc.longitude,
      role: loc.role,
      label: getRoleInfo(loc.role).shortName,
    }));

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
                  Accuracy: ±{Math.round(locationAccuracy)}m
                </p>
              </div>
            </div>
          </GlassPanel>
        </div>
      )}

      <div className="flex-grow h-[94vh] relative">
        <GameMap
          bounds={gameDetails.bounding_box}
          playerLocation={showOwnLocation ? playerLocation : null}
          showGoal={showGoal}
          points={points}
          otherPlayers={otherPlayerMarkers}
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
            <p className="text-gray-400">Redirecting to results...</p>
            <div className="mt-8 flex justify-center">
              <Icon name="progress_activity" size="md" className="text-primary animate-spin" />
            </div>
          </GlassPanel>
        </div>
      )}
    </>
  );
}

