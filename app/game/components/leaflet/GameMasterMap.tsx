"use client";

import React from "react";
import { MapContainer, Marker, useMapEvents, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getMarkerIcon, toLatLngBounds } from "./leaflet.utils";
import type { Game } from "@/types/game";
import { MapTileLayers } from "./MapTileLayers";

interface MapProps {
  bounds: Game["bounding_box"];
  onClick?: (position: [number, number]) => void;
  markers?: Array<{
    id: string;
    type: "point_a" | "point_b" | "checkpoint";
    position: [number, number];
    hint?: string;
  }>;
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
          icon={getMarkerIcon("discovered")}
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
