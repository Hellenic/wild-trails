import React from "react";
import { MapContainer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Game } from "@/types/game";
import { LatLngTuple } from "leaflet";
import { LatLng as CustomLatLng } from "@/utils/map";
import { getMarkerIcon } from "./leaflet.utils";
import { MapTileLayers } from "./MapTileLayers";

type GameMapSelectionFormData = {
  mapArea?: Game["bounding_box"];
  startingPoint?: CustomLatLng;
};

type Props = {
  formData: GameMapSelectionFormData;
  setFormData: (data: GameMapSelectionFormData) => void;
  onNext: () => void;
  onBack: () => void;
};

// Mynttilä coordinates as default
const DEFAULT_CENTER: LatLngTuple = [60.2141829, 24.5901324];
const DEFAULT_ZOOM = 14.12;

function MapEvents({
  setFormData,
  formData,
}: {
  setFormData: Props["setFormData"];
  formData: Props["formData"];
}) {
  const map = useMapEvents({
    click(e) {
      setFormData({
        ...formData,
        startingPoint: e.latlng,
      });
    },
    moveend() {
      setFormData({
        ...formData,
        startingPoint: formData.startingPoint,
        mapArea: {
          northWest: {
            lat: map.getBounds().getNorthWest().lat,
            lng: map.getBounds().getNorthWest().lng,
          },
          southEast: {
            lat: map.getBounds().getSouthEast().lat,
            lng: map.getBounds().getSouthEast().lng,
          },
        },
      });
    },
  });

  return null;
}

export default function GameMapSelection({
  formData,
  setFormData,
  onNext,
  onBack,
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Select Game Area</h2>
        <p className="text-gray-600 mb-4">
          Pan and zoom the map to select the game area. Click to set the
          starting point.
        </p>

        <div className="h-[400px] w-full rounded-lg overflow-hidden border border-gray-300">
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            className="h-full w-full"
          >
            <MapTileLayers />
            <MapEvents setFormData={setFormData} formData={formData} />
            {formData.startingPoint && (
              <Marker
                position={formData.startingPoint}
                icon={getMarkerIcon("start")}
              />
            )}
          </MapContainer>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!formData.mapArea}
          className="bg-forest-pine text-forest-mist px-4 py-2 rounded-md hover:bg-forest-moss disabled:bg-gray-300"
        >
          Next
        </button>
      </div>
    </div>
  );
}
