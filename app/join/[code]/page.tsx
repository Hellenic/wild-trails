"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Icon, GlassPanel } from "@/app/components/ui";
import { JoinGameModal } from "@/app/components/JoinGameModal";
import Link from "next/link";

type Params = {
  code: string;
};

export default function JoinGamePage() {
  const { code } = useParams<Params>();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameInfo, setGameInfo] = useState<{
    id: string;
    name: string;
    status: string;
  } | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthAndGame = async () => {
      try {
        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);

        // Look up game by code
        const normalizedCode = code.toUpperCase().replace(/\s/g, "");
        
        const { data: game, error: gameError } = await supabase
          .from("games")
          .select("id, name, status, game_code")
          .eq("game_code", normalizedCode)
          .single();

        if (gameError || !game) {
          setError("Game not found. Please check the code and try again.");
          setLoading(false);
          return;
        }

        // Check game status
        if (game.status === "completed") {
          setError("This game has already been completed.");
          setLoading(false);
          return;
        }

        if (game.status === "active") {
          setError("This game is already in progress and cannot be joined.");
          setLoading(false);
          return;
        }

        setGameInfo({
          id: game.id,
          name: game.name,
          status: game.status,
        });

        // If authenticated, check if already in game
        if (user) {
          const { data: existingPlayer } = await supabase
            .from("players")
            .select("id")
            .eq("game_id", game.id)
            .eq("user_id", user.id)
            .single();

          if (existingPlayer) {
            // Already in game, redirect to lobby
            router.push(`/game/${game.id}/setup`);
            return;
          }
        }

        // Show join modal automatically
        if (user) {
          setShowJoinModal(true);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error checking game:", err);
        setError("An error occurred. Please try again.");
        setLoading(false);
      }
    };

    checkAuthAndGame();
  }, [code, router, supabase]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center dark:bg-background-dark bg-background-light">
        <div className="text-center">
          <div className="animate-pulse">
            <Icon name="terrain" size="xl" className="text-primary mb-4" />
            <div className="text-white">Loading game...</div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen dark:bg-background-dark bg-background-light relative flex items-center justify-center">
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

        <div className="relative z-10 w-full max-w-md p-4">
          <GlassPanel className="p-8 text-center">
            <Icon name="error" size="xl" className="text-red-400 mb-6" />
            <h2 className="text-2xl font-black text-white mb-4 tracking-tight">
              Unable to Join
            </h2>
            <p className="text-gray-400 mb-8 leading-relaxed">{error}</p>
            <Link href="/">
              <Button variant="primary" fullWidth>
                <Icon name="home" size="sm" className="mr-2" />
                Go Home
              </Button>
            </Link>
          </GlassPanel>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen dark:bg-background-dark bg-background-light relative flex items-center justify-center">
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

        <div className="relative z-10 w-full max-w-md p-4">
          <GlassPanel className="p-8 text-center">
            <Icon name="terrain" size="xl" className="text-primary mb-6" />
            <h2 className="text-2xl font-black text-white mb-4 tracking-tight">
              Join {gameInfo?.name || "Game"}
            </h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              You need to sign in to join this game.
            </p>
            <Link href={`/login?redirect=/join/${code}`}>
              <Button variant="primary" fullWidth size="lg">
                <Icon name="login" size="sm" className="mr-2" />
                Sign In to Join
              </Button>
            </Link>
          </GlassPanel>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen dark:bg-background-dark bg-background-light relative flex items-center justify-center">
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

      <div className="relative z-10 w-full max-w-md p-4">
        <GlassPanel className="p-8 text-center">
          <Icon name="group_add" size="xl" className="text-primary mb-6" />
          <h2 className="text-2xl font-black text-white mb-4 tracking-tight">
            Join {gameInfo?.name || "Game"}
          </h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            You&apos;re about to join a Wild Trails adventure!
          </p>
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={() => setShowJoinModal(true)}
          >
            <Icon name="play_arrow" size="sm" className="mr-2" />
            Continue
          </Button>
        </GlassPanel>
      </div>

      <JoinGameModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        prefillCode={code}
      />
    </main>
  );
}

