import React from "react";
import { useRouter } from "next/navigation";
import { useInterval } from "@/hooks/useInterval";
import { createClient } from "@/lib/supabase/client";
import { updatePlayerStatus } from "@/app/actions/players";
import { updateGameStatus } from "@/app/actions/games";
import type { GameDetails } from "@/types/game";

interface PlayerViewProps {
  gameDetails: GameDetails;
  isCreator: boolean;
}

export function PlayerView({
  gameDetails,
  isCreator,
}: PlayerViewProps & { isCreator: boolean }) {
  const supabase = createClient();
  const router = useRouter();
  const [isReady, setIsReady] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const players = gameDetails.players ?? [];

  // Fetch game status periodically
  useInterval(async () => {
    const { data: game } = await supabase
      .from("games")
      .select("*")
      .eq("id", gameDetails.id)
      .single();

    if (game && game.status === "ready") {
      setIsReady(true);
    }

    if (game && game.status === "active") {
      setIsLoading(false);
      router.push(`/game/${gameDetails.id}/play`);
    }
  }, 5000); // Check every 5 seconds

  const handleReadyClick = async () => {
    await updatePlayerStatus(gameDetails.id, "ready");
  };

  const handleStartGame = async () => {
    setIsLoading(true);
    // Update game status to in_progress
    await updateGameStatus(gameDetails.id, "active");
  };

  const allPlayersReady = players.every((player) => player.status === "ready");
  const canStartGame = isReady && allPlayersReady;

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-4">{gameDetails.name}</h1>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Game Details</h2>
          <div className="space-y-2">
            <p className="text-gray-600 flex items-center gap-2">
              Status:{" "}
              {isReady ? (
                "Ready to start"
              ) : (
                <>
                  Game Master is preparing the game
                  <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </>
              )}
            </p>
            <p className="text-gray-600">
              Duration: {Math.round(gameDetails.duration / 60)} hours
            </p>
            <p className="text-gray-600">
              Maximum radius: {gameDetails.max_radius}km
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Players</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {players.length === 0 && (
              <div className="p-4 border rounded-lg">
                <p className="font-semibold">No players yet</p>
              </div>
            )}
            {players.map((player) => (
              <div key={player.id} className="p-4 border rounded-lg">
                <p className="font-semibold">{player.user_id}</p>
                <p className="text-gray-600 capitalize">
                  {player.role.replace("_", " ")}
                </p>
                <p className="text-gray-600">
                  Status: {player.status || "Not ready"}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          {isCreator ? (
            <button
              onClick={handleStartGame}
              disabled={!canStartGame || isLoading}
              className={`px-4 py-2 rounded-lg ${
                canStartGame
                  ? "bg-forest-pine hover:bg-forest-moss text-forest-mist"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isLoading ? "Starting Game..." : "Start Game"}
            </button>
          ) : (
            <button
              onClick={handleReadyClick}
              disabled={isReady}
              className={`px-4 py-2 rounded-lg ${
                isReady
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              Ready to Start
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
