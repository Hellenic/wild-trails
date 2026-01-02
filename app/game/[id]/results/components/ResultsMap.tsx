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

interface PlayerPath {
  playerId: string;
  color: string;
  locations: PlayerLocation[];
}

type ResultsMapProps = {
  bounds: Game["bounding_box"];
  points: GamePoint[];
  playerPaths: PlayerPath[];
};

export default function ResultsMap({
  bounds,
  points,
  playerPaths,
}: ResultsMapProps) {
  const startingPoint = points.find((p) => p.type === "start");
  const endingPoint = points.find((p) => p.type === "end");
  const waypoints = points.filter(
    (p) => p.type !== "start" && p.type !== "end"
  );

  // Convert the stored coordinates back to Leaflet objects
  const mapArea = toLatLngBounds(bounds);
  const center = mapArea.getCenter();

  // Convert each player's path to Leaflet LatLng arrays
  const pathsWithCoordinates = playerPaths.map((path) => ({
    ...path,
    coordinates: path.locations
      .filter((loc) => loc.latitude !== null && loc.longitude !== null)
      .map((loc) => new LatLng(loc.latitude!, loc.longitude!)),
  }));

  // Get the last known position from all paths for the final marker
  const allCoordinates = pathsWithCoordinates.flatMap((p) => p.coordinates);
  const lastPosition = allCoordinates.length > 0 ? allCoordinates[allCoordinates.length - 1] : null;

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

        {/* Player path polylines - one per player */}
        {pathsWithCoordinates.map((path) =>
          path.coordinates.length > 0 ? (
            <Polyline
              key={path.playerId}
              positions={path.coordinates}
              color={path.color}
              weight={3}
              opacity={0.7}
            />
          ) : null
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

        {/* Final player position markers - one per player */}
        {pathsWithCoordinates.map((path) =>
          path.coordinates.length > 0 ? (
            <Marker
              key={`final-${path.playerId}`}
              position={path.coordinates[path.coordinates.length - 1]}
              icon={getMarkerIcon("player")}
            />
          ) : null
        )}
      </MapContainer>
    </div>
  );
}
