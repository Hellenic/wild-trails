"use client";
import { LatLng } from "@/utils/map";
import React, { createContext, useContext, useState } from "react";
import { useLocationTracking } from "@/hooks/useLocationTracking";

interface GameContextType {
  requestPermissions: () => Promise<boolean>;
  playerLocation: LatLng | null;
  distanceTravelled: number;
  startLocationTracking: (gameId?: string, playerId?: string) => Promise<void>;
  stopLocationTracking: () => void;
  isTracking: boolean;
  sendLocalNotification: (title: string, body: string) => void;
}

const GameContext = createContext<GameContextType | null>(null);

export const useGameContext = (
  startTrackingImmediately: boolean = false,
  gameId?: string,
  playerId?: string
) => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGameContext must be used within a GameContextProvider");
  }

  if (startTrackingImmediately) {
    context.startLocationTracking(gameId, playerId);
  }

  return context;
};

export const GameContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [, setServiceWorkerRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  const {
    location: playerLocation,
    distanceTravelled,
    startTracking,
    stopTracking,
    isTracking,
  } = useLocationTracking();

  const sendLocalNotification = (title: string, body: string) => {
    navigator.serviceWorker.ready.then((registration) => {
      registration.active?.postMessage({
        type: "SEND_NOTIFICATION",
        title,
        body,
      });
    });
  };

  const registerServiceWorker = async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      console.error("Service Worker is not supported");
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      setServiceWorkerRegistration(registration);
      return true;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      return false;
    }
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    if (!("geolocation" in navigator)) {
      console.error("Geolocation is not supported");
      return false;
    }

    try {
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      return true;
    } catch (error) {
      console.error("Error requesting location permission:", error);
      return false;
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.error("Notifications are not supported");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    const results = await Promise.all([
      registerServiceWorker(),
      requestLocationPermission(),
      requestNotificationPermission(),
    ]);

    const allPermissionsGranted = results.every((result) => result === true);
    setPermissionsGranted(allPermissionsGranted);
    return allPermissionsGranted;
  };

  const value = {
    permissionsGranted,
    requestPermissions,
    playerLocation,
    distanceTravelled,
    startLocationTracking: startTracking,
    stopLocationTracking: stopTracking,
    isTracking,
    sendLocalNotification,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
