import dynamic from "next/dynamic";

export const StartingPointMap = dynamic(
  () => import("../../../components/leaflet/StartingPointPreviewMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-surface-dark-elevated animate-pulse rounded-lg flex items-center justify-center">
        <span className="text-gray-500 text-sm">Loading map...</span>
      </div>
    ),
  }
);

