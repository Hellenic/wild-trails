import React from "react";
import { MapContainer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LatLng } from "leaflet";
import { LatLng as CustomLatLng } from "@/utils/map";
import {
  getMarkerIcon,
  toLatLngBounds,
} from "@/app/game/components/leaflet/leaflet.utils";
import type { GamePoint } from "@/hooks/usePoints";
import type { Game } from "@/types/game";
import { MapTileLayers } from "./MapTileLayers";

type GameMapProps = {
  bounds: Game["bounding_box"];
  playerLocation: CustomLatLng | null;
  showGoal: boolean;
  points: GamePoint[];
};

export default function GameMap({
  bounds,
  playerLocation,
  showGoal,
  points,
}: GameMapProps) {
  const startingPoint = points.find((p) => p.type === "start");
  const endingPoint = points.find((p) => p.type === "end");
  const restPoints = points.filter(
    (p) => p.type !== "start" && p.type !== "end"
  );

  // Convert the stored coordinates back to Leaflet objects
  const mapArea = toLatLngBounds(bounds);

  const center = mapArea.getCenter();

  return (
    <div className="h-full w-full relative overflow-hidden">
      <MapContainer
        center={center}
        zoom={14}
        className="absolute inset-0 z-0"
        zoomControl={false}
        style={{ height: "100%" }}
      >
        <MapTileLayers />

        {/* Starting point marker */}
        {startingPoint && (
          <Marker
            position={
              new LatLng(startingPoint.latitude, startingPoint.longitude)
            }
            icon={getMarkerIcon("start")}
          />
        )}

        {/* Game points */}
        {restPoints.map((point) => (
          <Marker
            key={point.id}
            position={new LatLng(point.latitude, point.longitude)}
            icon={getMarkerIcon(point.status)}
          />
        ))}

        {/* Player location marker */}
        {playerLocation && (
          <Marker
            key="player-location"
            position={playerLocation}
            icon={getMarkerIcon("player")}
          />
        )}

        {/* Goal marker - will be implemented later */}
        {showGoal && endingPoint && (
          <Marker
            position={new LatLng(endingPoint.latitude, endingPoint.longitude)}
            icon={getMarkerIcon("destination")}
          />
        )}
      </MapContainer>
    </div>
  );
}
