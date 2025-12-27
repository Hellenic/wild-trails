import React from "react";
import { LayersControl, TileLayer } from "react-leaflet";
import { useUserPreferences } from "@/hooks/useUserPreferences";

const MML_API_KEY = process.env.NEXT_PUBLIC_MML_API_KEY;

export function MapTileLayers() {
  const { preferences } = useUserPreferences();

  // Map user preference to layer name
  const getDefaultLayer = () => {
    switch (preferences.map_tile_layer) {
      case "topo":
        return "MML Terrain";
      case "street":
        return "OpenStreetMap";
      case "satellite":
        return "Satellite"; // We'll add this if needed
      default:
        return "MML Terrain";
    }
  };

  const defaultLayer = getDefaultLayer();

  return (
    <LayersControl position="topright">
      <LayersControl.BaseLayer checked={defaultLayer === "MML Terrain"} name="MML Terrain">
        <TileLayer
          attribution='&copy; <a href="https://www.maanmittauslaitos.fi/">Maanmittauslaitos</a>'
          url={`https://avoin-karttakuva.maanmittauslaitos.fi/avoin/wmts/1.0.0/maastokartta/default/WGS84_Pseudo-Mercator/{z}/{y}/{x}.png?api-key=${MML_API_KEY}`}
        />
      </LayersControl.BaseLayer>
      <LayersControl.BaseLayer checked={defaultLayer === "OpenStreetMap"} name="OpenStreetMap">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </LayersControl.BaseLayer>
    </LayersControl>
  );
}
