import React from "react";

type GameStats = {
  showOwnLocation: boolean;
  showGoal: boolean;
  pointsVisited: number;
  totalPoints: number;
  distanceTraveled: string;
};

export function DrawerMenu({
  stats,
  onShowOwnLocation,
  onShowGoal,
}: {
  stats: GameStats;
  onShowOwnLocation: () => void;
  onShowGoal: () => void;
}) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white h-[80vh] rounded-t-3xl shadow-lg">
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
            <span className="font-medium">
              {stats.pointsVisited}/{stats.totalPoints}
            </span>
          </div>

          <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Distance traveled</span>
            <span className="font-medium">{stats.distanceTraveled}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
