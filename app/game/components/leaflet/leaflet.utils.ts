import L from "leaflet";
import { LatLng, LatLngBounds } from "leaflet";
import type { Game } from "@/types/game";

export function toLatLngBounds(bounds: Game["bounding_box"]): LatLngBounds {
  return new LatLngBounds(
    new LatLng(bounds.southEast.lat, bounds.southEast.lng),
    new LatLng(bounds.northWest.lat, bounds.northWest.lng)
  );
}

export const getMarker = (
  point: LatLng,
  type: "start" | "destination" | "visited" | "unvisited" | "player"
) =>
  L.marker([point.lat, point.lng], {
    icon: getMarkerIcon(type),
  });

export const getMarkerIcon = (
  type: "start" | "destination" | "visited" | "unvisited" | "player"
) => {
  const colors = {
    start: "bg-green-500",
    destination: "bg-red-500",
    visited: "bg-blue-500",
    unvisited: "bg-gray-400",
    player: "bg-yellow-500",
  };

  return L.divIcon({
    className: "bg-transparent",
    html: `<div class="w-6 h-6 rounded-full ${colors[type]} border-2 border-white shadow-lg"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export const getPlayerMarker = (position: L.LatLngExpression) =>
  L.marker(position, {
    icon: L.divIcon({
      className: "bg-transparent",
      html: `<div class="w-6 h-6 rounded-full bg-yellow-500 border-2 border-white shadow-lg relative">
        <div class="absolute -inset-1 bg-yellow-500 animate-ping rounded-full opacity-75"></div>
      </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    }),
  });
