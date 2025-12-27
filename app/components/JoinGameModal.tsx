"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, GlassPanel, Icon } from "./ui";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-dark/80 backdrop-blur-sm p-4">
      <GlassPanel className="max-w-md w-full p-6 animate-scale-in border border-white/10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Icon name="group_add" className="text-primary" />
            <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight">
              Join Game
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 rounded-full"
            aria-label="Close"
          >
            <Icon name="close" />
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-start gap-3">
            <Icon name="error" size="sm" className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
          autoComplete="off"
        >
          {/* Hidden input to further discourage autofill */}
          <input type="text" style={{ display: 'none' }} />
          <input type="password" style={{ display: 'none' }} />

          <Input
            id="join-game-code"
            name="game-code"
            label="Game Code"
            type="text"
            value={gameCode}
            onChange={(e) => setGameCode(e.target.value)}
            placeholder="Enter game code (UUID)"
            required
            autoComplete="off"
            className="font-mono"
          />
          <p className="text-xs text-gray-400 -mt-4 px-1">
            The game creator will provide you with this code
          </p>

          <Input
            id="join-game-password"
            name="game-password"
            label="Password (if required)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoComplete="new-password"
          />

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              fullWidth
              className="order-2 sm:order-1"
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
              className="order-1 sm:order-2"
            >
              <Icon name="play_arrow" size="sm" />
              Join Game
            </Button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Icon name="info" size="sm" className="text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400 leading-relaxed">
              <strong className="text-primary">Note:</strong> Multiplayer features are coming in Phase 2.
              Currently, you can only join single-player games in setup phase.
            </p>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
