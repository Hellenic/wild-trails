"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Icon } from "./ui";

interface JoinGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinGameModal({ isOpen, onClose }: JoinGameModalProps) {
  const router = useRouter();
  const supabase = createClient();
  const [gameCode, setGameCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Fetch game details
      const { data: game, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameCode)
        .single();

      if (gameError || !game) {
        setError("Game not found. Please check the game code.");
        setLoading(false);
        return;
      }

      // Check if multiplayer (Phase 1 restriction)
      if (game.player_count > 1 || game.game_mode !== "single_player") {
        setError(
          "Multiplayer games are not yet supported. This feature is coming in Phase 2!"
        );
        setLoading(false);
        return;
      }

      // Verify password if required
      if (game.password && game.password !== password) {
        setError("Incorrect password.");
        setLoading(false);
        return;
      }

      // Check game status
      if (game.status === "completed") {
        setError("This game has already been completed.");
        setLoading(false);
        return;
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in to join a game.");
        setLoading(false);
        return;
      }

      // Check if user is already a player
      const { data: existingPlayer } = await supabase
        .from("players")
        .select("*")
        .eq("game_id", gameCode)
        .eq("user_id", user.id)
        .single();

      if (existingPlayer) {
        // User is already in the game, redirect to setup
        router.push(`/game/${gameCode}/setup`);
        return;
      }

      // Join the game via API
      const response = await fetch(`/api/game/${gameCode}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to join game.");
        setLoading(false);
        return;
      }

      // Success - redirect to game setup
      router.push(`/game/${gameCode}/setup`);
    } catch (err) {
      console.error("Error joining game:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleClose = () => {
    setGameCode("");
    setPassword("");
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-scale-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-serif font-bold text-forest-deep">
            Join Game
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label
              htmlFor="join-game-code"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Game Code
            </label>
            <input
              id="join-game-code"
              name="game-code"
              type="text"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value)}
              placeholder="Enter game code (UUID)"
              required
              autoComplete="off"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-pine focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              The game creator will provide you with this code
            </p>
          </div>

          <div>
            <label
              htmlFor="join-game-password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password (if required)
            </label>
            <input
              id="join-game-password"
              name="game-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="off"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-pine focus:border-transparent outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              loadingText="Joining..."
              disabled={!gameCode}
              fullWidth
            >
              Join Game
            </Button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            💡 <strong>Note:</strong> Multiplayer features are coming in Phase 2.
            Currently, you can only join single-player games in setup phase.
          </p>
        </div>
      </div>
    </div>
  );
}
