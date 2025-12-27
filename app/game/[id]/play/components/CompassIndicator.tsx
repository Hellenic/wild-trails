import React from "react";
import { calculateBearing, getCardinalDirection } from "@/app/background/geo-utils";
import { Icon } from "@/app/components/ui/Icon";
import { GlassPanel } from "@/app/components/ui/GlassPanel";
import { cn } from "@/lib/utils";

interface CompassIndicatorProps {
  playerLocation: { lat: number; lng: number };
  targetLocation: { lat: number; lng: number };
  label?: string;
  variant?: "waypoint" | "goal";
}

export function CompassIndicator({
  playerLocation,
  targetLocation,
  label,
  variant = "waypoint",
}: CompassIndicatorProps) {
  const bearing = calculateBearing(playerLocation, targetLocation);
  const direction = getCardinalDirection(bearing);

  return (
    <GlassPanel
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all animate-fade-in shadow-xl",
        variant === "goal" 
          ? "bg-primary/20 border-primary/40" 
          : "bg-surface-dark-elevated/80 border-white/10"
      )}
    >
      {/* Arrow pointing in direction */}
      <div
        className={cn(
          "flex items-center justify-center transition-all duration-500",
          variant === "goal" ? "text-primary shadow-[0_0_10px_rgba(19,236,19,0.3)]" : "text-white"
        )}
        style={{
          transform: `rotate(${bearing}deg)`,
        }}
      >
        <Icon name="navigation" size="sm" />
      </div>
      
      {/* Direction info */}
      <div className="flex flex-col">
        <div className={cn(
          "text-xs font-black uppercase tracking-widest leading-none mb-1",
          variant === "goal" ? "text-primary" : "text-white"
        )}>
          {direction}
        </div>
        {label && (
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter truncate max-w-[80px]">
            {label}
          </div>
        )}
      </div>
    </GlassPanel>
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
    <div className="absolute top-4 left-4 z-20 space-y-3 pointer-events-none">
      {/* Show compass to goal if visible - Goal prioritized at top */}
      {goalLocation && (
        <CompassIndicator
          playerLocation={playerLocation}
          targetLocation={goalLocation}
          label="The Goal"
          variant="goal"
        />
      )}

      {/* Show compass to visited points */}
      {visitedPoints.slice(-2).reverse().map((point, index) => (
        <CompassIndicator
          key={point.id}
          playerLocation={playerLocation}
          targetLocation={{ lat: point.latitude, lng: point.longitude }}
          label={point.label || `Waypoint ${visitedPoints.length - index}`}
          variant="waypoint"
        />
      ))}
    </div>
  );
}
