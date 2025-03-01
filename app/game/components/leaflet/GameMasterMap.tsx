"use client";

import React from "react";
import {
  MapContainer,
  Marker,
  useMapEvents,
  Popup,
  Rectangle,
  Circle,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getMarkerIcon, toLatLngBounds } from "./leaflet.utils";
import type { Game, GamePoint } from "@/types/game";
import { MapTileLayers } from "./MapTileLayers";

type Marker = {
  id: string;
  type: GamePoint["type"];
  position: [number, number];
  hint?: string;
};

interface MapProps {
  bounds: Game["bounding_box"];
  desiredStartingPoint?: [number, number];
  desiredMaxRadius?: number;
  onClick?: (position: [number, number]) => void;
  markers?: Marker[];
}

function MapEvents({
  onClick,
}: {
  onClick?: (position: [number, number]) => void;
}) {
  useMapEvents({
    click: (e) => {
      if (onClick) {
        onClick([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
}

function getMarkerIconForType(type: GamePoint["type"], index: number) {
  if (type === "start") return getMarkerIcon("start");
  if (type === "end") return getMarkerIcon("destination");
  if (type === "clue") return getMarkerIcon("visited", index);
}

export default function GameMasterMap({
  bounds,
  desiredStartingPoint,
  desiredMaxRadius,
  onClick,
  markers = [],
}: MapProps) {
  // Convert the stored coordinates back to Leaflet objects
  const mapArea = toLatLngBounds(bounds);
  const center = mapArea.getCenter();

  return (
    <MapContainer
      center={center}
      bounds={mapArea}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      className="rounded-lg"
    >
      <MapTileLayers />

      {onClick && <MapEvents onClick={onClick} />}

      {desiredStartingPoint && (
        <Marker
          position={desiredStartingPoint}
          icon={getMarkerIcon("player")}
        />
      )}

      {mapArea && <Rectangle bounds={mapArea} color="blue" fillOpacity={0} />}
      {desiredMaxRadius && (
        <Circle
          center={center}
          radius={desiredMaxRadius * 1000}
          color="black"
          fillOpacity={0.2}
        />
      )}

      {markers.map((marker, index) => (
        <Marker
          key={marker.id}
          position={marker.position}
          icon={getMarkerIconForType(marker.type, index)}
        >
          {marker.hint && (
            <Popup>
              <div className="p-2">
                <p className="font-semibold capitalize">
                  {marker.type.replace("_", " ")}
                </p>
                {marker.hint && <p className="text-sm mt-1">{marker.hint}</p>}
              </div>
            </Popup>
          )}
        </Marker>
      ))}
    </MapContainer>
  );
}
