import { useEffect, useRef } from "react";
import { LatLng } from "@/utils/map";
import type { GamePoint } from "@/hooks/usePoints";
import { updatePointStatus } from "@/app/actions/points";

const TRIGGER_DISTANCE_METERS = 50; // Adjust based on game requirements

interface ProximityCheckProps {
  playerLocation: LatLng | null;
  points: GamePoint[];
  onPointReached: (point: GamePoint) => void;
}

export function useProximityCheck({
  playerLocation,
  points,
  onPointReached,
}: ProximityCheckProps) {
  // Track which points have been triggered
  const triggeredPoints = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!playerLocation) return;

    points.forEach((point) => {
      // Skip if already triggered
      if (triggeredPoints.current.has(point.id)) return;

      // Calculate distance between player and point
      const pointLatLng = new LatLng(point.latitude, point.longitude);
      const distanceMeters = playerLocation.distanceTo(pointLatLng);

      // Check if player is within trigger distance
      if (distanceMeters <= TRIGGER_DISTANCE_METERS) {
        triggeredPoints.current.add(point.id);
        onPointReached(point);

        // Queue server sync when online
        updatePointStatus(point.id, "visited");
      }
    });
  }, [playerLocation, points, onPointReached]);
}
