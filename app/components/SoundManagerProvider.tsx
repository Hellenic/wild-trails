"use client";

import React, { createContext, useContext, useEffect } from "react";
import { soundManager } from "@/lib/audio/sounds";
import { useUserPreferences } from "@/hooks/useUserPreferences";

/**
 * Context for managing sound effects throughout the app
 * Automatically syncs with user preferences
 */
const SoundManagerContext = createContext<void>(undefined);

export function useSoundManager() {
  return useContext(SoundManagerContext);
}

interface SoundManagerProviderProps {
  children: React.ReactNode;
}

export function SoundManagerProvider({ children }: SoundManagerProviderProps) {
  const { preferences, loading } = useUserPreferences();

  // Initialize sound manager with user preferences
  useEffect(() => {
    if (!loading) {
      soundManager.loadPreferenceFromAuth();
    }
  }, [loading]);

  // Sync sound manager when preferences change
  useEffect(() => {
    if (!loading) {
      soundManager.setEnabled(preferences.sound_effects_enabled);
    }
  }, [preferences.sound_effects_enabled, loading]);

  return (
    <SoundManagerContext.Provider value={undefined}>
      {children}
    </SoundManagerContext.Provider>
  );
}

