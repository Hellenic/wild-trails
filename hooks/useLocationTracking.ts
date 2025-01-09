import { useState, useEffect, useCallback, useRef } from "react";
import { LatLng } from "@/utils/map";

export function useLocationTracking() {
  const [location, setLocation] = useState<LatLng | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const startTracking = useCallback(async () => {
    if (typeof navigator.geolocation === "undefined") {
      console.error("Geolocation is not supported");
      return;
    }

    try {
      const permission = await navigator.permissions.query({
        name: "geolocation",
      });
      if (permission.state === "denied") {
        console.error("Geolocation permission denied");
        return;
      }

      const id = navigator.geolocation.watchPosition(
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

      watchIdRef.current = id;
    } catch (error) {
      console.error("Error tracking location:", error);
    }
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    location,
    isTracking: watchIdRef.current !== null,
    startTracking,
    stopTracking,
  };
}
