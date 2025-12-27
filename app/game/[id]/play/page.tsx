"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { gameAPI } from "@/lib/api/client";
import { usePlayer } from "@/hooks/usePlayer";
import { useGameDetails } from "@/hooks/useGame";
import { usePoints, type GamePoint } from "@/hooks/usePoints";
import { usePlayerLocation } from "@/hooks/usePlayerLocation";
import { useProximityEvents } from "@/hooks/useProximityEvents";
import { TimeDisplay } from "./components/TimeDisplay";
import { GoalFoundPopup } from "./components/GoalFoundPopup";
import { DrawerMenu } from "./components/DrawerMenu";
import { GameMap } from "./components/GameMap";
import { useGameContext } from "../../components/GameContext";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { createClient } from "@/lib/supabase/client";
import { playWaypointFound, triggerHaptic } from "@/lib/audio/sounds";
import { CompassOverlay } from "./components/CompassIndicator";
import { calculateDistance } from "@/app/background/geo-utils";
import { Icon } from "@/app/components/ui/Icon";
import { Button } from "@/app/components/ui/Button";
import { GlassPanel } from "@/app/components/ui/GlassPanel";

type Params = {
  id: string;
};

export default function GameScreen() {
  const { id } = useParams<Params>();
  const router = useRouter();
  const { player, loading: playerLoading } = usePlayer(id);
  const { gameDetails, loading: gameDetailsLoading } = useGameDetails(id);
  const { locations } = usePlayerLocation(id);
  const { points, loading: pointsLoading } = usePoints(id);
  const [goalFound, setGoalFound] = useState<GamePoint | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showGiveUpDialog, setShowGiveUpDialog] = useState(false);
  const [isGivingUp, setIsGivingUp] = useState(false);
  const [collectedHints, setCollectedHints] = useState<Array<{ pointId: string; hint: string; timestamp: string }>>([]);
  const { playerLocation, distanceTravelled, locationError, locationAccuracy, sendLocalNotification } =
    useGameContext(true, id, player?.id);
  const supabase = createClient();

  const distanceInKm = (distanceTravelled / 1000).toFixed(2);

  // Cheats, while developing the application
  const [showOwnLocation, setShowOwnLocation] = useState(false);
  const [showGoal, setShowGoal] = useState(false);

  const triggeringPoints = points.filter((p) => p.type !== "start");

  // Listen for server-side proximity events
  useProximityEvents(id, {
    onClueDiscovered: (point) => {
      // Play sound and haptic feedback
      playWaypointFound().catch(console.error);
      triggerHaptic([100, 50, 100]);
      
      // Add hint to collection
      if (point.hint) {
        setCollectedHints(prev => [...prev, {
          pointId: point.id,
          hint: point.hint!,
          timestamp: new Date().toISOString()
        }]);
      }
      
      // Send notification
      if (Notification.permission === "granted") {
        sendLocalNotification("Waypoint discovered!", `Hint: ${point.hint}`);
      }
    },
    onGoalFound: (point) => {
      setGoalFound(point);
      // Sound and haptic will be triggered by GoalFoundPopup
    },
  });

  const handleCompleteGame = async () => {
    try {
      await gameAPI.updateStatus(id, { status: "completed" });
      router.push(`/game/${id}/results`);
    } catch (error) {
      console.error("Error completing game:", error);
      alert("Failed to complete game. Please try again.");
    }
  };

  const handleGiveUp = async () => {
    try {
      setIsGivingUp(true);
      
      // Update game status to completed with gave_up flag
      const { error } = await supabase
        .from("games")
        .update({ 
          status: "completed",
          gave_up: true,
          ended_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;

      // Show the goal location
      setShowGoal(true);
      setShowGiveUpDialog(false);
      
      // Wait a moment for user to see the goal, then redirect
      setTimeout(() => {
        router.push(`/game/${id}/results`);
      }, 3000);
    } catch (error) {
      console.error("Error giving up game:", error);
      alert("Failed to end game. Please try again.");
      setIsGivingUp(false);
    }
  };

  if (playerLoading || gameDetailsLoading || pointsLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center dark:bg-background-dark bg-background-light">
        <div className="text-center">
          <div className="animate-pulse">
            <Icon name="terrain" size="xl" className="text-primary mb-4" />
            <div className="text-white">Loading game...</div>
          </div>
        </div>
      </main>
    );
  }

  if (!player) {
    return (
      <main className="min-h-screen flex items-center justify-center dark:bg-background-dark bg-background-light">
        <div className="text-center text-white">
          <Icon name="error" size="lg" className="text-red-400 mb-4" />
          <p>You are not a player in this game.</p>
        </div>
      </main>
    );
  }

  if (!gameDetails) {
    return (
      <main className="min-h-screen flex items-center justify-center dark:bg-background-dark bg-background-light">
        <div className="text-center text-white">
          <Icon name="search_off" size="lg" className="text-gray-400 mb-4" />
          <p>Game not found.</p>
        </div>
      </main>
    );
  }

  // Redirect to setup if game hasn't started yet
  if (gameDetails.status !== "active" || !gameDetails.started_at) {
    return (
      <main className="min-h-screen dark:bg-background-dark bg-background-light relative flex items-center justify-center">
        {/* Background Pattern */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-background-dark via-surface-dark to-background-dark opacity-95" />
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2313ec13' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative z-10 w-full max-w-md p-4">
          <GlassPanel className="p-8 text-center">
            <Icon name="hourglass_empty" size="xl" className="text-primary mb-6" />
            <h2 className="text-2xl font-black text-white mb-4 tracking-tight">Game Not Started</h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              {gameDetails.status === "setup" && gameDetails.game_master === "ai"
                ? "The AI is currently generating waypoints for your adventure. This usually takes a few moments."
                : "This game hasn't been started yet. Please wait for the game master to start the game."}
            </p>
            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={() => router.push(`/game/${id}/setup`)}
            >
              <Icon name="settings" size="sm" className="mr-2" />
              Go to Setup
            </Button>
          </GlassPanel>
        </div>
      </main>
    );
  }

  // TODO We should implement the other role screen here
  if (player.role !== "player_a") {
    console.warn("Only Player A screen has been implemented yet");
    console.log("Available locations", locations);
  }

  // Calculate estimated distance to goal based on hints
  const goalPoint = points.find(p => p.type === "end");
  let estimatedDistanceToGoal: string | undefined;
  if (playerLocation && goalPoint && collectedHints.length > 0) {
    const distance = calculateDistance(
      { lat: playerLocation.lat, lng: playerLocation.lng },
      { lat: goalPoint.latitude, lng: goalPoint.longitude }
    );
    const errorMargin = Math.max(0.5, distance * 0.2); // 20% error margin, min 500m
    estimatedDistanceToGoal = `${(distance - errorMargin).toFixed(1)} - ${(distance + errorMargin).toFixed(1)} km`;
  }

  const visitedWaypoints = points.filter(p => p.type === "clue" && p.status === "visited");

  const stats = {
    showOwnLocation,
    showGoal,
    pointsVisited: visitedWaypoints.length,
    totalPoints: triggeringPoints.length,
    distanceTraveled: `~ ${distanceInKm} km`,
    estimatedDistanceRemaining: estimatedDistanceToGoal,
  };

  return (
    <main className="relative h-screen w-full dark:bg-background-dark bg-background-light flex flex-col overflow-hidden">
      {/* Background Pattern (Subtle) */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-background-dark via-surface-dark to-background-dark" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2313ec13' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 h-[6vh] flex justify-between items-center px-4 bg-surface-dark/40 backdrop-blur-md border-b border-white/5 shadow-lg">
        <TimeDisplay
          startedAt={new Date(gameDetails.started_at ?? "")}
          durationMinutes={gameDetails.duration}
        />
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
                <p className="text-sm text-amber-100 mt-1 leading-relaxed font-medium">
                  Accuracy: ±{Math.round(locationAccuracy)}m. Results may be imprecise.
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
        />

        {/* Compass Overlay */}
        <CompassOverlay
          playerLocation={playerLocation}
          visitedPoints={visitedWaypoints.map((p, i) => ({
            id: p.id,
            latitude: p.latitude,
            longitude: p.longitude,
            label: `Waypoint ${i + 1}`
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
          <GoalFoundPopup
            content={goalFound.hint ?? ""}
            onClose={handleCompleteGame}
          />
        )}
      </div>

      {/* Give Up Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showGiveUpDialog}
        title="Give Up?"
        message="Are you sure you want to reveal the goal location? This will end the game and mark it as incomplete."
        confirmText="Reveal Goal"
        cancelText="Keep Playing"
        confirmColor="red"
        onConfirm={handleGiveUp}
        onCancel={() => setShowGiveUpDialog(false)}
      />

      {/* Giving Up Overlay */}
      {isGivingUp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <GlassPanel className="p-10 text-center max-w-sm mx-4">
            <Icon name="flag" size="xl" className="text-red-400 mb-6" />
            <h3 className="text-2xl font-black text-white mb-4 tracking-tight">
              Revealing Goal
            </h3>
            <p className="text-gray-400 leading-relaxed">
              The goal marker is now visible on the map. Redirecting to results...
            </p>
            <div className="mt-8 flex justify-center">
              <Icon name="progress_activity" size="md" className="text-primary animate-spin" />
            </div>
          </GlassPanel>
        </div>
      )}
    </main>
  );
}
