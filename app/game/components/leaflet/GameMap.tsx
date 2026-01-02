import React from "react";
import { MapContainer, Marker, Popup } from "react-leaflet";
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
import type { GameRole } from "@/lib/game/roles";

interface OtherPlayer {
  id: string;
  lat: number;
  lng: number;
  role: GameRole;
  label: string;
}

type GameMapProps = {
  bounds: Game["bounding_box"];
  playerLocation: CustomLatLng | null;
  showGoal: boolean;
  points: GamePoint[];
  otherPlayers?: OtherPlayer[];
  showAllWaypoints?: boolean;
};

export default function GameMap({
  bounds,
  playerLocation,
  showGoal,
  points,
  otherPlayers = [],
  showAllWaypoints = false,
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

        {/* Game points - show all if showAllWaypoints, otherwise only visited */}
        {restPoints.map((point, index) => {
          // If not showing all waypoints, only show visited ones
          if (!showAllWaypoints && point.status !== "visited") {
            return null;
          }
          return (
            <Marker
              key={`${point.id}-${point.status}`}
              position={new LatLng(point.latitude, point.longitude)}
              icon={getMarkerIcon(point.status, index + 1)}
            />
          );
        })}

        {/* Player location marker */}
        {playerLocation && (
          <Marker
            key="player-location"
            position={playerLocation}
            icon={getMarkerIcon("player")}
          />
        )}

        {/* Other players markers */}
        {otherPlayers.map((player) => (
          <Marker
            key={`other-player-${player.id}`}
            position={new LatLng(player.lat, player.lng)}
            icon={getMarkerIcon(`player_${player.role}`)}
          >
            <Popup>
              <div className="text-sm font-medium">{player.label}</div>
            </Popup>
          </Marker>
        ))}

        {/* Goal marker */}
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
