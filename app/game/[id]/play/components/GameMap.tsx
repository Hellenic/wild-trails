import dynamic from "next/dynamic";

export const GameMap = dynamic(
  () => import("../../../components/leaflet/GameMap"),
  {
    ssr: false,
  }
);
