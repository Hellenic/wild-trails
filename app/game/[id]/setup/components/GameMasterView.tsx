"use client";

import React, { useState } from "react";
import { GameMasterMap } from "./GameMasterMap";
import { gameAPI, pointsAPI } from "@/lib/api/client";
import type { GameDetails } from "@/types/game";
import type { Tables } from "@/types/database.types";
import { Button } from "@/app/components/ui/Button";
import { Icon } from "@/app/components/ui/Icon";
import { GlassPanel } from "@/app/components/ui/GlassPanel";

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
    <div className="container mx-auto p-4 md:p-8">
      <GlassPanel className="p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Icon name="settings" size="lg" className="text-primary" />
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Game Setup
              </h1>
            </div>
            <h2 className="text-xl font-bold text-gray-300">{gameDetails.name}</h2>
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <Icon name="person" size="sm" />
                Game Master: {gameDetails.game_master === 'ai' ? 'AI' : 'You'}
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="group" size="sm" />
                Players: {gameDetails.player_count}
              </span>
            </div>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={handleGameStart}
            disabled={points.length < 3 || saving}
            className="shadow-lg shadow-primary/20"
          >
            {saving ? (
              <>
                <Icon name="progress_activity" size="sm" className="mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Icon name="play_arrow" size="sm" className="mr-2" />
                Start Game
              </>
            )}
          </Button>
        </div>

        <div className="bg-surface-dark-elevated/50 border border-white/5 rounded-xl p-4">
          <p className="flex items-center gap-4 text-xs font-medium text-gray-400 flex-wrap uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
              Desired start
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 border-2 border-blue-500" />
              Game area
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border-2 border-blue-500" />
              Max radius
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-green-600 shadow-[0_0_8px_rgba(22,163,74,0.4)]" />
              Starting point
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
              Clue point
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.4)]" />
              Goal point
            </span>
          </p>
        </div>
      </GlassPanel>

      <GlassPanel className="p-6 md:p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
          <div className="flex items-center gap-3">
            <Icon name="map" size="md" className="text-primary" />
            <h2 className="text-2xl font-bold text-white tracking-tight">Set Game Points</h2>
          </div>
          
          <div className="flex flex-wrap gap-2 bg-surface-dark-elevated p-1 rounded-xl border border-white/5">
            <Button
              size="sm"
              variant={selectedPointType === "start" ? "primary" : "ghost"}
              onClick={() => setSelectedPointType("start")}
              className="px-4"
            >
              Starting Point
            </Button>
            <Button
              size="sm"
              variant={selectedPointType === "clue" ? "primary" : "ghost"}
              onClick={() => setSelectedPointType("clue")}
              className="px-4"
            >
              Clue
            </Button>
            <Button
              size="sm"
              variant={selectedPointType === "end" ? "primary" : "ghost"}
              onClick={() => setSelectedPointType("end")}
              className="px-4"
            >
              Goal
            </Button>
          </div>
        </div>

        <div className="h-[600px] relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          <GameMasterMap
            desiredStartingPoint={desiredStartingPoint}
            desiredMaxRadius={gameDetails.max_radius}
            bounds={gameDetails.bounding_box}
            onClick={handlePointAdd}
            markers={points}
          />
        </div>

        <div className="mt-10">
          <div className="flex items-center gap-3 mb-6">
            <Icon name="list" size="md" className="text-primary" />
            <h3 className="text-2xl font-bold text-white tracking-tight">Game Points</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {points.length === 0 && (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-white/10 rounded-2xl text-gray-500">
                <Icon name="add_location" size="xl" className="mb-4 opacity-20" />
                <p>Add points by clicking on the map above</p>
              </div>
            )}
            {points.map((point, index, sortedPoints) => {
              const clueNumber =
                point.type === "clue"
                  ? sortedPoints
                      .slice(0, index)
                      .filter((p) => p.type === "clue").length + 1
                  : null;

              return (
                <div
                  key={point.id}
                  className="flex flex-col gap-4 p-5 bg-surface-dark-elevated rounded-2xl border border-white/10 hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`
                            px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-white
                            ${
                              point.type === "start"
                                ? "bg-green-600 shadow-[0_0_10px_rgba(22,163,74,0.3)]"
                                : point.type === "end"
                                  ? "bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.3)]"
                                  : "bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                            }
                          `}
                      >
                        {point.type === "start"
                          ? "Start"
                          : point.type === "end"
                            ? "Goal"
                            : `Clue #${clueNumber}`}
                      </span>
                      <span className="text-xs font-mono text-gray-500">
                        {point.position[0].toFixed(6)}, {point.position[1].toFixed(6)}
                      </span>
                    </div>
                    {point.type === "clue" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePointRemove(point.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2"
                      >
                        <Icon name="delete" size="sm" />
                      </Button>
                    )}
                  </div>
                  <textarea
                    className="w-full p-3 bg-background-dark/50 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
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
              );
            })}
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
