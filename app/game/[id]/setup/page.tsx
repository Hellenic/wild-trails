"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { useGameDetails, isGameMaster } from "@/hooks/useGame";
import { GameMasterView } from "./components/GameMasterView";
import { PlayerView } from "./components/PlayerView";

type Params = {
  id: string;
};

export default function GameSetup() {
  const { id } = useParams<Params>();
  const { user, loading: userLoading } = useUser();
  const { gameDetails, loading: gameDetailsLoading } = useGameDetails(id);

  if (userLoading || gameDetailsLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-forest-deep">Loading...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-forest-deep">User not found</div>
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
      {isGameMaster(user?.id, gameDetails) ? (
        <GameMasterView gameDetails={gameDetails} />
      ) : (
        <PlayerView
          gameDetails={gameDetails}
          isCreator={gameDetails.creator_id === user.id}
        />
      )}
    </main>
  );
}
