import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  UserPreferences,
  DEFAULT_USER_PREFERENCES,
  parseUserPreferences,
  UserMetadata,
} from "@/types/user";

/**
 * Hook to access and manage user preferences
 * Loads preferences from Supabase Auth user metadata
 */
export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(
    DEFAULT_USER_PREFERENCES
  );
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadPreferences();

    // Subscribe to auth changes to reload preferences
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadPreferences();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadPreferences = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const metadata = data.user?.user_metadata as UserMetadata | undefined;
      const userPrefs = parseUserPreferences(metadata);
      setPreferences(userPrefs);
    } catch (error) {
      console.error("Failed to load user preferences:", error);
      setPreferences(DEFAULT_USER_PREFERENCES);
    } finally {
      setLoading(false);
    }
  };

  return { preferences, loading };
}

