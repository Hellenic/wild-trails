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
import { Button } from "@/app/components/ui/Button";
import { Icon } from "@/app/components/ui/Icon";
import { GlassPanel } from "@/app/components/ui/GlassPanel";
import { Input } from "@/app/components/ui/Input";

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
      <main className="min-h-screen flex items-center justify-center dark:bg-background-dark bg-background-light">
        <div className="text-center">
          <div className="animate-pulse">
            <Icon name="person" size="xl" className="text-primary mb-4" />
            <div className="text-white">Loading profile...</div>
          </div>
        </div>
      </main>
    );
  }

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <main className="min-h-screen dark:bg-background-dark bg-background-light relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background-dark via-surface-dark to-background-dark opacity-95" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2313ec13' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Icon name="person" size="lg" className="text-primary" />
              <h1 className="text-3xl lg:text-4xl font-black text-white">
                Profile
              </h1>
            </div>
            <Link href="/">
              <Button variant="secondary">
                <Icon name="home" size="sm" className="mr-2" />
                Home
              </Button>
            </Link>
          </div>
          {/* Error/Success Messages */}
          {error && (
            <GlassPanel className="mb-6 p-4 border-red-500/50">
              <div className="flex items-center gap-3 text-red-400">
                <Icon name="error" size="sm" />
                <span>{error}</span>
              </div>
            </GlassPanel>
          )}
          {successMessage && (
            <GlassPanel className="mb-6 p-4 border-primary/50">
              <div className="flex items-center gap-3 text-primary">
                <Icon name="check_circle" size="sm" />
                <span>{successMessage}</span>
              </div>
            </GlassPanel>
          )}

          {/* User Info */}
          <GlassPanel className="p-6 lg:p-8 mb-6">
            <h2 className="text-2xl font-bold text-white mb-6">
              User Information
            </h2>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary text-primary flex items-center justify-center text-2xl font-bold">
                {profile.display_name
                  ? profile.display_name.substring(0, 2).toUpperCase()
                  : getInitials(user?.email || "")}
              </div>
              <div className="flex-1">
                <Input
                  label="Display Name"
                  value={profile.display_name || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, display_name: e.target.value })
                  }
                  placeholder="Enter your name"
                />
              </div>
            </div>
            <div className="text-sm text-gray-400">
              <span className="text-gray-300 font-medium">Email:</span> {user?.email}
            </div>
          </GlassPanel>

          {/* Preferences */}
          <GlassPanel className="p-6 lg:p-8 mb-6">
            <h2 className="text-2xl font-bold text-white mb-6">
              Preferences
            </h2>
            <div className="space-y-6">
              {/* Distance Unit */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Distance Units
                </label>
                <div className="flex gap-3">
                  <Button
                    variant={profile.preferences.distance_unit === "km" ? "primary" : "outline"}
                    onClick={() =>
                      setProfile({
                        ...profile,
                        preferences: { ...profile.preferences, distance_unit: "km" },
                      })
                    }
                  >
                    Kilometers (km)
                  </Button>
                  <Button
                    variant={profile.preferences.distance_unit === "miles" ? "primary" : "outline"}
                    onClick={() =>
                      setProfile({
                        ...profile,
                        preferences: { ...profile.preferences, distance_unit: "miles" },
                      })
                    }
                  >
                    Miles (mi)
                  </Button>
                </div>
              </div>

              {/* Map Tile Layer */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Map Style
                </label>
                <div className="flex gap-3 flex-wrap">
                  {(["topo", "street", "satellite"] as const).map((layer) => (
                    <Button
                      key={layer}
                      variant={profile.preferences.map_tile_layer === layer ? "primary" : "outline"}
                      onClick={() =>
                        setProfile({
                          ...profile,
                          preferences: { ...profile.preferences, map_tile_layer: layer },
                        })
                      }
                    >
                      {layer === "topo" ? "Topographic" : layer.charAt(0).toUpperCase() + layer.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Sound Effects */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300">
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
                      ? "bg-primary"
                      : "bg-gray-600"
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
              <div className="flex items-center justify-between py-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300">
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
                      ? "bg-primary"
                      : "bg-gray-600"
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

            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={savePreferences}
              disabled={saving}
              className="mt-6"
            >
              <Icon name="save" size="sm" className="mr-2" />
              {saving ? "Saving..." : "Save Preferences"}
            </Button>
          </GlassPanel>

          {/* Statistics */}
          <GlassPanel className="p-6 lg:p-8 mb-6">
            <h2 className="text-2xl font-bold text-white mb-6">
              Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-6 bg-surface-dark-elevated rounded-xl border border-white/10">
                <div className="text-4xl font-black text-primary mb-2">
                  {stats.totalGames}
                </div>
                <div className="text-sm text-gray-400">Total Games Created</div>
              </div>
              <div className="text-center p-6 bg-surface-dark-elevated rounded-xl border border-white/10">
                <div className="text-4xl font-black text-primary mb-2">
                  {stats.completedGames}
                </div>
                <div className="text-sm text-gray-400">Games Completed</div>
              </div>
              <div className="text-center p-6 bg-surface-dark-elevated rounded-xl border border-white/10">
                <div className="text-4xl font-black text-primary mb-2">
                  {stats.totalDistance.toFixed(1)}
                </div>
                <div className="text-sm text-gray-400">Total Distance (km)</div>
              </div>
            </div>
          </GlassPanel>

          {/* Account Actions */}
          <GlassPanel className="p-6 lg:p-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Account Actions
            </h2>
            <div className="space-y-3">
              <Link href="/games" className="block">
                <Button variant="secondary" fullWidth size="lg">
                  <Icon name="list" size="sm" className="mr-2" />
                  View My Games
                </Button>
              </Link>
              <Button
                variant="outline"
                fullWidth
                size="lg"
                onClick={handleSignOut}
              >
                <Icon name="logout" size="sm" className="mr-2" />
                Sign Out
              </Button>
              <Button
                variant="ghost"
                fullWidth
                size="lg"
                onClick={handleDeleteAccount}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Icon name="warning" size="sm" className="mr-2" />
                Delete Account
              </Button>
            </div>
          </GlassPanel>
        </div>
      </div>
    </main>
  );
}
