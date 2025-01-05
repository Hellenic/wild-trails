import { useState, useEffect } from "react";
import { LatLng } from "@/utils/map";

export function useLocationTracking() {
  const [location, setLocation] = useState<LatLng | null>(null);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = new LatLng(
          position.coords.latitude,
          position.coords.longitude
        );
        setLocation(newLocation);
      },
      (error) => {
        console.error("Error getting location:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return location;
}
