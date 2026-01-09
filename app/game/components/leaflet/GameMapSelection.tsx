import React from "react";
import { MapContainer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Game } from "@/types/game";
import { LatLngTuple } from "leaflet";
import { LatLng as CustomLatLng } from "@/utils/map";
import { getMarkerIcon } from "./leaflet.utils";
import { MapTileLayers } from "./MapTileLayers";
import { Button } from "@/app/components/ui";

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
        <h2 className="text-xl font-bold text-white mb-4">
          Select Game Area
        </h2>
        <p className="text-gray-400 mb-4">
          Pan and zoom the map to select the game area. Click to set the desired
          approximate starting point.
        </p>

        <div className="h-[400px] w-full rounded-lg overflow-hidden border border-white/20">
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
        <Button
          type="button"
          onClick={onBack}
          variant="secondary"
          size="md"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={onNext}
          disabled={!formData.mapArea}
          variant="primary"
          size="md"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
