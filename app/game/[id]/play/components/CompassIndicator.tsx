import React from "react";
import { calculateBearing, getCardinalDirection } from "@/app/background/geo-utils";

interface CompassIndicatorProps {
  playerLocation: { lat: number; lng: number };
  targetLocation: { lat: number; lng: number };
  label?: string;
  color?: "green" | "blue" | "gold";
}

export function CompassIndicator({
  playerLocation,
  targetLocation,
  label,
  color = "blue",
}: CompassIndicatorProps) {
  const bearing = calculateBearing(playerLocation, targetLocation);
  const direction = getCardinalDirection(bearing);

  const colorClasses = {
    green: "bg-green-500 text-white border-green-600",
    blue: "bg-blue-500 text-white border-blue-600",
    gold: "bg-yellow-500 text-white border-yellow-600",
  };

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 ${colorClasses[color]} shadow-md`}
    >
      {/* Arrow pointing in direction */}
      <div
        className="text-xl font-bold"
        style={{
          transform: `rotate(${bearing}deg)`,
          transition: "transform 0.3s ease-out",
        }}
      >
        ↑
      </div>
      
      {/* Direction info */}
      <div className="text-sm">
        <div className="font-bold">{direction}</div>
        {label && <div className="text-xs opacity-90">{label}</div>}
      </div>
    </div>
  );
}

interface CompassOverlayProps {
  playerLocation: { lat: number; lng: number } | null;
  visitedPoints: Array<{ id: string; latitude: number; longitude: number; label?: string }>;
  goalLocation?: { lat: number; lng: number } | null;
}

export function CompassOverlay({
  playerLocation,
  visitedPoints,
  goalLocation,
}: CompassOverlayProps) {
  if (!playerLocation) return null;

  return (
    <div className="absolute top-20 left-4 z-20 space-y-2">
      {/* Show compass to visited points */}
      {visitedPoints.slice(-3).map((point, index) => (
        <CompassIndicator
          key={point.id}
          playerLocation={playerLocation}
          targetLocation={{ lat: point.latitude, lng: point.longitude }}
          label={point.label || `Point ${index + 1}`}
          color="green"
        />
      ))}

      {/* Show compass to goal if visible */}
      {goalLocation && (
        <CompassIndicator
          playerLocation={playerLocation}
          targetLocation={goalLocation}
          label="Goal"
          color="gold"
        />
      )}
    </div>
  );
}
