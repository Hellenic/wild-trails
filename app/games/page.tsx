"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import type { Game, GameStatus } from "@/types/game";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/Button";
import { Icon } from "@/app/components/ui/Icon";
import { GlassPanel } from "@/app/components/ui/GlassPanel";

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
      setGames(data || []);
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
    const baseClasses = "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider";
    switch (status) {
      case "setup":
        return `${baseClasses} bg-yellow-500/20 text-yellow-400 border border-yellow-500/30`;
      case "ready":
        return `${baseClasses} bg-blue-500/20 text-blue-400 border border-blue-500/30`;
      case "active":
        return `${baseClasses} bg-green-500/20 text-green-400 border border-green-500/30`;
      case "completed":
        return `${baseClasses} bg-gray-500/20 text-gray-400 border border-gray-500/30`;
      case "failed":
        return `${baseClasses} bg-red-500/20 text-red-400 border border-red-500/30`;
      default:
        return `${baseClasses} bg-gray-500/20 text-gray-400 border border-gray-500/30`;
    }
  };

  const getActionButton = (game: GameListItem) => {
    switch (game.status) {
      case "setup":
      case "ready":
        return (
          <Link href={`/game/${game.id}/setup`}>
            <Button variant="secondary" size="sm">
              <Icon name="settings" className="mr-1 text-lg" />
              Setup
            </Button>
          </Link>
        );
      case "active":
        return (
          <Link href={`/game/${game.id}/play`}>
            <Button variant="primary" size="sm">
              <Icon name="play_arrow" className="mr-1 text-lg" />
              Resume
            </Button>
          </Link>
        );
      case "completed":
        return (
          <Link href={`/game/${game.id}/results`}>
            <Button variant="secondary" size="sm">
              <Icon name="analytics" className="mr-1 text-lg" />
              Results
            </Button>
          </Link>
        );
      case "failed":
        return (
          <Button variant="ghost" size="sm" disabled>
            <Icon name="error" className="mr-1 text-lg" />
            Failed
          </Button>
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
      <main className="min-h-screen flex items-center justify-center dark:bg-background-dark bg-background-light">
        <div className="text-center">
          <div className="animate-pulse">
            <Icon name="terrain" size="xl" className="text-primary mb-4" />
            <div className="text-white">Loading games...</div>
          </div>
        </div>
      </main>
    );
  }

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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Icon name="list" size="lg" className="text-primary" />
                <h1 className="text-3xl lg:text-4xl font-black text-white">
                  My Games
                </h1>
              </div>
              <p className="text-gray-400">
                View and manage your Wild Trails adventures
              </p>
            </div>
            <Link href="/">
              <Button variant="secondary">
                <Icon name="home" className="mr-2" />
                Home
              </Button>
            </Link>
          </div>

          {/* Error Message */}
          {error && (
            <GlassPanel className="mb-6 p-4 border-red-500/50">
              <div className="flex items-center gap-3 text-red-400">
                <Icon name="error" />
                <span>{error}</span>
              </div>
            </GlassPanel>
          )}

          {/* Filter Bar */}
          <div className="mb-6 flex gap-2 flex-wrap">
            <Button
              variant={filterStatus === "all" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setFilterStatus("all")}
            >
              All ({games.length})
            </Button>
            {(["setup", "ready", "active", "completed", "failed"] as GameStatus[]).map(
              (status) => {
                const count = games.filter((g) => g.status === status).length;
                return (
                  <Button
                    key={status}
                    variant={filterStatus === status ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setFilterStatus(status)}
                  >
                    <span className="capitalize">{status}</span> ({count})
                  </Button>
                );
              }
            )}
          </div>

          {/* Games List */}
          {filteredGames.length === 0 ? (
            <GlassPanel className="p-16 text-center">
              <Icon name="terrain" size="xl" className="text-primary/40 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                {filterStatus === "all" 
                  ? "No games yet" 
                  : `No ${filterStatus} games`}
              </h2>
              <p className="text-gray-400 mb-6">
                {filterStatus === "all"
                  ? "Create your first Wild Trails adventure!"
                  : "Try a different filter or create a new game."}
              </p>
              {filterStatus === "all" && (
                <Link href="/game/create">
                  <Button variant="primary" size="lg">
                    <Icon name="add" className="mr-2" />
                    Create Your First Game
                  </Button>
                </Link>
              )}
            </GlassPanel>
          ) : (
            <div className="space-y-4">
              {filteredGames.map((game) => (
                <GlassPanel
                  key={game.id}
                  className="p-6 hover:border-primary/30 transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Game Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <h3 className="text-xl font-bold text-white">
                          {game.name}
                        </h3>
                        <span className={getStatusBadgeClass(game.status)}>
                          {game.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Icon name="straighten" className="text-lg" />
                          {formatDistance(game.max_radius * 2)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="schedule" className="text-lg" />
                          {formatDuration(game.duration)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="calendar_today" className="text-lg" />
                          {formatDate(game.created_at)}
                        </span>
                        <span className="flex items-center gap-1 capitalize">
                          <Icon name="sports_esports" className="text-lg" />
                          {game.game_mode.replace("_", " ")}
                        </span>
                      </div>
                      {game.last_processing_error && (
                        <div className="mt-3 flex items-start gap-2 text-sm text-red-400">
                          <Icon name="warning" className="text-lg flex-shrink-0" />
                          <span>{game.last_processing_error}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 items-center flex-shrink-0">
                      {getActionButton(game)}
                      
                      {/* Delete Button */}
                      {deleteConfirm === game.id ? (
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleDeleteGame(game.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Confirm
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirm(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(game.id)}
                          title="Delete game"
                        >
                          <Icon name="delete" className="text-lg text-red-400" />
                        </Button>
                      )}
                    </div>
                  </div>
                </GlassPanel>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
