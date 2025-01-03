"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { TimeDisplay } from "./components/TimeDisplay";
import { BottomPanel } from "./components/BottomPanel";
import { GoalFoundPopup } from "./components/GoalFoundPopup";
import { useUser } from "@/hooks/useUser";
import { useGameDetails } from "@/hooks/useGame";
import { usePoints, type GamePoint } from "@/hooks/usePoints";
import { useLocationTracking } from "@/hooks/useLocationTracking";
import { useProximityCheck } from "@/hooks/useProximityCheck";
import { requestNotificationPermission } from "@/utils/notifications";
import { GameMap } from "./components/GameMap";
import { updateGameStatus } from "@/app/actions/games";

type Params = {
  id: string;
};

export default function GameScreen() {
  const { id } = useParams<Params>();
  const { user, loading: userLoading } = useUser();
  const { gameDetails, loading: gameDetailsLoading } = useGameDetails(id);
  const { points, loading: pointsLoading } = usePoints(id);
  const [goalFound, setGoalFound] = useState<GamePoint | null>(null);
  const [visitedPoints, setVisitedPoints] = useState<string[]>([]);

  // Cheats, while developing the application
  const [showOwnLocation, setShowOwnLocation] = useState(false);
  const [showGoal, setShowGoal] = useState(false);

  const playerLocation = useLocationTracking(showOwnLocation);
  const triggeringPoints = points.filter((p) => p.type !== "start");

  const router = useRouter();

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useProximityCheck({
    playerLocation,
    points: triggeringPoints,
    onPointReached: (point) => {
      setVisitedPoints([...visitedPoints, point.id]);
      if (Notification.permission === "granted") {
        if (point.type === "clue") {
          new Notification("Point discovered!", {
            body: `Hint: ${point.hint}`,
            icon: "/favicon-32x32.png",
          });
        } else if (point.type === "end") {
          setGoalFound(point);
        }
      }
    },
  });

  const handleCompleteGame = async () => {
    await updateGameStatus(id, "completed");
    setGoalFound(null);
    router.push("/");
  };

  if (userLoading || gameDetailsLoading || pointsLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-forest-deep">Loading...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-forest-deep">User not found</div>
      </main>
    );
  }

  if (!gameDetails) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-forest-deep">Game not found</div>
      </main>
    );
  }

  const stats = {
    showOwnLocation,
    showGoal,
    pointsVisited: visitedPoints.length,
    totalPoints: triggeringPoints.length,
    distanceTraveled: "-- km",
  };

  return (
    <main className="relative h-screen w-full bg-background">
      <TimeDisplay
        startedAt={new Date(gameDetails.started_at ?? "")}
        durationMinutes={gameDetails.duration}
      />

      <div className="absolute inset-0 top-[40px] bottom-[60px] z-0">
        <GameMap
          bounds={gameDetails.bounding_box}
          playerLocation={playerLocation}
          showGoal={showGoal}
          points={points}
        />
      </div>

      <BottomPanel
        stats={stats}
        onShowOwnLocation={() => setShowOwnLocation(!showOwnLocation)}
        onShowGoal={() => setShowGoal(!showGoal)}
      />

      {goalFound && (
        <GoalFoundPopup
          content={goalFound.hint ?? ""}
          onClose={handleCompleteGame}
        />
      )}
    </main>
  );
}
