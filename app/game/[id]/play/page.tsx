"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePlayer } from "@/hooks/usePlayer";
import { useGameDetails } from "@/hooks/useGame";
import { usePoints, type GamePoint } from "@/hooks/usePoints";
import { useProximityEvents } from "@/hooks/useProximityEvents";
import { useGameContext } from "../../components/GameContext";
import { createClient } from "@/lib/supabase/client";
import { playWaypointFound, triggerHaptic } from "@/lib/audio/sounds";
import { Icon } from "@/app/components/ui/Icon";
import { Button } from "@/app/components/ui/Button";
import { GlassPanel } from "@/app/components/ui/GlassPanel";
import { PlayerAView } from "./components/PlayerAView";
import { PlayerBView } from "./components/PlayerBView";
import { GameMasterMultiplayerView } from "./components/GameMasterMultiplayerView";
import { getRolePermissions, type GameRole } from "@/lib/game/roles";
import type { Player } from "@/types/game";

type Params = {
  id: string;
};

export default function GameScreen() {
  const { id } = useParams<Params>();
  const router = useRouter();
  const supabase = createClient();
  const { player, loading: playerLoading } = usePlayer(id);
  const { gameDetails, loading: gameDetailsLoading } = useGameDetails(id);
  const { points, loading: pointsLoading, refetch: refetchPoints } = usePoints(id);
  const [goalFound, setGoalFound] = useState<GamePoint | null>(null);
  const [collectedHints, setCollectedHints] = useState<Array<{ pointId: string; hint: string; timestamp: string }>>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const { 
    sendLocalNotification, 
    latestProximityEvents, 
    clearProximityEvents 
  } = useGameContext(true, id, player?.id);

  // Track processed point IDs to avoid duplicate notifications
  // (both API-based and Realtime events may fire for the same point)
  const processedPointsRef = useRef<Set<string>>(new Set());

  // Fetch all players for multiplayer games
  useEffect(() => {
    if (!id) return;

    const fetchPlayers = async () => {
      const { data } = await supabase
        .from("players")
        .select("*")
        .eq("game_id", id);
      
      if (data) {
        setAllPlayers(data as Player[]);
      }
    };

    fetchPlayers();
  }, [id, supabase]);

  // Determine if this player should receive proximity alerts based on their role
  const playerRole = player?.role as GameRole | undefined;
  const shouldReceiveProximityAlerts = playerRole 
    ? getRolePermissions(playerRole).receivesProximityAlerts 
    : false;

  // Listen for server-side proximity events via Realtime (backup method)
  // This provides redundancy in case API-based events are missed
  useProximityEvents(id, {
    enabled: shouldReceiveProximityAlerts,
    onClueDiscovered: (point) => {
      // Skip if already processed (deduplication with API-based events)
      if (processedPointsRef.current.has(point.id)) {
        return;
      }
      processedPointsRef.current.add(point.id);

      // Play sound and haptic feedback
      playWaypointFound().catch(console.error);
      triggerHaptic([100, 50, 100]);
      
      // Add hint to collection
      if (point.hint) {
        setCollectedHints(prev => {
          // Avoid duplicates in state as well
          if (prev.some(h => h.pointId === point.id)) {
            return prev;
          }
          return [...prev, {
            pointId: point.id,
            hint: point.hint!,
            timestamp: new Date().toISOString()
          }];
        });
      }
      
      // Send notification
      if (Notification.permission === "granted") {
        sendLocalNotification("Waypoint discovered!", `Hint: ${point.hint}`);
      }
    },
    onGoalFound: (point) => {
      // Skip if already processed
      if (processedPointsRef.current.has(point.id)) {
        return;
      }
      processedPointsRef.current.add(point.id);
      setGoalFound(point);
    },
  });

  // Handle API-based proximity events (more reliable than Realtime on mobile)
  // This is the PRIMARY method for detecting waypoint discoveries
  useEffect(() => {
    if (!shouldReceiveProximityAlerts || latestProximityEvents.length === 0) {
      return;
    }

    let hasNewEvents = false;

    // Process each proximity event
    for (const event of latestProximityEvents) {
      // Skip if already processed (deduplication with Realtime events)
      if (processedPointsRef.current.has(event.point_id)) {
        continue;
      }
      processedPointsRef.current.add(event.point_id);
      hasNewEvents = true;

      // Play sound and haptic feedback
      playWaypointFound().catch(console.error);
      triggerHaptic([100, 50, 100]);
      
      if (event.point_type === "clue") {
        // Add hint to collection
        if (event.hint) {
          // eslint-disable-next-line
          setCollectedHints(prev => {
            // Avoid duplicates in state as well
            if (prev.some(h => h.pointId === event.point_id)) {
              return prev;
            }
            return [...prev, {
              pointId: event.point_id,
              hint: event.hint!,
              timestamp: new Date().toISOString()
            }];
          });
        }
        
        // Send notification
        if (Notification.permission === "granted") {
          sendLocalNotification("Waypoint discovered!", `Hint: ${event.hint || "No hint available"}`);
        }
      } else if (event.point_type === "end") {
        // Find the goal point from the points array
        const goalPoint = points.find(p => p.id === event.point_id);
        if (goalPoint) {
          setGoalFound(goalPoint);
        }
      }
    }

    // Only refetch points if we actually processed new events
    if (hasNewEvents) {
      refetchPoints();
    }
    
    // Clear events after processing
    clearProximityEvents();
  }, [latestProximityEvents, shouldReceiveProximityAlerts, points, sendLocalNotification, refetchPoints, clearProximityEvents]);

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

  // Handle completed or failed games
  if (gameDetails.status === "completed" || gameDetails.status === "failed") {
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
            <Icon 
              name={gameDetails.status === "completed" ? "flag" : "error"} 
              size="xl" 
              className={gameDetails.status === "completed" ? "text-primary mb-6" : "text-red-400 mb-6"} 
            />
            <h2 className="text-2xl font-black text-white mb-4 tracking-tight">
              {gameDetails.status === "completed" ? "Game Ended" : "Game Failed"}
            </h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              {gameDetails.status === "completed"
                ? gameDetails.gave_up
                  ? "This game was ended early. Check the results to see how far you got!"
                  : "This adventure has been completed. Check the results to see how you did!"
                : "This game failed to start properly. Please try creating a new game."}
            </p>
            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={() => router.push(gameDetails.status === "completed" ? `/game/${id}/results` : "/games")}
            >
              <Icon name={gameDetails.status === "completed" ? "emoji_events" : "list"} size="sm" className="mr-2" />
              {gameDetails.status === "completed" ? "View Results" : "My Games"}
            </Button>
          </GlassPanel>
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

  // Determine game mode and player composition
  const isMultiplayer = gameDetails.game_mode !== "single_player";
  
  // Check if Player B exists in the game
  // According to synopsis: Player A sees waypoints when solo OR with GM only (no Player B)
  const hasPlayerB = allPlayers.some(p => p.role === "player_b");

  // Player B view (multiplayer only)
  if (player.role === "player_b") {
    return (
      <main className="relative h-screen w-full dark:bg-background-dark bg-background-light flex flex-col overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-background-dark via-surface-dark to-background-dark" />
        </div>
        <PlayerBView
          gameDetails={gameDetails}
          player={player}
          points={points}
        />
      </main>
    );
  }

  // Game Master view (multiplayer only)
  if (player.role === "game_master") {
    return (
      <main className="relative h-screen w-full dark:bg-background-dark bg-background-light flex flex-col overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-surface-dark to-background-dark" />
        </div>
        <GameMasterMultiplayerView
          gameDetails={gameDetails}
          player={player}
          points={points}
          allPlayers={allPlayers}
        />
      </main>
    );
  }

  // Player A view (both single-player and multiplayer)
  return (
    <main className="relative h-screen w-full dark:bg-background-dark bg-background-light flex flex-col overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-background-dark via-surface-dark to-background-dark" />
        {!isMultiplayer && (
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2313ec13' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        )}
      </div>
      <PlayerAView
        gameDetails={gameDetails}
        player={player}
        points={points}
        collectedHints={collectedHints}
        goalFound={goalFound}
        showAllWaypoints={!hasPlayerB} // Player A sees waypoints when there's no Player B
      />
    </main>
  );
}
