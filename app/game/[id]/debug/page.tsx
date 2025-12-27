"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { usePlayer } from "@/hooks/usePlayer";
import { useGameDetails } from "@/hooks/useGame";
import { GameMasterMap } from "../setup/components/GameMasterMap";
import type { Tables } from "@/types/database.types";

type GamePoint = Tables<"game_points">;

type Params = {
  id: string;
};

const useDebugGamePoints = (id: string) => {
  const [points, setPoints] = useState<GamePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/game/${id}/debug/generate-points`);
        if (!response.ok) {
          throw new Error("Failed to fetch points");
        }
        const data = await response.json();
        setPoints(
          data.points
            .map((point: GamePoint) => ({
              ...point,
              id: crypto.randomUUID(),
              position: [point.latitude, point.longitude],
            }))
            .sort((a: GamePoint, b: GamePoint) => {
              if (a.type === "end") return 1;
              if (b.type === "end") return -1;
              return 0;
            })
        );
      } catch (error) {
        console.error(error);
        setError(error instanceof Error ? error : new Error("Unknown error"));
        setPoints([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPoints();
  }, [id]);

  return { points, loading, error };
};

export default function DebugPage() {
  const { id } = useParams<Params>();
  const { player, loading: playerLoading } = usePlayer(id);
  const { gameDetails, loading: gameDetailsLoading } = useGameDetails(id);
  const { points, loading: pointsLoading } = useDebugGamePoints(id);

  if (playerLoading || gameDetailsLoading || pointsLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center dark:bg-background-dark bg-background-light">
        <div className="text-center text-white">Loading...</div>
      </main>
    );
  }

  if (!player) {
    return (
      <main className="min-h-screen flex items-center justify-center dark:bg-background-dark bg-background-light">
        <div className="text-center text-white">
          You are not player in this game.
        </div>
      </main>
    );
  }

  if (!gameDetails) {
    return (
      <main className="min-h-screen flex items-center justify-center dark:bg-background-dark bg-background-light">
        <div className="text-center text-white">Game not found</div>
      </main>
    );
  }

  const desiredStartingPoint = gameDetails.starting_point
    ? ([gameDetails.starting_point.lat, gameDetails.starting_point.lng] as [
        number,
        number,
      ])
    : undefined;

  return (
    <main className="min-h-screen dark:bg-background-dark bg-background-light">
      <div className="h-[800px] relative">
        <GameMasterMap
          desiredStartingPoint={desiredStartingPoint}
          desiredMaxRadius={gameDetails.max_radius}
          bounds={gameDetails.bounding_box}
          markers={points.map((point) => ({
            id: point.id,
            type: point.type,
            position: [point.latitude, point.longitude],
            hint: point.hint ?? "",
          }))}
        />
      </div>
      <pre>{JSON.stringify(points, null, 2)}</pre>
    </main>
  );
}
