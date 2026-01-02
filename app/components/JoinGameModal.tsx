"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, GlassPanel, Icon } from "./ui";
import { ROLE_INFO, isRoleValidForGameMode, type GameRole } from "@/lib/game/roles";
import type { Game, Player } from "@/types/game";
import { GAME_ROLES } from "@/lib/game/constants";

interface JoinGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillCode?: string;
}

type JoinStep = "enter_code" | "select_role";

interface GameInfo {
  id: string;
  name: string;
  game_code: string | null;
  game_mode: Game["game_mode"];
  game_master: Game["game_master"];
  max_players: number | null;
  player_count: number;
  status: Game["status"];
  has_password: boolean;
  players: Pick<Player, "role" | "user_id">[];
  is_existing_player: boolean;
  existing_player_role: string | null;
}

export function JoinGameModal({ isOpen, onClose, prefillCode }: JoinGameModalProps) {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<JoinStep>("enter_code");
  const [gameCode, setGameCode] = useState(prefillCode || "");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<GameRole | null>(null);
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, [supabase.auth]);

  // Reset state helper - called from handleClose
  const resetState = () => {
    setStep("enter_code");
    setGameCode(prefillCode || "");
    setPassword("");
    setSelectedRole(null);
    setGameInfo(null);
    setError(null);
  };

  if (!isOpen) return null;

  // Check if a role is available (not taken by another player)
  const isRoleAvailable = (role: GameRole): boolean => {
    if (!gameInfo) return false;
    // Check if role is already taken by another player
    return !gameInfo.players.some(
      (p) => p.role === role && p.user_id !== currentUserId
    );
  };

  // Get available roles based on game mode and game master type
  // Uses centralized role validation from lib/game/roles.ts
  const getAvailableRoles = (): GameRole[] => {
    if (!gameInfo) return [];
        
    return GAME_ROLES
      .filter((role) => isRoleValidForGameMode(role, gameInfo.game_mode, gameInfo.game_master))
      .filter((role) => isRoleAvailable(role));
  };

  const handleFindGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Use server-side API for password validation (never expose password to client)
      const response = await fetch("/api/game/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: gameCode,
          password: password || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to find game.");
        setLoading(false);
        return;
      }

      const game = data as GameInfo;

      // Check if user is already a player
      if (game.is_existing_player) {
        // User is already in the game, redirect appropriately
        router.push(`/game/${game.id}/setup`);
        return;
      }

      // For single player games, just join directly
      if (game.game_mode === "single_player") {
        await joinGame(game.id, "player_a");
        return;
      }

      // Store game info and move to role selection
      setGameInfo(game);
      setStep("select_role");
      setLoading(false);
    } catch (err) {
      console.error("Error finding game:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const joinGame = async (gameId: string, role: GameRole) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/game/${gameId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to join game.");
        setLoading(false);
        return;
      }

      // Success - redirect to setup/lobby page (handles both single and multiplayer)
      router.push(`/game/${gameId}/setup`);
    } catch (err) {
      console.error("Error joining game:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleJoinWithRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameInfo || !selectedRole) return;
    await joinGame(gameInfo.id, selectedRole);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleBack = () => {
    setStep("enter_code");
    setSelectedRole(null);
    setError(null);
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

        {step === "enter_code" && (
          <form
            onSubmit={handleFindGame}
            className="space-y-6"
            autoComplete="off"
          >
            {/* Hidden inputs to discourage autofill */}
            <input type="text" style={{ display: "none" }} />
            <input type="password" style={{ display: "none" }} />

            <Input
              id="join-game-code"
              name="game-code"
              label="Game Code"
              type="text"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              placeholder="Enter code (e.g. WILD42)"
              required
              autoComplete="off"
              className="font-mono text-lg tracking-widest"
              maxLength={6}
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
                loadingText="Finding..."
                disabled={!gameCode || gameCode.length < 6}
                fullWidth
                className="order-1 sm:order-2"
              >
                <Icon name="search" size="sm" />
                Find Game
              </Button>
            </div>
          </form>
        )}

        {step === "select_role" && gameInfo && (
          <form onSubmit={handleJoinWithRole} className="space-y-6">
            {/* Game Info */}
            <div className="p-4 rounded-lg bg-surface-dark-elevated border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Icon name="terrain" className="text-primary" />
                <span className="font-display font-bold text-white">
                  {gameInfo.name}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                {gameInfo.players?.length || 0} / {gameInfo.max_players || gameInfo.player_count} players joined
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Select Your Role
              </label>
              <div className="space-y-3">
                {getAvailableRoles().map((role) => {
                  const info = ROLE_INFO[role];
                  return (
                    <label key={role} className="block cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        checked={selectedRole === role}
                        onChange={() => setSelectedRole(role)}
                        className="sr-only peer"
                      />
                      <div className="p-4 rounded-lg border-2 border-white/10 bg-surface-dark-elevated transition-all peer-checked:border-primary peer-checked:bg-primary/10 hover:border-white/20">
                        <div className="flex items-center gap-3">
                          <Icon name={info.icon} className="text-xl text-primary" />
                          <div>
                            <span className="font-medium text-white">
                              {info.name}
                            </span>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {info.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
              {getAvailableRoles().length === 0 && (
                <p className="text-sm text-yellow-400 mt-2">
                  No roles available. All positions have been filled.
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                fullWidth
                className="order-2 sm:order-1"
              >
                <Icon name="arrow_back" size="sm" className="mr-1" />
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
                loadingText="Joining..."
                disabled={!selectedRole}
                fullWidth
                className="order-1 sm:order-2"
              >
                <Icon name="play_arrow" size="sm" />
                Join Game
              </Button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Icon name="info" size="sm" className="text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400 leading-relaxed">
              <strong className="text-primary">Tip:</strong> Game codes are 6 characters long
              and case-insensitive. The game creator can find the code in the game lobby.
            </p>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
