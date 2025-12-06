"use client";

import React, { useState } from "react";
import { GameMasterMap } from "./GameMasterMap";
import { gameAPI, pointsAPI } from "@/lib/api/client";
import type { GameDetails } from "@/types/game";
import type { Tables } from "@/types/database.types";

type GamePoint = Tables<"game_points">;

interface GameMasterViewProps {
  gameDetails: GameDetails;
  onPointsReady: () => void;
}

type PointSetup = {
  id: string;
  type: GamePoint["type"];
  position: [number, number];
  hint: string;
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
  const desiredStartingPoint = gameDetails.starting_point
    ? ([gameDetails.starting_point.lat, gameDetails.starting_point.lng] as [
        number,
        number,
      ])
    : undefined;

  const handlePointAdd = async (position: [number, number]) => {
    const newPoint = {
      id: crypto.randomUUID(),
      type: selectedPointType,
      position,
      hint: "",
    };

    // Replace existing start/end points or add new point
    if (selectedPointType === "start" || selectedPointType === "end") {
      const updatedPoints = points.filter((p) => p.type !== selectedPointType);
      setPoints(
        [...updatedPoints, newPoint].sort((a, b) => {
          if (a.type === "end") return 1;
          if (b.type === "end") return -1;
          return 0;
        })
      );
    } else {
      setPoints(
        [...points, newPoint].sort((a, b) => {
          if (a.type === "end") return 1;
          if (b.type === "end") return -1;
          return 0;
        })
      );
    }
  };

  const handleGameStart = async () => {
    try {
      setSaving(true);
      await pointsAPI.createManual(gameDetails.id, { points });
      await gameAPI.updateStatus(gameDetails.id, { status: "ready" });

      onPointsReady();
    } catch (error) {
      console.error("Failed to start game:", error);
      alert("Failed to start game. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleHintChange = (pointId: string, hint: string) => {
    setPoints(
      points.map((point) => (point.id === pointId ? { ...point, hint } : point))
    );
  };

  const handlePointRemove = (pointId: string) => {
    const point = points.find((p) => p.id === pointId);
    if (point?.type === "start" || point?.type === "end") {
      return; // Don't allow removal of start/end points
    }
    setPoints(points.filter((p) => p.id !== pointId));
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
        <div>
          <p className="flex items-center gap-2 text-gray-700 flex-wrap">
            <span className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white inline-block"></span>
            <span>Desired starting point</span>
            <span className="mx-2">•</span>
            <span className="w-4 h-4 border-2 border-blue-500 inline-block"></span>
            <span>Desired game area</span>
            <span className="mx-2">•</span>
            <span className="w-4 h-4 rounded-full border-2 border-blue-500 inline-block"></span>
            <span>Maximum radius</span>
            <span className="mx-2">•</span>
            <span className="w-4 h-4 rounded-full bg-green-600 border-2 border-white inline-block"></span>
            <span>Starting point</span>
            <span className="mx-2">•</span>
            <span className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white inline-block"></span>
            <span>Clue point</span>
            <span className="mx-2">•</span>
            <span className="w-4 h-4 rounded-full bg-red-600 border-2 border-white inline-block"></span>
            <span>Goal point</span>
          </p>
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
                  ? "bg-green-600 text-white"
                  : "bg-gray-100"
              }`}
            >
              Starting Point
            </button>
            <button
              onClick={() => setSelectedPointType("clue")}
              className={`px-4 py-2 rounded ${
                selectedPointType === "clue"
                  ? "bg-blue-600 text-white"
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
            desiredStartingPoint={desiredStartingPoint}
            desiredMaxRadius={gameDetails.max_radius}
            bounds={gameDetails.bounding_box}
            onClick={handlePointAdd}
            markers={points}
          />
        </div>

        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4">Game Points</h3>
          <div className="space-y-4">
            {points.map((point, index, sortedPoints) => {
              // Calculate clue number (only count previous clue points)
              const clueNumber =
                point.type === "clue"
                  ? sortedPoints
                      .slice(0, index)
                      .filter((p) => p.type === "clue").length + 1
                  : null;

              return (
                <div
                  key={point.id}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`
                            px-2 py-1 rounded text-sm text-white
                            ${
                              point.type === "start"
                                ? "bg-green-600"
                                : point.type === "end"
                                  ? "bg-red-600"
                                  : "bg-blue-600"
                            }
                          `}
                      >
                        {point.type === "start"
                          ? "Starting Point"
                          : point.type === "end"
                            ? "Goal"
                            : `Clue Point #${clueNumber}`}
                      </span>
                      <span className="text-sm text-gray-600">
                        ({point.position[0].toFixed(6)},{" "}
                        {point.position[1].toFixed(6)})
                      </span>
                    </div>
                    <textarea
                      className="w-full p-2 border rounded-lg text-gray-900"
                      placeholder={`Enter ${
                        point.type === "clue" ? "clue" : "description"
                      }...`}
                      value={point.hint}
                      onChange={(e) =>
                        handleHintChange(point.id, e.target.value)
                      }
                      rows={2}
                    />
                  </div>
                  {point.type === "clue" && (
                    <button
                      onClick={() => handlePointRemove(point.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
