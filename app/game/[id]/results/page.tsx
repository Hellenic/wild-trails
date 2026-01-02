"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import type { Game, GamePoint, Player } from "@/types/game";
import { calculateDistance } from "@/app/background/geo-utils";
import { getJourneyComparison, getNatureFact, getEncouragingMessage } from "@/lib/game/fun-facts";
import { formatDistance, formatDistanceFromMeters } from "@/lib/utils/distance";
import { Icon } from "@/app/components/ui/Icon";
import { GlassPanel } from "@/app/components/ui/GlassPanel";
import { Button } from "@/app/components/ui/Button";
import { getRoleInfo, type GameRole } from "@/lib/game/roles";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

// Dynamically import map to avoid SSR issues
const ResultsMap = dynamic(() => import("./components/ResultsMap"), {
  ssr: false,
});

interface PlayerLocation {
  player_id: string;
  latitude: number | null;
  longitude: number | null;
  timestamp: string;
  accuracy: number | null;
}

interface PlayerWithStats extends Player {
  locations: PlayerLocation[];
  distanceTraveled: number;
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  const { user, loading: userLoading } = useUser();
  const { preferences } = useUserPreferences();
  const supabase = createClient();

  const [game, setGame] = useState<Game | null>(null);
  const [points, setPoints] = useState<GamePoint[]>([]);
  const [players, setPlayers] = useState<PlayerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMultiplayer = game?.game_mode !== "single_player";

  useEffect(() => {
    if (!userLoading && user && gameId) {
      fetchGameData();
    } else if (!userLoading && !user) {
      router.push("/login");
    }
  }, [user, userLoading, gameId, router]);

  const fetchGameData = async () => {
    try {
      setLoading(true);

      // Fetch game details
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (gameError) throw gameError;
      if (!gameData) throw new Error("Game not found");

      setGame(gameData as Game);

      // Fetch points
      const { data: pointsData, error: pointsError } = await supabase
        .from("game_points")
        .select("*")
        .eq("game_id", gameId)
        .order("sequence_number", { ascending: true });

      if (pointsError) throw pointsError;
      setPoints((pointsData as GamePoint[]) || []);

      // Fetch all players
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("*")
        .eq("game_id", gameId);

      if (playersError) throw playersError;

      // Fetch player location history
      const { data: locationsData, error: locationsError } = await supabase
        .from("player_locations")
        .select("player_id, latitude, longitude, timestamp, accuracy")
        .eq("game_id", gameId)
        .order("timestamp", { ascending: true });

      if (locationsError) throw locationsError;
      
      const allLocations = (locationsData as PlayerLocation[]) || [];

      // Calculate stats for each player
      const playersWithStats: PlayerWithStats[] = (playersData || []).map((player) => {
        const playerLocations = allLocations.filter((loc) => loc.player_id === player.id);
        let distanceTraveled = 0;
        
        for (let i = 1; i < playerLocations.length; i++) {
          const prev = playerLocations[i - 1];
          const curr = playerLocations[i];
          if (prev.latitude && prev.longitude && curr.latitude && curr.longitude) {
            distanceTraveled += calculateDistance(
              { lat: prev.latitude, lng: prev.longitude },
              { lat: curr.latitude, lng: curr.longitude }
            );
          }
        }

        return {
          ...player,
          locations: playerLocations,
          distanceTraveled,
        };
      });

      setPlayers(playersWithStats);
    } catch (err) {
      console.error("Error fetching game data:", err);
      setError("Failed to load game results. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (!game || !points.length || !players.length) {
      return null;
    }

    // Calculate total time
    const startTime = new Date(game.started_at || game.created_at);
    const endTime = new Date(game.ended_at || new Date());
    const totalMinutes = Math.floor(
      (endTime.getTime() - startTime.getTime()) / 60000
    );
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // Calculate total distance traveled (sum of individual player distances)
    const totalDistance = players.reduce((sum, player) => sum + player.distanceTraveled, 0);

    // Count visited waypoints
    const visitedWaypoints = points.filter(
      (p) => p.type === "clue" && p.status === "visited"
    ).length;
    const totalWaypoints = points.filter((p) => p.type === "clue").length;

    // Calculate final accuracy (use Seeker/Player A's last location)
    const endPoint = points.find((p) => p.type === "end");
    const seekerPlayer = players.find((p) => p.role === "player_a");
    const seekerLocations = seekerPlayer?.locations || [];
    const lastLocation = seekerLocations[seekerLocations.length - 1];
    let finalAccuracy = 0;
    if (
      endPoint &&
      lastLocation?.latitude &&
      lastLocation?.longitude
    ) {
      finalAccuracy =
        calculateDistance(
          { lat: endPoint.latitude, lng: endPoint.longitude },
          { lat: lastLocation.latitude, lng: lastLocation.longitude }
        ) * 1000; // Convert to meters
    }

    return {
      totalTime: `${hours}h ${minutes}m`,
      distanceTraveled: formatDistance(totalDistance, preferences.distance_unit),
      visitedWaypoints,
      totalWaypoints,
      finalAccuracy: Math.round(finalAccuracy),
      funFacts: {
        journey: getJourneyComparison(totalDistance, totalMinutes, visitedWaypoints),
        nature: getNatureFact(game.difficulty),
        encouragement: getEncouragingMessage(visitedWaypoints, totalWaypoints, game.gave_up || false),
      },
    };
  };


  if (userLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center dark:bg-background-dark bg-background-light">
        <div className="text-center text-white">Loading results...</div>
      </main>
    );
  }

