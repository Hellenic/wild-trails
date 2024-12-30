import React, { useState } from "react";

type GameStats = {
  showOwnLocation: boolean;
  showGoal: boolean;
  pointsVisited: number;
  totalPoints: number;
  distanceTraveled: string;
};

export function BottomPanel({
  stats,
  onShowOwnLocation,
  onShowGoal,
}: {
  stats: GameStats;
  onShowOwnLocation: () => void;
  onShowGoal: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 bg-white transition-all duration-300 ease-in-out ${isExpanded ? "h-[80vh]" : "h-[7vh]"}`}
    >
      <div
        className="w-full p-4 flex justify-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="w-12 h-1 bg-gray-300 rounded-full" />
      </div>

      <div className="px-4 space-y-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2">
            <span>Show own location</span>
            <input
              type="checkbox"
              defaultChecked={stats.showOwnLocation}
              onClick={onShowOwnLocation}
            />
          </label>
          <label className="flex items-center space-x-2">
            <span>Show goal</span>
            <input
              type="checkbox"
              defaultChecked={stats.showGoal}
              onClick={onShowGoal}
            />
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Points visited:</span>
            <span>
              {stats.pointsVisited}/{stats.totalPoints}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Distance traveled:</span>
            <span>{stats.distanceTraveled}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
