"use client";

import React, { useState } from "react";
import { GameMasterMap } from "./GameMasterMap";
import { updateGameStatus } from "@/app/actions/games";
import type { GameDetails } from "@/types/game";
import { saveGamePoints, type GamePoint } from "@/app/actions/points";

interface GameMasterViewProps {
  gameDetails: GameDetails;
  onPointsReady: () => void;
}

type PointSetup = {
  id: string;
  type: GamePoint["type"];
  position: [number, number];
  hint?: string;
};

export function GameMasterView({
  gameDetails,
  onPointsReady,
}: GameMasterViewProps) {
  const [points, setPoints] = useState<PointSetup[]>([]);
  const [selectedPointType, setSelectedPointType] = useState<
    "start" | "end" | "clue"
  >("start");
  const [saving, setSaving] = useState(false);

  const handlePointAdd = async (position: [number, number]) => {
    const newPoint = {
      id: crypto.randomUUID(),
      type: selectedPointType,
      position,
    };

    // Only allow one point A and one point B
    if (
      selectedPointType === "start" &&
      points.some((p) => p.type === "start")
    ) {
      alert("Starting point already exists");
      return;
    }
    if (selectedPointType === "end" && points.some((p) => p.type === "end")) {
      alert("Goal already exists");
      return;
    }

    setPoints([...points, newPoint]);
  };

  const handleGameStart = async () => {
    try {
      setSaving(true);
      await saveGamePoints(gameDetails.id, points);
      await updateGameStatus(gameDetails.id, "ready");

      onPointsReady();
    } catch (error) {
      console.error("Failed to start game:", error);
      alert("Failed to start game. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-4">
          Game Setup - {gameDetails.name}
        </h1>
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-gray-600">Game Master: You</p>
            <p className="text-gray-600">Players: {gameDetails.player_count}</p>
          </div>
          <button
            onClick={handleGameStart}
            disabled={points.length < 3 || saving} // Minimum points required
            className={`bg-green-500 text-white px-6 py-2 rounded-lg ${
              saving ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {saving ? "Starting Game..." : "Start Game"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Set Game Points</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPointType("start")}
              className={`px-4 py-2 rounded ${
                selectedPointType === "start"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100"
              }`}
            >
              Starting Point
            </button>
            <button
              onClick={() => setSelectedPointType("clue")}
              className={`px-4 py-2 rounded ${
                selectedPointType === "clue"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100"
              }`}
            >
              Clue
            </button>
            <button
              onClick={() => setSelectedPointType("end")}
              className={`px-4 py-2 rounded ${
                selectedPointType === "end"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100"
              }`}
            >
              Goal
            </button>
          </div>
        </div>
        <div className="h-[600px] relative">
          <GameMasterMap
            bounds={gameDetails.bounding_box}
            onClick={handlePointAdd}
            markers={points}
          />
        </div>
      </div>
    </div>
  );
}
