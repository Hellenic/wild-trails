"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TimeDisplay } from "./components/TimeDisplay";
import { GoalFoundPopup } from "./components/GoalFoundPopup";
import { DrawerMenu } from "./components/DrawerMenu";
import { usePlayer } from "@/hooks/usePlayer";
import { useGameDetails } from "@/hooks/useGame";
import { usePoints, type GamePoint } from "@/hooks/usePoints";
import { useProximityCheck } from "@/hooks/useProximityCheck";
import { GameMap } from "./components/GameMap";
import { updateGameStatus } from "@/app/actions/games";
import { useGameContext } from "../../components/GameContext";

type Params = {
  id: string;
};

export default function GameScreen() {
  const { id } = useParams<Params>();
  const router = useRouter();
  const { player, loading: playerLoading } = usePlayer(id);
  const { gameDetails, loading: gameDetailsLoading } = useGameDetails(id);
  const { points, loading: pointsLoading } = usePoints(id);
  const [goalFound, setGoalFound] = useState<GamePoint | null>(null);
  const [visitedPoints, setVisitedPoints] = useState<string[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { playerLocation, sendLocalNotification } = useGameContext(true);

  // Cheats, while developing the application
  const [showOwnLocation, setShowOwnLocation] = useState(false);
  const [showGoal, setShowGoal] = useState(false);

  const triggeringPoints = points.filter((p) => p.type !== "start");

  useProximityCheck({
    playerLocation,
    points: triggeringPoints,
    onPointReached: (point) => {
      setVisitedPoints([...visitedPoints, point.id]);

      if (Notification.permission === "granted" && point.type === "clue") {
        sendLocalNotification("Point discovered!", `Hint: ${point.hint}`);
      }

      if (point.type === "end") {
        setGoalFound(point);
      }
    },
  });

  const handleCompleteGame = async () => {
    await updateGameStatus(id, "completed");
    router.push("/");
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

  // TODO We should implement the other role screen here
  if (player.role !== "player_a") {
    console.warn("Only Player A screen has been implemented yet");
  }

  const stats = {
    showOwnLocation,
    showGoal,
    pointsVisited: visitedPoints.length,
    totalPoints: triggeringPoints.length,
    distanceTraveled: "-- km",
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

      <div className="flex-grow h-[95vh]">
        <GameMap
          bounds={gameDetails.bounding_box}
          playerLocation={showOwnLocation ? playerLocation : null}
          showGoal={showGoal}
          points={points.map((p) => ({
            ...p,
            status: visitedPoints.includes(p.id) ? "visited" : "unvisited",
          }))}
        />

        {isMenuOpen && (
          <DrawerMenu
            stats={stats}
            onShowOwnLocation={() => setShowOwnLocation(!showOwnLocation)}
            onShowGoal={() => setShowGoal(!showGoal)}
          />
        )}

        {goalFound && (
          <GoalFoundPopup
            content={goalFound.hint ?? ""}
            onClose={handleCompleteGame}
          />
        )}
      </div>
    </main>
  );
}
