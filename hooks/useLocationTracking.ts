import { useState, useEffect, useCallback, useRef } from "react";
import { LatLng } from "@/utils/map";
import { locationAPI } from "@/lib/api/client";
import type { LocationUpdateInput } from "@/lib/api/validation";

async function streamLocation(payload: LocationUpdateInput) {
  try {
    const response = await locationAPI.update(payload);
    
    // Return proximity events if any
    return response.proximity_events || [];
  } catch (error) {
    console.error("Failed to store location:", error);
    return [];
  }
}


export function useLocationTracking() {
  const [location, setLocation] = useState<LatLng | null>(null);
  const [distanceTravelled, setDistanceTravelled] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<GeolocationCoordinates | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  const startTracking = useCallback(
    async (gameId?: string, playerId?: string) => {
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
            const {
              latitude,
              longitude,
              altitude,
              altitudeAccuracy,
              accuracy,
              heading,
              speed,
            } = position.coords;
            const newLocation = new LatLng(latitude, longitude);
            setLocation(newLocation);

            // Calculate distance if we have a previous location
            if (lastLocationRef.current) {
              const prevLocation = new LatLng(
                lastLocationRef.current.latitude,
                lastLocationRef.current.longitude
              );
              const currentLocation = new LatLng(
                position.coords.latitude,
                position.coords.longitude
              );
              const distance = prevLocation.distanceTo(currentLocation);
              setDistanceTravelled((prev) => prev + distance);
            }

            lastLocationRef.current = position.coords;

            if (gameId && playerId) {
              // Throttle API calls to once per second
              const now = Date.now();
              const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
              
              if (timeSinceLastUpdate >= 1000) {
                lastUpdateTimeRef.current = now;
                streamLocation({
                  latitude,
                  longitude,
                  altitude,
                  altitude_accuracy: altitudeAccuracy,
                  accuracy,
                  heading,
                  speed,
                  game_id: gameId,
                  player_id: playerId,
                }).catch((err) => {
                  console.warn(
                    "Error occurred while streaming location to the backend",
                    err
                  );
                });
              }
            }
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
        setIsTracking(true);
      } catch (error) {
        console.error("Error tracking location:", error);
      }
    },
    []
  );

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      lastLocationRef.current = null;
      lastUpdateTimeRef.current = 0;
      setDistanceTravelled(0);
      setIsTracking(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    location,
    isTracking,
    distanceTravelled, // Return the distance in meters
    startTracking,
    stopTracking,
  };
}
