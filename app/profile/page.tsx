"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import type {
  UserProfile,
  UserMetadata,
} from "@/types/user";
import { parseUserProfile, DEFAULT_USER_PREFERENCES } from "@/types/user";

interface GameStats {
  totalGames: number;
  completedGames: number;
  totalDistance: number;
}

export default function ProfilePage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<UserProfile>({
    preferences: DEFAULT_USER_PREFERENCES,
  });
  const [stats, setStats] = useState<GameStats>({
    totalGames: 0,
    completedGames: 0,
    totalDistance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && user) {
      loadUserData();
    } else if (!userLoading && !user) {
      router.push("/login");
    }
  }, [user, userLoading, router]);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Load preferences from user metadata with type safety
      const { data: userData } = await supabase.auth.getUser();
      const userProfile = parseUserProfile(
        userData.user?.user_metadata as UserMetadata | undefined
      );
      setProfile(userProfile);

      // Load game statistics
      const { data: games, error: gamesError } = await supabase
        .from("games")
        .select("id, status, max_radius")
        .eq("creator_id", user!.id);

      if (gamesError) throw gamesError;

      const completedGames = games?.filter((g) => g.status === "completed") || [];
      const totalDistance = completedGames.reduce(
        (sum, g) => sum + g.max_radius * 2,
        0
      );

      setStats({
        totalGames: games?.length || 0,
        completedGames: completedGames.length,
        totalDistance: totalDistance / 1000, // Convert to km
      });
    } catch (err) {
      console.error("Error loading user data:", err);
      setError("Failed to load profile data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      // Construct strongly-typed metadata
      const metadata: UserMetadata = {
        display_name: profile.display_name,
        preferences: profile.preferences,
      };

      const { error: updateError } = await supabase.auth.updateUser({
        data: metadata,
      });

      if (updateError) throw updateError;

      setSuccessMessage("Preferences saved successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error saving preferences:", err);
      setError("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone. All your games will be permanently deleted."
    );
    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      "This is your last chance. Are you absolutely sure you want to delete your account?"
    );
    if (!doubleConfirm) return;

    try {
      // TODO: Implement proper account deletion
      // This should delete all user data including games, players, etc.
      alert("Account deletion is not yet implemented. Please contact support.");
    } catch (err) {
      console.error("Error deleting account:", err);
      setError("Failed to delete account. Please contact support.");
    }
  };

  if (userLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-foreground">Loading profile...</div>
      </main>
    );
  }

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-forest-pine text-forest-mist p-6 shadow-md">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-serif font-bold">Profile</h1>
          <Link
            href="/"
            className="px-4 py-2 bg-forest-mist/20 hover:bg-forest-mist/30 rounded-lg transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {successMessage}
          </div>
        )}

        {/* User Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-serif font-bold text-forest-deep mb-4">
            User Information
          </h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-forest-pine text-forest-mist flex items-center justify-center text-2xl font-bold">
              {profile.display_name
                ? profile.display_name.substring(0, 2).toUpperCase()
                : getInitials(user?.email || "")}
            </div>
            <div>
              <div className="text-sm text-gray-600">Display Name</div>
              <input
                type="text"
                value={profile.display_name || ""}
                onChange={(e) =>
                  setProfile({ ...profile, display_name: e.target.value })
                }
                placeholder="Enter your name"
                className="text-lg font-medium text-forest-deep border-b border-gray-300 focus:border-forest-pine outline-none"
              />
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <strong>Email:</strong> {user?.email}
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-serif font-bold text-forest-deep mb-4">
            Preferences
          </h2>
          <div className="space-y-6">
            {/* Distance Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Distance Units
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() =>
                    setProfile({
                      ...profile,
                      preferences: { ...profile.preferences, distance_unit: "km" },
                    })
                  }
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    profile.preferences.distance_unit === "km"
                      ? "border-forest-pine bg-forest-pine text-forest-mist"
                      : "border-gray-300 text-gray-700 hover:border-forest-pine"
                  }`}
                >
                  Kilometers (km)
                </button>
                <button
                  onClick={() =>
                    setProfile({
                      ...profile,
                      preferences: { ...profile.preferences, distance_unit: "miles" },
                    })
                  }
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    profile.preferences.distance_unit === "miles"
                      ? "border-forest-pine bg-forest-pine text-forest-mist"
                      : "border-gray-300 text-gray-700 hover:border-forest-pine"
                  }`}
                >
                  Miles (mi)
                </button>
              </div>
            </div>

            {/* Map Tile Layer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Map Style
              </label>
              <div className="flex gap-4 flex-wrap">
                {(["topo", "street", "satellite"] as const).map((layer) => (
                  <button
                    key={layer}
                    onClick={() =>
                      setProfile({
                        ...profile,
                        preferences: { ...profile.preferences, map_tile_layer: layer },
                      })
                    }
                    className={`px-4 py-2 rounded-lg border-2 transition-colors capitalize ${
                      profile.preferences.map_tile_layer === layer
                        ? "border-forest-pine bg-forest-pine text-forest-mist"
                        : "border-gray-300 text-gray-700 hover:border-forest-pine"
                    }`}
                  >
                    {layer === "topo" ? "Topographic" : layer}
                  </button>
                ))}
              </div>
            </div>

            {/* Sound Effects */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Sound Effects
                </label>
                <p className="text-xs text-gray-500">
                  Play sounds when discovering waypoints and goals
                </p>
              </div>
              <button
                onClick={() =>
                  setProfile({
                    ...profile,
                    preferences: {
                      ...profile.preferences,
                      sound_effects_enabled: !profile.preferences.sound_effects_enabled,
                    },
                  })
                }
                className={`w-14 h-8 rounded-full transition-colors ${
                  profile.preferences.sound_effects_enabled
                    ? "bg-forest-pine"
                    : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                    profile.preferences.sound_effects_enabled
                      ? "translate-x-7"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Notifications
                </label>
                <p className="text-xs text-gray-500">
                  Receive browser push notifications for game events
                </p>
              </div>
              <button
                onClick={() =>
                  setProfile({
                    ...profile,
                    preferences: {
                      ...profile.preferences,
                      notifications_enabled: !profile.preferences.notifications_enabled,
                    },
                  })
                }
                className={`w-14 h-8 rounded-full transition-colors ${
                  profile.preferences.notifications_enabled
                    ? "bg-forest-pine"
                    : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                    profile.preferences.notifications_enabled
                      ? "translate-x-7"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <button
            onClick={savePreferences}
            disabled={saving}
            className="mt-6 w-full px-6 py-3 bg-forest-pine text-forest-mist rounded-lg hover:bg-forest-moss transition-colors font-medium disabled:opacity-50"
          >
            {saving ? "Saving..." : "💾 Save Preferences"}
          </button>
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-serif font-bold text-forest-deep mb-4">
            Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-forest-pine/10 rounded-lg">
              <div className="text-3xl font-bold text-forest-deep">
                {stats.totalGames}
              </div>
              <div className="text-sm text-gray-600">Total Games Created</div>
            </div>
            <div className="text-center p-4 bg-forest-pine/10 rounded-lg">
              <div className="text-3xl font-bold text-forest-deep">
                {stats.completedGames}
              </div>
              <div className="text-sm text-gray-600">Games Completed</div>
            </div>
            <div className="text-center p-4 bg-forest-pine/10 rounded-lg">
              <div className="text-3xl font-bold text-forest-deep">
                {stats.totalDistance.toFixed(1)} km
              </div>
              <div className="text-sm text-gray-600">Total Distance</div>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-serif font-bold text-forest-deep mb-4">
            Account Actions
          </h2>
          <div className="space-y-3">
            <Link
              href="/games"
              className="block w-full px-6 py-3 bg-forest-bark/30 text-forest-deep border-2 border-forest-bark rounded-lg hover:bg-forest-bark/40 transition-colors font-medium text-center"
            >
              📋 View My Games
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full px-6 py-3 bg-forest-bark text-forest-mist rounded-lg hover:bg-forest-bark/80 transition-colors font-medium"
            >
              🚪 Sign Out
            </button>
            <button
              onClick={handleDeleteAccount}
              className="w-full px-6 py-3 bg-red-100 text-red-700 border-2 border-red-300 rounded-lg hover:bg-red-200 transition-colors font-medium"
            >
              ⚠️ Delete Account
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
