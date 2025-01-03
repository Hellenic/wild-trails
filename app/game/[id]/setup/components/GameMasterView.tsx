"use client";

import React, { useState } from "react";
import { GameMasterMap } from "./GameMasterMap";
import { updateGameStatus } from "@/app/actions/games";
import type { GameDetails } from "@/types/game";

interface GameMasterViewProps {
  gameDetails: GameDetails;
}

export function GameMasterView({ gameDetails }: GameMasterViewProps) {
  const [points, setPoints] = useState<
    Array<{
      id: string;
      type: "point_a" | "point_b" | "checkpoint";
      position: [number, number];
      hint?: string;
    }>
  >([]);
  const [selectedPointType, setSelectedPointType] = useState<
    "point_a" | "point_b" | "checkpoint"
  >("checkpoint");
  const [, setSaving] = useState(false);

  const handlePointAdd = async (position: [number, number]) => {
    const newPoint = {
      id: crypto.randomUUID(),
      type: selectedPointType,
      position,
    };

    // Only allow one point A and one point B
    if (
      selectedPointType === "point_a" &&
      points.some((p) => p.type === "point_a")
    ) {
      alert("Point A already exists");
      return;
    }
    if (
      selectedPointType === "point_b" &&
      points.some((p) => p.type === "point_b")
    ) {
      alert("Point B already exists");
      return;
    }

    setPoints([...points, newPoint]);
  };

  const handleGameStart = async () => {
    try {
      setSaving(true);
      // await saveGamePoints(gameDetails.id, points);
      await updateGameStatus(gameDetails.id, "ready");
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
            disabled={points.length < 3} // Minimum points required
            className="bg-green-500 text-white px-6 py-2 rounded-lg disabled:bg-gray-300"
          >
            Start Game
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Set Game Points</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPointType("point_a")}
              className={`px-4 py-2 rounded ${
                selectedPointType === "point_a"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100"
              }`}
            >
              Point A
            </button>
            <button
              onClick={() => setSelectedPointType("point_b")}
              className={`px-4 py-2 rounded ${
                selectedPointType === "point_b"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100"
              }`}
            >
              Point B
            </button>
            <button
              onClick={() => setSelectedPointType("checkpoint")}
              className={`px-4 py-2 rounded ${
                selectedPointType === "checkpoint"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100"
              }`}
            >
              Checkpoint
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
