import dynamic from "next/dynamic";

export const GameMapSelection = dynamic(
  () => import("../../components/leaflet/GameMapSelection"),
  {
    ssr: false,
  }
);
