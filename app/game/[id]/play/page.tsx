"use client";

import React, { useState, useEffect } from "react";
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
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-forest-deep">Loading...</div>
      </main>
    );
  }

  if (!player) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-forest-deep">
          You are not a player in this game.
        </div>
      </main>
    );
  }

  if (!gameDetails) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-forest-deep">Game not found.</div>
      </main>
    );
  }

  // Redirect to setup if game hasn't started yet
  if (gameDetails.status !== "active" || !gameDetails.started_at) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-forest-deep mb-4">
            <h2 className="text-2xl font-bold mb-2">Game Not Started</h2>
            <p className="text-forest-deep/70">
              {gameDetails.status === "setup" && gameDetails.game_master === "ai"
                ? "The AI is currently generating waypoints for your adventure. This usually takes a few moments."
                : "This game hasn't been started yet. Please wait for the game master to start the game."}
            </p>
          </div>
          <button
            onClick={() => router.push(`/game/${id}/setup`)}
            className="mt-4 px-6 py-2 bg-forest-pine text-forest-mist rounded-lg hover:bg-forest-deep transition-colors"
          >
            Go to Setup
          </button>
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
    <main className="relative h-screen w-full bg-background flex flex-col">
      <div className="h-[5vh] flex justify-between items-center px-4">
        <TimeDisplay
          startedAt={new Date(gameDetails.started_at ?? "")}
          durationMinutes={gameDetails.duration}
        />
        <button
          className="p-2 text-forest-deep hover:bg-forest-light/10 rounded-full transition-colors z-20"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          ☰
        </button>
      </div>

      {/* Location Error Banner */}
      {locationError && (
        <div className="absolute top-[5vh] left-0 right-0 z-30 px-4 py-2">
          <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded-lg shadow-lg flex items-start space-x-2">
            <span className="text-lg">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-medium">GPS Issue</p>
              <p className="text-xs mt-1">{locationError}</p>
              <p className="text-xs mt-2 font-medium">
                Try: Moving outside, clear view of sky, or check device location settings
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Low Accuracy Warning */}
      {!locationError && locationAccuracy && locationAccuracy > 50 && (
        <div className="absolute top-[5vh] left-0 right-0 z-30 px-4 py-2">
          <div className="bg-amber-100 border border-amber-400 text-amber-800 px-4 py-3 rounded-lg shadow-lg flex items-start space-x-2">
            <span className="text-lg">📍</span>
            <div className="flex-1">
              <p className="text-sm font-medium">Low GPS Accuracy</p>
              <p className="text-xs mt-1">
                Current accuracy: ±{Math.round(locationAccuracy)}m. Results may be imprecise.
              </p>
              <p className="text-xs mt-1 opacity-75">
                For best results, ensure clear view of the sky
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-grow h-[95vh]">
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
            visitedPoints={visitedWaypoints}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-sm">
            <div className="text-4xl mb-4">🏳️</div>
            <h3 className="text-xl font-bold text-forest-deep mb-2">
              Revealing Goal Location
            </h3>
            <p className="text-gray-600">
              The goal marker is now visible on the map. Redirecting to results...
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
