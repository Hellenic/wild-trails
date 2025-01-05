"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useGameDetails, isGameMaster } from "@/hooks/useGame";
import { GameMasterView } from "./components/GameMasterView";
import { PlayerView } from "./components/PlayerView";
import { usePlayer } from "@/hooks/usePlayer";

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
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-forest-deep">Loading...</div>
      </main>
    );
  }

  if (!player) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-forest-deep">
          You are not player in this game.
        </div>
      </main>
    );
  }

  if (!gameDetails) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-forest-deep">Game not found</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
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
    </main>
  );
}