  if (error || !game) {
    return (
      <main className="min-h-screen flex items-center justify-center dark:bg-background-dark bg-background-light">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error || "Game not found"}</div>
          <Link href="/games">
            <Button variant="primary" size="lg">
              Back to My Games
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  const stats = calculateStats();

  return (
    <main className="min-h-screen dark:bg-background-dark bg-background-light relative">
      {/* Background pattern */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
      </div>

      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="mb-6">
              <Icon name="emoji_events" size="xl" className="text-primary animate-bounce" />
            </div>
            <h1 className="text-4xl font-black text-white mb-2 font-display">
              Game Complete!
            </h1>
            <h2 className="text-xl text-gray-300 font-body">{game.name}</h2>
          </div>

          {/* Stats Summary */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-in-up">
              <GlassPanel className="p-6 text-center">
                <div className="text-3xl font-black text-white mb-2">
                  {stats.totalTime}
                </div>
                <div className="text-gray-400 text-sm font-body uppercase tracking-wider">Total Time</div>
              </GlassPanel>
              <GlassPanel className="p-6 text-center">
                <div className="text-3xl font-black text-white mb-2">
                  {stats.distanceTraveled}
                </div>
                <div className="text-gray-400 text-sm font-body uppercase tracking-wider">Distance Traveled</div>
              </GlassPanel>
              <GlassPanel className="p-6 text-center">
                <div className="text-3xl font-black text-white mb-2">
                  {stats.visitedWaypoints}/{stats.totalWaypoints}
                </div>
                <div className="text-gray-400 text-sm font-body uppercase tracking-wider">Waypoints Visited</div>
              </GlassPanel>
              <GlassPanel className="p-6 text-center">
                <div className="text-3xl font-black text-white mb-2">
                  {formatDistanceFromMeters(stats.finalAccuracy, preferences.distance_unit, 0)}
                </div>
                <div className="text-gray-400 text-sm font-body uppercase tracking-wider">Final Accuracy</div>
              </GlassPanel>
            </div>
          )}

        {/* Fun Facts Section */}
        {stats && stats.funFacts && (
          <div className="mb-8 animate-fade-in-up">
            <GlassPanel className="p-6 md:p-8">
              <div className="flex items-center gap-2 mb-6">
                <Icon name="lightbulb" size="sm" className="text-primary" />
                <h3 className="text-xl font-black text-white font-display">
                  Did You Know?
                </h3>
              </div>
              
              <div className="space-y-4">
                {/* Journey Comparison */}
                <div className="flex items-start gap-3 p-4 bg-surface-dark-elevated rounded-2xl border border-white/10">
                  <Icon name="straighten" size="sm" className="text-primary mt-1 flex-shrink-0" />
                  <p className="text-gray-200 font-body leading-relaxed">
                    {stats.funFacts.journey}
                  </p>
                </div>

                {/* Nature Fact */}
                <div className="flex items-start gap-3 p-4 bg-surface-dark-elevated rounded-2xl border border-white/10">
                  <Icon name="pets" size="sm" className="text-primary mt-1 flex-shrink-0" />
                  <p className="text-gray-200 font-body leading-relaxed">
                    {stats.funFacts.nature}
                  </p>
                </div>

                {/* Encouragement */}
                <div className="flex items-start gap-3 p-4 bg-primary/10 rounded-2xl border border-primary/30">
                  <Icon name="stars" size="sm" className="text-primary mt-1 flex-shrink-0" />
                  <p className="text-primary font-body font-medium leading-relaxed">
                    {stats.funFacts.encouragement}
                  </p>
                </div>
              </div>
            </GlassPanel>
          </div>
        )}

        {/* Map Visualization */}
        <GlassPanel className="p-6 md:p-8 mb-8">
          <h3 className="text-xl font-black text-white mb-4 font-display flex items-center gap-2">
            <Icon name="map" size="sm" className="text-primary" />
            Your Journey
          </h3>
          <div className="h-96 rounded-2xl overflow-hidden border border-white/10">
            <ResultsMap
              bounds={game.bounding_box}
              points={points}
              playerPaths={players.map((player) => {
                const roleInfo = getRoleInfo(player.role as GameRole);
                return {
                  playerId: player.id,
                  color: roleInfo.hexColor || "#3b82f6",
                  locations: player.locations.filter(
                    (loc) => loc.latitude && loc.longitude
                  ),
                };
              })}
            />
          </div>
        </GlassPanel>

        {/* Multiplayer Team Stats */}
        {isMultiplayer && players.length > 1 && (
          <GlassPanel className="p-6 md:p-8 mb-8">
            <h3 className="text-xl font-black text-white mb-4 font-display flex items-center gap-2">
              <Icon name="groups" size="sm" className="text-primary" />
              Team Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map((player) => {
                const roleInfo = getRoleInfo(player.role as GameRole);
                return (
                  <div
                    key={player.id}
                    className={cn(
                      "p-4 rounded-2xl border border-white/10 bg-surface-dark-elevated",
                      player.user_id === user?.id && "ring-2 ring-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        "bg-surface-dark border-2 border-white/10"
                      )}>
                        <Icon name={roleInfo.icon} className={roleInfo.color} />
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          {roleInfo.shortName}
                          {player.user_id === user?.id && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {roleInfo.name}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Distance</span>
                        <span className="text-white font-medium">
                          {formatDistance(player.distanceTraveled, preferences.distance_unit)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Locations</span>
                        <span className="text-white font-medium">
                          {player.locations.length} points
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassPanel>
        )}

        {/* Waypoints Summary */}
        <GlassPanel className="p-6 md:p-8 mb-8">
          <h3 className="text-xl font-black text-white mb-4 font-display flex items-center gap-2">
            <Icon name="location_on" size="sm" className="text-primary" />
            Waypoints
          </h3>
          <div className="space-y-3">
            {points
              .filter((p) => p.type === "clue")
              .map((point, index) => (
                <div
                  key={point.id}
                  className="flex items-center gap-4 p-4 bg-surface-dark-elevated rounded-2xl border border-white/10 hover:border-primary/30 transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${
                      point.status === "visited"
                        ? "bg-primary text-background-dark shadow-lg shadow-primary/20"
                        : "bg-white/10 text-gray-400"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-white font-body">
                      Waypoint {index + 1}
                    </div>
                    <div className="text-sm text-gray-400 flex items-center gap-1">
                      {point.status === "visited" ? (
                        <>
                          <Icon name="check_circle" size="sm" className="text-primary" />
                          <span>Visited</span>
                        </>
                      ) : (
                        <>
                          <Icon name="cancel" size="sm" className="text-gray-500" />
                          <span>Skipped</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </GlassPanel>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
          {isMultiplayer && (
            <Button variant="primary" size="lg" fullWidth className="sm:w-auto" disabled title="Coming soon">
              <Icon name="replay" size="sm" className="mr-2" />
              Play Again with Team
            </Button>
          )}
          <Link href="/game/create">
            <Button variant={isMultiplayer ? "secondary" : "primary"} size="lg" fullWidth className="sm:w-auto">
              <Icon name="add_location" size="sm" className="mr-2" />
              Create New Game
            </Button>
          </Link>
          <Link href="/games">
            <Button variant="secondary" size="lg" fullWidth className="sm:w-auto">
              <Icon name="list" size="sm" className="mr-2" />
              Back to My Games
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="lg" fullWidth className="sm:w-auto">
              <Icon name="home" size="sm" className="mr-2" />
              Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
    </main>
  );
}
