import dynamic from "next/dynamic";

export const GameMasterMap = dynamic(
  () => import("../../../components/leaflet/GameMasterMap"),
  {
    ssr: false,
  }
);
