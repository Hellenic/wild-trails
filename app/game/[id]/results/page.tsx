"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import type { Game, GamePoint } from "@/types/game";
import { calculateDistance } from "@/app/background/geo-utils";
import dynamic from "next/dynamic";

// Dynamically import map to avoid SSR issues
const ResultsMap = dynamic(() => import("./components/ResultsMap"), {
  ssr: false,
});

interface PlayerLocation {
  latitude: number | null;
  longitude: number | null;
  timestamp: string;
  accuracy: number | null;
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  const { user, loading: userLoading } = useUser();
  const supabase = createClient();

  const [game, setGame] = useState<Game | null>(null);
  const [points, setPoints] = useState<GamePoint[]>([]);
  const [playerPath, setPlayerPath] = useState<PlayerLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      // Fetch player location history
      const { data: locationsData, error: locationsError } = await supabase
        .from("player_locations")
        .select("latitude, longitude, timestamp, accuracy")
        .eq("game_id", gameId)
        .order("timestamp", { ascending: true });

      if (locationsError) throw locationsError;
      setPlayerPath((locationsData as PlayerLocation[]) || []);
    } catch (err) {
      console.error("Error fetching game data:", err);
      setError("Failed to load game results. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (!game || !points.length || !playerPath.length) {
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

    // Calculate distance traveled
    let totalDistance = 0;
    for (let i = 1; i < playerPath.length; i++) {
      const prev = playerPath[i - 1];
      const curr = playerPath[i];
      if (
        prev.latitude &&
        prev.longitude &&
        curr.latitude &&
        curr.longitude
      ) {
        totalDistance += calculateDistance(
          { lat: prev.latitude, lng: prev.longitude },
          { lat: curr.latitude, lng: curr.longitude }
        );
      }
    }

    // Count visited waypoints
    const visitedWaypoints = points.filter(
      (p) => p.type === "clue" && p.status === "visited"
    ).length;
    const totalWaypoints = points.filter((p) => p.type === "clue").length;

    // Calculate final accuracy
    const endPoint = points.find((p) => p.type === "end");
    const lastLocation = playerPath[playerPath.length - 1];
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
      distanceTraveled: totalDistance.toFixed(2),
      visitedWaypoints,
      totalWaypoints,
      finalAccuracy: Math.round(finalAccuracy),
    };
  };


  if (userLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-foreground">Loading results...</div>
      </main>
    );
  }

  if (error || !game) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error || "Game not found"}</div>
          <Link
            href="/games"
            className="inline-block px-6 py-3 bg-forest-pine text-forest-mist rounded-lg hover:bg-forest-moss transition-colors"
          >
            Back to My Games
          </Link>
        </div>
      </main>
    );
  }

  const stats = calculateStats();

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-forest-pine text-forest-mist p-6 shadow-md">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-serif font-bold mb-2">Game Complete!</h1>
          <h2 className="text-xl">{game.name}</h2>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Stats Summary */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-forest-deep mb-2">
                {stats.totalTime}
              </div>
              <div className="text-gray-600 text-sm">Total Time</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-forest-deep mb-2">
                {stats.distanceTraveled} km
              </div>
              <div className="text-gray-600 text-sm">Distance Traveled</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-forest-deep mb-2">
                {stats.visitedWaypoints}/{stats.totalWaypoints}
              </div>
              <div className="text-gray-600 text-sm">Waypoints Visited</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-forest-deep mb-2">
                {stats.finalAccuracy}m
              </div>
              <div className="text-gray-600 text-sm">Final Accuracy</div>
            </div>
          </div>
        )}

        {/* Map Visualization */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-serif font-bold text-forest-deep mb-4">
            Your Journey
          </h3>
          <div className="h-96 rounded-lg overflow-hidden border border-gray-300">
            <ResultsMap
              bounds={game.bounding_box}
              points={points}
              playerPath={playerPath.filter(
                (loc) => loc.latitude && loc.longitude
              )}
            />
          </div>
        </div>

        {/* Waypoints Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-serif font-bold text-forest-deep mb-4">
            Waypoints
          </h3>
          <div className="space-y-3">
            {points
              .filter((p) => p.type === "clue")
              .map((point, index) => (
                <div
                  key={point.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      point.status === "visited"
                        ? "bg-green-500 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      Waypoint {index + 1}
                    </div>
                    <div className="text-sm text-gray-600">
                      {point.status === "visited" ? "✓ Visited" : "○ Skipped"}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/game/create"
            className="px-6 py-3 bg-forest-pine text-forest-mist rounded-lg hover:bg-forest-moss transition-colors font-medium text-center"
          >
            🎮 Create New Game
          </Link>
          <Link
            href="/games"
            className="px-6 py-3 bg-forest-bark text-forest-mist rounded-lg hover:bg-forest-bark/80 transition-colors font-medium text-center"
          >
            📋 Back to My Games
          </Link>
          <Link
            href="/"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-center"
          >
            🏠 Home
          </Link>
        </div>
      </div>
    </main>
  );
}
