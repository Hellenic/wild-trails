"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import type { Game, GameStatus } from "@/types/game";
import { useRouter } from "next/navigation";

type GameListItem = Game;

export default function GamesPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const supabase = createClient();
  
  const [games, setGames] = useState<GameListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<GameStatus | "all">("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && user) {
      fetchGames();
    } else if (!userLoading && !user) {
      router.push("/login");
    }
  }, [user, userLoading, router]);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("games")
        .select("*")
        .eq("creator_id", user!.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setGames((data as GameListItem[]) || []);
    } catch (err) {
      console.error("Error fetching games:", err);
      setError("Failed to load games. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from("games")
        .delete()
        .eq("id", gameId);

      if (deleteError) throw deleteError;
      
      // Remove from local state
      setGames(games.filter(g => g.id !== gameId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Error deleting game:", err);
      setError("Failed to delete game. Please try again.");
    }
  };

  const getStatusBadgeClass = (status: GameStatus) => {
    const baseClasses = "px-2 py-1 rounded text-xs font-medium";
    switch (status) {
      case "setup":
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case "ready":
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case "active":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "completed":
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case "failed":
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getActionButton = (game: GameListItem) => {
    switch (game.status) {
      case "setup":
      case "ready":
        return (
          <Link
            href={`/game/${game.id}/setup`}
            className="px-3 py-1 bg-forest-pine text-forest-mist rounded hover:bg-forest-moss transition-colors text-sm"
          >
            View Setup
          </Link>
        );
      case "active":
        return (
          <Link
            href={`/game/${game.id}/play`}
            className="px-3 py-1 bg-forest-pine text-forest-mist rounded hover:bg-forest-moss transition-colors text-sm"
          >
            Resume Game
          </Link>
        );
      case "completed":
        return (
          <Link
            href={`/game/${game.id}/results`}
            className="px-3 py-1 bg-forest-pine text-forest-mist rounded hover:bg-forest-moss transition-colors text-sm"
          >
            View Results
          </Link>
        );
      case "failed":
        return (
          <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded text-sm">
            Generation Failed
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }
    return `${minutes}m`;
  };

  const filteredGames = filterStatus === "all" 
    ? games 
    : games.filter(g => g.status === filterStatus);

  if (userLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-foreground">Loading games...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-serif font-bold text-forest-deep mb-2">
              My Games
            </h1>
            <p className="text-gray-600">
              View and manage your Wild Trails adventures
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-forest-bark text-forest-mist rounded-lg hover:bg-forest-bark/80 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Filter Bar */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-4 py-2 rounded ${
              filterStatus === "all"
                ? "bg-forest-pine text-forest-mist"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            } transition-colors`}
          >
            All ({games.length})
          </button>
          {(["setup", "ready", "active", "completed", "failed"] as GameStatus[]).map(
            (status) => {
              const count = games.filter((g) => g.status === status).length;
              return (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded capitalize ${
                    filterStatus === status
                      ? "bg-forest-pine text-forest-mist"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  } transition-colors`}
                >
                  {status} ({count})
                </button>
              );
            }
          )}
        </div>

        {/* Games List */}
        {filteredGames.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-4 text-6xl">🏕️</div>
            <h2 className="text-2xl font-serif font-bold text-forest-deep mb-2">
              {filterStatus === "all" 
                ? "No games yet" 
                : `No ${filterStatus} games`}
            </h2>
            <p className="text-gray-600 mb-6">
              {filterStatus === "all"
                ? "Create your first Wild Trails adventure!"
                : "Try a different filter or create a new game."}
            </p>
            {filterStatus === "all" && (
              <Link
                href="/game/create"
                className="inline-block px-6 py-3 bg-forest-pine text-forest-mist rounded-lg hover:bg-forest-moss transition-colors"
              >
                Create Your First Game
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGames.map((game) => (
              <div
                key={game.id}
                className="bg-white rounded-lg shadow-md p-4 md:p-6 border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Game Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-serif font-bold text-forest-deep">
                        {game.name}
                      </h3>
                      <span className={getStatusBadgeClass(game.status)}>
                        {game.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span>
                        📏 {formatDistance(game.max_radius * 2)}
                      </span>
                      <span>
                        ⏱️ {formatDuration(game.duration)}
                      </span>
                      <span>
                        📅 {formatDate(game.created_at)}
                      </span>
                      <span className="capitalize">
                        🎮 {game.game_mode.replace("_", " ")}
                      </span>
                    </div>
                    {game.last_processing_error && (
                      <div className="mt-2 text-sm text-red-600">
                        ⚠️ {game.last_processing_error}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 items-center">
                    {getActionButton(game)}
                    
                    {/* Delete Button */}
                    {deleteConfirm === game.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteGame(game.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(game.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
                        title="Delete game"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
