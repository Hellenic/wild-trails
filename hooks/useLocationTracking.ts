import { useState, useEffect, useCallback, useRef } from "react";
import { LatLng } from "@/utils/map";
import { createClient } from "@/lib/supabase/client";

type LocationPayload = {
  game_id: string;
  player_id: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  altitude_accuracy: number | null;
  accuracy: number;
  speed: number | null;
  heading: number | null;
};

async function streamLocation(payload: LocationPayload) {
  const supabase = createClient();
  try {
    const { error } = await supabase.from("player_locations").insert(payload);

    if (error) throw error;
  } catch (error) {
    console.error("Failed to store location:", error);
  }
}

// Add helper function for distance calculation using Haversine formula
function calculateDistance(
  from: GeolocationCoordinates,
  to: GeolocationCoordinates
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (from.latitude * Math.PI) / 180;
  const φ2 = (to.latitude * Math.PI) / 180;
  const Δφ = ((to.latitude - from.latitude) * Math.PI) / 180;
  const Δλ = ((to.longitude - from.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export function useLocationTracking() {
  const [location, setLocation] = useState<LatLng | null>(null);
  const [distanceTravelled, setDistanceTravelled] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<GeolocationCoordinates | null>(null);

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
              const distance = calculateDistance(
                lastLocationRef.current,
                position.coords
              );
              setDistanceTravelled((prev) => prev + distance);
            }

            lastLocationRef.current = position.coords;

            if (gameId && playerId) {
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
