import { useState, useEffect, useCallback, useRef } from "react";
import { LatLng } from "@/utils/map";
import { locationAPI } from "@/lib/api/client";
import type { LocationUpdateInput, ProximityEvent } from "@/lib/api/validation";

export type ProximityEventCallback = (events: ProximityEvent[]) => void;

async function streamLocation(
  payload: LocationUpdateInput,
  onProximityEvents?: ProximityEventCallback
): Promise<ProximityEvent[]> {
  try {
    const response = await locationAPI.update(payload);
    const events = response.proximity_events || [];
    
    // Call the callback with proximity events if any
    if (events.length > 0 && onProximityEvents) {
      onProximityEvents(events);
    }
    
    return events;
  } catch (error) {
    console.error("Failed to store location:", error);
    return [];
  }
}


interface UseLocationTrackingOptions {
  onProximityEvents?: ProximityEventCallback;
}

export function useLocationTracking(options: UseLocationTrackingOptions = {}) {
  const { onProximityEvents } = options;
  const [location, setLocation] = useState<LatLng | null>(null);
  const [distanceTravelled, setDistanceTravelled] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<GeolocationCoordinates | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const retryCountRef = useRef<number>(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasGivenUpRef = useRef<boolean>(false); // Flag to stop processing errors after giving up
  // Store callback in ref to avoid re-creating startTracking on callback changes
  const onProximityEventsRef = useRef(onProximityEvents);
  onProximityEventsRef.current = onProximityEvents;
  const maxRetries = 3;
  const baseRetryDelay = 2000; // Start with 2 seconds

  const startTracking = useCallback(
    async (gameId?: string, playerId?: string) => {
      if (typeof navigator.geolocation === "undefined") {
        const errorMsg = "Geolocation is not supported by your browser";
        setLocationError(errorMsg);
        console.error(errorMsg);
        return;
      }

      try {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });
        if (permission.state === "denied") {
          const errorMsg = "Geolocation permission denied. Please enable location access in your browser settings.";
          setLocationError(errorMsg);
          console.error(errorMsg);
          return;
        }

        // Clear any existing retry timeout and reset flags
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
        hasGivenUpRef.current = false;

        const handleLocationSuccess = (position: GeolocationPosition) => {
          // Reset retry count and error on successful location
          retryCountRef.current = 0;
          setLocationError(null);

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
          setAccuracy(accuracy);

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
              streamLocation(
                {
                  latitude,
                  longitude,
                  altitude,
                  altitude_accuracy: altitudeAccuracy,
                  accuracy,
                  heading,
                  speed,
                  game_id: gameId,
                  player_id: playerId,
                },
                onProximityEventsRef.current
              ).catch((err) => {
                console.warn(
                  "Error occurred while streaming location to the backend",
                  err
                );
              });
            }
          }
        };

        const handleLocationError = (error: GeolocationPositionError) => {
          // If we've already given up, ignore all further errors
          if (hasGivenUpRef.current) {
            return;
          }

          // Map error codes to user-friendly messages
          let errorMsg: string;
          let shouldRetry = false;

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = "Location permission denied. Please enable location access.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg = "Location information unavailable. Please check your device's location settings.";
              shouldRetry = true;
              break;
            case error.TIMEOUT:
              errorMsg = "Location request timed out. Trying to acquire GPS signal...";
              shouldRetry = true;
              break;
            default:
              errorMsg = `Location error: ${error.message}`;
              shouldRetry = true;
          }

          // Only log error once per retry attempt to avoid spam
          if (retryCountRef.current === 0) {
            console.error(`Geolocation error (${error.code}):`, errorMsg);
          }

          setLocationError(errorMsg);

          // Implement exponential backoff retry logic
          if (shouldRetry && retryCountRef.current < maxRetries) {
            retryCountRef.current += 1;
            const retryDelay = baseRetryDelay * Math.pow(2, retryCountRef.current - 1);
            
            console.log(
              `Retrying location acquisition (attempt ${retryCountRef.current}/${maxRetries}) in ${retryDelay / 1000}s...`
            );

            retryTimeoutRef.current = setTimeout(() => {
              // Clear the old watch and start a new one
              if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
              }
              
              const newWatchId = navigator.geolocation.watchPosition(
                handleLocationSuccess,
                handleLocationError,
                {
                  enableHighAccuracy: true,
                  timeout: 10000, // Increased timeout for retries
                  maximumAge: 0,
                }
              );
              watchIdRef.current = newWatchId;
            }, retryDelay);
          } else if (retryCountRef.current >= maxRetries) {
            // Mark that we've given up to stop all further error processing
            hasGivenUpRef.current = true;
            
            // Stop watching to prevent continuous error spam
            if (watchIdRef.current !== null) {
              navigator.geolocation.clearWatch(watchIdRef.current);
              watchIdRef.current = null;
            }
            
            // Log this once when we first hit max retries
            console.error(
              `Failed to acquire location after ${maxRetries} attempts. Please check your device's GPS signal.`
            );
            
            setLocationError(
              "Unable to acquire location. Please ensure GPS is enabled and you have a clear view of the sky."
            );
            setIsTracking(false);
          }
        };

        const id = navigator.geolocation.watchPosition(
          handleLocationSuccess,
          handleLocationError,
          {
            enableHighAccuracy: true,
            timeout: 10000, // Increased from 5s to 10s
            maximumAge: 0,
          }
        );

        watchIdRef.current = id;
        setIsTracking(true);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error tracking location";
        setLocationError(errorMsg);
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
      retryCountRef.current = 0;
      hasGivenUpRef.current = false;
      setDistanceTravelled(0);
      setIsTracking(false);
      setLocationError(null);
      setAccuracy(null);
    }

    // Clear any pending retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
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
    locationError, // Return any location errors
    accuracy, // Return GPS accuracy in meters
    startTracking,
    stopTracking,
  };
}
