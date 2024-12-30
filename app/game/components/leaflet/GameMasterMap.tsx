"use client";

import React from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getMarkerIcon } from "./leaflet.utils";

interface MapProps {
  center: [number, number];
  bounds?: [[number, number], [number, number]];
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
  center,
  bounds,
  onClick,
  markers = [],
}: MapProps) {
  return (
    <MapContainer
      center={center}
      bounds={bounds}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      className="rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
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
