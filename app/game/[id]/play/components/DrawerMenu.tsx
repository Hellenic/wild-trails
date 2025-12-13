import React, { useState } from "react";
import type { GamePoint } from "@/hooks/usePoints";

type GameStats = {
  showOwnLocation: boolean;
  showGoal: boolean;
  pointsVisited: number;
  totalPoints: number;
  distanceTraveled: string;
  estimatedDistanceRemaining?: string;
};

export function DrawerMenu({
  stats,
  onShowOwnLocation,
  onShowGoal,
  onGiveUp,
  visitedPoints = [],
  hints = [],
}: {
  stats: GameStats;
  onShowOwnLocation: () => void;
  onShowGoal: () => void;
  onGiveUp?: () => void;
  visitedPoints?: GamePoint[];
  hints?: Array<{ pointId: string; hint: string; timestamp: string }>;
}) {
  const [expandedHints, setExpandedHints] = useState<Set<string>>(new Set());

  const toggleHint = (pointId: string) => {
    const newExpanded = new Set(expandedHints);
    if (newExpanded.has(pointId)) {
      newExpanded.delete(pointId);
    } else {
      newExpanded.add(pointId);
    }
    setExpandedHints(newExpanded);
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white h-[80vh] rounded-t-3xl shadow-lg overflow-y-auto">
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Show own location</span>
            <input
              type="checkbox"
              checked={stats.showOwnLocation}
              onChange={onShowOwnLocation}
              className="w-5 h-5 accent-forest-deep"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Show goal</span>
            <input
              type="checkbox"
              checked={stats.showGoal}
              onChange={onShowGoal}
              className="w-5 h-5 accent-forest-deep"
            />
          </label>
        </div>

        <div className="space-y-4 mt-6">
          <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Points visited</span>
            <span className="font-medium text-forest-deep">
              {stats.pointsVisited}/{stats.totalPoints}
            </span>
          </div>

          <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Distance traveled</span>
            <span className="font-medium text-forest-deep">
              {stats.distanceTraveled}
            </span>
          </div>

          {stats.estimatedDistanceRemaining && (
            <div className="flex justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-blue-700 font-medium">Est. distance to goal</span>
              <span className="font-bold text-blue-900">
                {stats.estimatedDistanceRemaining}
              </span>
            </div>
          )}
        </div>

        {/* Hints Section */}
        {hints.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-bold text-forest-deep mb-3">
              Collected Hints ({hints.length})
            </h3>
            <div className="space-y-3">
              {hints.slice().reverse().map((hint, index) => {
                const isLatest = index === 0;
                const pointNumber = hints.length - index;
                const isExpanded = expandedHints.has(hint.pointId) || isLatest;

                return (
                  <div
                    key={hint.pointId}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isLatest
                        ? "bg-green-50 border-green-400"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <button
                      onClick={() => toggleHint(hint.pointId)}
                      className="w-full flex justify-between items-center text-left"
                    >
                      <span className="font-medium text-forest-deep">
                        {isLatest ? "🆕 " : ""}Hint {pointNumber}
                        {isLatest && <span className="ml-2 text-xs text-green-700">(Latest)</span>}
                      </span>
                      <span className="text-xl">{isExpanded ? "−" : "+"}</span>
                    </button>
                    {isExpanded && (
                      <div className="mt-2 text-sm text-gray-700 leading-relaxed">
                        {hint.hint}
                      </div>
                    )}
                    {isExpanded && (
                      <div className="mt-2 text-xs text-gray-500">
                        {new Date(hint.timestamp).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Give Up Button */}
        {onGiveUp && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onGiveUp}
              className="w-full px-6 py-3 bg-red-100 text-red-700 border-2 border-red-300 rounded-lg hover:bg-red-200 transition-colors font-medium"
            >
              🏳️ Reveal Goal Location
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              This will end the game and show you the goal location
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
