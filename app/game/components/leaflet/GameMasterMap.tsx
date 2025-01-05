"use client";

import React from "react";
import { MapContainer, Marker, useMapEvents, Popup } from "react-leaflet";
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

function getMarkerIconForType(type: GamePoint["type"]) {
  if (type === "start") return getMarkerIcon("start");
  if (type === "end") return getMarkerIcon("destination");
  if (type === "clue") return getMarkerIcon("visited");
}

export default function GameMasterMap({
  bounds,
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

      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={marker.position}
          icon={getMarkerIconForType(marker.type)}
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
