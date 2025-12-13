import React from "react";
import { MapContainer, Marker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LatLng } from "leaflet";
import {
  getMarkerIcon,
  toLatLngBounds,
} from "@/app/game/components/leaflet/leaflet.utils";
import type { GamePoint } from "@/types/game";
import type { Game } from "@/types/game";
import { MapTileLayers } from "@/app/game/components/leaflet/MapTileLayers";

interface PlayerLocation {
  latitude: number | null;
  longitude: number | null;
  timestamp: string;
  accuracy: number | null;
}

type ResultsMapProps = {
  bounds: Game["bounding_box"];
  points: GamePoint[];
  playerPath: PlayerLocation[];
};

export default function ResultsMap({
  bounds,
  points,
  playerPath,
}: ResultsMapProps) {
  const startingPoint = points.find((p) => p.type === "start");
  const endingPoint = points.find((p) => p.type === "end");
  const waypoints = points.filter(
    (p) => p.type !== "start" && p.type !== "end"
  );

  // Convert the stored coordinates back to Leaflet objects
  const mapArea = toLatLngBounds(bounds);
  const center = mapArea.getCenter();

  // Convert player path to Leaflet LatLng array
  const pathCoordinates = playerPath
    .filter((loc) => loc.latitude !== null && loc.longitude !== null)
    .map((loc) => new LatLng(loc.latitude!, loc.longitude!));

  return (
    <div className="h-full w-full relative overflow-hidden">
      <MapContainer
        center={center}
        zoom={14}
        className="absolute inset-0 z-0"
        zoomControl={true}
        style={{ height: "100%" }}
      >
        <MapTileLayers />

        {/* Player path polyline */}
        {pathCoordinates.length > 0 && (
          <Polyline
            positions={pathCoordinates}
            color="#3b82f6"
            weight={3}
            opacity={0.7}
          />
        )}

        {/* Starting point marker */}
        {startingPoint && (
          <Marker
            position={
              new LatLng(startingPoint.latitude, startingPoint.longitude)
            }
            icon={getMarkerIcon("start")}
          />
        )}

        {/* Waypoint markers */}
        {waypoints.map((point, index) => (
          <Marker
            key={point.id}
            position={new LatLng(point.latitude, point.longitude)}
            icon={getMarkerIcon(point.status, index + 1)}
          />
        ))}

        {/* Goal marker */}
        {endingPoint && (
          <Marker
            position={new LatLng(endingPoint.latitude, endingPoint.longitude)}
            icon={getMarkerIcon("destination")}
          />
        )}

        {/* Final player position marker */}
        {pathCoordinates.length > 0 && (
          <Marker
            position={pathCoordinates[pathCoordinates.length - 1]}
            icon={getMarkerIcon("player")}
          />
        )}
      </MapContainer>
    </div>
  );
}
