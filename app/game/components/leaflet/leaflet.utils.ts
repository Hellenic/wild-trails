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

const createClueNumberIcon = (number: number, color: string) => {
  return L.divIcon({
    className: "custom-div-icon",
    html: `<div class="${color} text-white rounded-full w-6 h-6 flex items-center justify-center border-2 border-white text-xs font-bold">${number}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};
export const getMarkerIcon = (
  type: "start" | "destination" | "visited" | "unvisited" | "player",
  index?: number
) => {
  const colors = {
    start: "bg-green-500",
    destination: "bg-red-500",
    visited: "bg-blue-500",
    unvisited: "bg-gray-400",
    player: "bg-yellow-500",
  };

  if (type === "visited" || type === "unvisited") {
    return createClueNumberIcon(index ?? 0, colors[type]);
  }

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
