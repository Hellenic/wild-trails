import React from "react";
import { useRouter } from "next/navigation";
import { useInterval } from "@/hooks/useInterval";
import { createClient } from "@/lib/supabase/client";
import { gameAPI, playerAPI } from "@/lib/api/client";
import { useGameContext } from "@/app/game/components/GameContext";
import type { GameDetails, Player } from "@/types/game";

interface PlayerViewProps {
  gameDetails: GameDetails;
  isCreator: boolean;
}

export function PlayerView({
  gameDetails,
  isCreator,
  player,
}: PlayerViewProps & { isCreator: boolean; player: Player }) {
  const supabase = createClient();
  const router = useRouter();
  const { requestPermissions } = useGameContext();
  const [isGameReady, setIsGameReady] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [players, setPlayers] = React.useState<Player[]>(
    gameDetails.players ?? []
  );

  // Fetch game status periodically
  useInterval(async () => {
    const { data: game } = await supabase
      .from("games")
      .select("*, players(*)")
      .eq("id", gameDetails.id)
      .single();

    if (game && game.status === "ready") {
      setIsGameReady(true);
    }

    if (game && game.status === "active") {
      setIsLoading(false);
      router.push(`/game/${gameDetails.id}/play`);
    }

    if (game && game.players) {
      setPlayers(game.players);
    }
  }, 5000); // Check every 5 seconds

  const handleReadyClick = async () => {
    const granted = await requestPermissions();
    if (!granted) {
      alert("You will need notifications and location to play the game.");
      return;
    }
    
    // Update player status via API
    try {
      await playerAPI.updateStatus(player.id, { status: "ready" });
      
      setPlayers(
        players.map((p) => ({
          ...p,
          status: p.id === player.id ? "ready" : p.status,
        }))
      );
    } catch (error) {
      console.error("Error updating player status:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  const handleStartGame = async () => {
    setIsLoading(true);
    try {
      await gameAPI.updateStatus(gameDetails.id, { status: "active" });
    } catch (error) {
      console.error("Error starting game:", error);
      setIsLoading(false);
      alert("Failed to start game. Please try again.");
    }
  };

  const currentPlayerReady =
    players.find((p) => p.user_id === player.user_id)?.status === "ready";
  const allPlayersReady = players.every((player) => player.status === "ready");
  const canStartGame = isGameReady && allPlayersReady;

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-4 text-gray-700">
          {gameDetails.name}
        </h1>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Game Details
          </h2>
          <div className="space-y-2">
            <p className="text-gray-600 flex items-center gap-2">
              <b>Status:</b>{" "}
              {isGameReady ? (
                "Ready to start ✔️"
              ) : gameDetails.status === "setup" && gameDetails.game_master === "ai" ? (
                <>
                  Waiting for AI generation...
                  <span className="inline-block w-4 h-4 border-2 border-forest-pine border-t-transparent rounded-full animate-spin" />
                </>
              ) : (
                <>
                  Game Master is preparing the game
                  <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </>
              )}
            </p>
            <p className="text-gray-600">
              <b>Duration:</b> {Math.round(gameDetails.duration / 60)} hours
            </p>
            <p className="text-gray-600">
              <b>Maximum radius:</b> {gameDetails.max_radius}km
            </p>
            <p className="text-gray-600">
              <b>Note:</b> Your location is only tracked when your screen is on.
              You will not receive clue notifications and other players cannot
              see your progress when your screen is off.
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Players</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {players.length === 0 && (
              <div className="p-4 border rounded-lg">
                <p className="font-semibold">No players yet</p>
              </div>
            )}
            {players.map((player) => (
              <div key={player.id} className="p-4 border rounded-lg">
                <p className="font-semibold capitalize text-gray-700">
                  {player.role.replace("_", " ")}
                </p>
                <p className="text-gray-400">{player.user_id}</p>
                <p className="text-gray-600">
                  <b>Status:</b> {player.status || "Not ready"}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={handleReadyClick}
            className={`px-4 py-2 rounded-lg ${
              !currentPlayerReady
                ? "bg-blue-500 hover:bg-blue-600 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {currentPlayerReady ? "Ready to Start" : "Ready"}
          </button>
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
          ) : null}
        </div>
      </div>
    </div>
  );
}
