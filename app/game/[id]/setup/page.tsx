"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useGameDetails, isGameMaster } from "@/hooks/useGame";
import { GameMasterView } from "./components/GameMasterView";
import { PlayerView } from "./components/PlayerView";
import { usePlayer } from "@/hooks/usePlayer";
import { Icon } from "@/app/components/ui/Icon";

type Params = {
  id: string;
};

export default function GameSetup() {
  const { id } = useParams<Params>();
  const { player, loading: playerLoading } = usePlayer(id);
  const {
    gameDetails,
    loading: gameDetailsLoading,
    refetch,
  } = useGameDetails(id);

  if (playerLoading || gameDetailsLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center dark:bg-background-dark bg-background-light">
        <div className="text-center">
          <div className="animate-pulse">
            <Icon name="terrain" size="xl" className="text-primary mb-4" />
            <div className="text-white">Loading game setup...</div>
          </div>
        </div>
      </main>
    );
  }

  if (!player) {
    return (
      <main className="min-h-screen flex items-center justify-center dark:bg-background-dark bg-background-light">
        <div className="text-center text-white">
          <Icon name="error" size="lg" className="text-red-400 mb-4" />
          <p>You are not a player in this game.</p>
        </div>
      </main>
    );
  }

  if (!gameDetails) {
    return (
      <main className="min-h-screen flex items-center justify-center dark:bg-background-dark bg-background-light">
        <div className="text-center text-white">
          <Icon name="search_off" size="lg" className="text-gray-400 mb-4" />
          <p>Game not found</p>
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

      <div className="relative z-10">
        {isGameMaster(player?.user_id, gameDetails) &&
        gameDetails?.status === "setup" ? (
          <GameMasterView
            gameDetails={gameDetails}
            onPointsReady={() => refetch()}
          />
        ) : (
          <PlayerView
            gameDetails={gameDetails}
            isCreator={gameDetails.creator_id === player.user_id}
            player={player}
          />
        )}
      </div>
    </main>
  );
}
