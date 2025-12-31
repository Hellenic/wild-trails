"use client";

import React from "react";
import { MapContainer, Marker, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LatLng } from "leaflet";
import { getMarkerIcon } from "./leaflet.utils";
import { MapTileLayers } from "./MapTileLayers";

interface StartingPointPreviewMapProps {
  startingPoint: { lat: number; lng: number };
  playerLocation?: { lat: number; lng: number } | null;
  maxRadius?: number; // in kilometers
}

export default function StartingPointPreviewMap({
  startingPoint,
  playerLocation,
  maxRadius,
}: StartingPointPreviewMapProps) {
  const center = new LatLng(startingPoint.lat, startingPoint.lng);

  return (
    <MapContainer
      center={center}
      zoom={15}
      style={{ height: "100%", width: "100%" }}
      className="rounded-lg"
      zoomControl={false}
      scrollWheelZoom={false}
      dragging={true}
    >
      <MapTileLayers />

      {/* Starting point marker */}
      <Marker position={center} icon={getMarkerIcon("start")} />

      {/* Max radius circle */}
      {maxRadius && (
        <Circle
          center={center}
          radius={maxRadius * 1000}
          color="#13ec13"
          fillColor="#13ec13"
          fillOpacity={0.1}
          weight={2}
          dashArray="5, 10"
        />
      )}

      {/* Player's current location */}
      {playerLocation && (
        <Marker
          position={new LatLng(playerLocation.lat, playerLocation.lng)}
          icon={getMarkerIcon("player")}
        />
      )}
    </MapContainer>
  );
}

