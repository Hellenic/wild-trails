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
type MarkerType = 
  | "start" 
  | "destination" 
  | "visited" 
  | "unvisited" 
  | "player" 
  | "player_player_a" 
  | "player_player_b" 
  | "player_game_master";

export const getMarkerIcon = (
  type: MarkerType,
  index?: number
) => {
  const colors: Record<MarkerType, string> = {
    start: "bg-primary",
    destination: "bg-red-500",
    visited: "bg-primary",
    unvisited: "bg-gray-500",
    player: "bg-yellow-500",
    player_player_a: "bg-blue-500",      // Seeker
    player_player_b: "bg-yellow-500",    // Guide
    player_game_master: "bg-purple-500", // GM
  };

  if (type === "visited" || type === "unvisited") {
    return createClueNumberIcon(index ?? 0, colors[type]);
  }

  // For player markers, add a pulsing animation
  const isPlayerMarker = type.startsWith("player");
  const pulseHtml = isPlayerMarker 
    ? `<div class="absolute -inset-1 ${colors[type]} animate-ping rounded-full opacity-50"></div>` 
    : "";

  return L.divIcon({
    className: "bg-transparent",
    html: `<div class="w-6 h-6 rounded-full ${colors[type]} border-2 border-white shadow-lg relative">${pulseHtml}</div>`,
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
