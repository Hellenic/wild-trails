import React from "react";
import { useRouter } from "next/navigation";
import { useInterval } from "@/hooks/useInterval";
import { createClient } from "@/lib/supabase/client";
import { gameAPI, playerAPI } from "@/lib/api/client";
import { useGameContext } from "@/app/game/components/GameContext";
import type { GameDetails, Player } from "@/types/game";
import { Button } from "@/app/components/ui/Button";
import { Icon } from "@/app/components/ui/Icon";
import { GlassPanel } from "@/app/components/ui/GlassPanel";
import { cn } from "@/lib/utils";
import { StartingPointMap } from "./StartingPointMap";
import { calculateDistance } from "@/lib/game/proximity-logic";
import { formatDistanceFromMeters } from "@/lib/utils/distance";

interface PlayerViewProps {
  gameDetails: GameDetails;
  isCreator: boolean;
  player: Player;
}

// Distance threshold in meters - warn if player is farther than this
const FAR_DISTANCE_THRESHOLD_METERS = 500;

export function PlayerView({
  gameDetails,
  isCreator,
  player,
}: PlayerViewProps) {
  const supabase = createClient();
  const router = useRouter();
  const { requestPermissions } = useGameContext();
  const [isGameReady, setIsGameReady] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [players, setPlayers] = React.useState<Player[]>(
    gameDetails.players ?? []
  );
  const [userLocation, setUserLocation] = React.useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationLoading, setLocationLoading] = React.useState(true);

  // Get user's current location once on mount
  React.useEffect(() => {
    if (!navigator.geolocation) {
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationLoading(false);
      },
      () => {
        // Silently fail - location is optional for setup view
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Calculate distance to starting point
  const distanceToStart = React.useMemo(() => {
    if (!userLocation || !gameDetails.starting_point) return null;
    return calculateDistance(
      userLocation.lat,
      userLocation.lng,
      gameDetails.starting_point.lat,
      gameDetails.starting_point.lng
    );
  }, [userLocation, gameDetails.starting_point]);

  const isFarFromStart =
    distanceToStart !== null && distanceToStart > FAR_DISTANCE_THRESHOLD_METERS;

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
    <div className="container mx-auto p-4 md:p-8">
      <GlassPanel className="p-6 md:p-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">
              {gameDetails.name}
            </h1>
            <div className="flex items-center gap-2">
              {isGameReady ? (
                <span className="flex items-center gap-1.5 text-primary font-bold">
                  <Icon name="check_circle" size="sm" />
                  Ready to start
                </span>
              ) : gameDetails.status === "setup" && gameDetails.game_master === "ai" ? (
                <span className="flex items-center gap-1.5 text-yellow-400 font-bold">
                  <Icon name="progress_activity" size="sm" className="animate-spin" />
                  Waiting for AI generation...
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-blue-400 font-bold">
                  <Icon name="progress_activity" size="sm" className="animate-spin" />
                  Game Master is preparing...
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              variant={currentPlayerReady ? "outline" : "primary"}
              onClick={handleReadyClick}
              disabled={currentPlayerReady}
              size="lg"
              className="px-8 shadow-lg shadow-primary/10"
            >
              <Icon name={currentPlayerReady ? "check_circle" : "how_to_reg"} size="sm" className="mr-2" />
              {currentPlayerReady ? "You are Ready" : "I'm Ready"}
            </Button>
            {isCreator && (
              <Button
                variant="primary"
                onClick={handleStartGame}
                disabled={!canStartGame || isLoading}
                size="lg"
                className="px-8 shadow-lg shadow-primary/20"
              >
                {isLoading ? (
                  <>
                    <Icon name="progress_activity" size="sm" className="mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Icon name="play_arrow" size="sm" className="mr-2" />
                    Start Game
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Distance Warning Banner */}
        {isFarFromStart && distanceToStart && (
          <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
            <Icon name="warning" size="md" className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-400 mb-1">You&apos;re far from the starting point</h3>
              <p className="text-sm text-amber-300/80">
                You are approximately <span className="font-bold">{formatDistanceFromMeters(distanceToStart)}</span> away 
                from the starting location. Consider traveling closer before marking yourself as ready.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            {/* Starting Point Map */}
            {gameDetails.starting_point && (
              <div className="bg-surface-dark-elevated/50 border border-white/5 rounded-2xl p-4 overflow-hidden">
                <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Icon name="location_on" size="sm" className="text-primary" />
                  Starting Point
                </h2>
                <div className="h-48 rounded-xl overflow-hidden">
                  <StartingPointMap
                    startingPoint={gameDetails.starting_point}
                    playerLocation={userLocation}
                    maxRadius={gameDetails.max_radius}
                  />
                </div>
                {/* Distance indicator */}
                <div className="mt-3 pt-3 border-t border-white/5">
                  {locationLoading ? (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Icon name="progress_activity" size="sm" className="animate-spin" />
                      Getting your location...
                    </div>
                  ) : distanceToStart !== null ? (
                    <div className={cn(
                      "flex items-center gap-2 text-sm",
                      isFarFromStart ? "text-amber-400" : "text-primary"
                    )}>
                      <Icon name={isFarFromStart ? "directions_walk" : "check_circle"} size="sm" />
                      <span>
                        {isFarFromStart 
                          ? `${formatDistanceFromMeters(distanceToStart)} away`
                          : "You're at the starting area"
                        }
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Icon name="location_disabled" size="sm" />
                      Location unavailable
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-surface-dark-elevated/50 border border-white/5 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Icon name="info" size="sm" className="text-primary" />
                Game Info
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Duration</span>
                  <span className="text-white font-bold">{Math.round(gameDetails.duration / 60)} hours</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Max Radius</span>
                  <span className="text-white font-bold">{gameDetails.max_radius} km</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Mode</span>
                  <span className="text-white font-bold capitalize">{gameDetails.game_mode.replace("_", " ")}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
              <h3 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                <Icon name="tips_and_updates" size="sm" />
                Pro Tip
              </h3>
              <p className="text-sm text-blue-300/80 leading-relaxed">
                Your location is only tracked when your screen is on. Keep the app open to receive clue notifications and let others see your progress.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-surface-dark-elevated/50 border border-white/5 rounded-2xl p-6 h-full">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Icon name="group" size="sm" className="text-primary" />
                Players
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {players.length === 0 && (
                  <div className="col-span-full py-8 text-center text-gray-500 italic">
                    No players joined yet...
                  </div>
                )}
                {players.map((p) => (
                  <div 
                    key={p.id} 
                    className={cn(
                      "p-4 rounded-xl border transition-all flex items-center justify-between",
                      p.user_id === player.user_id 
                        ? "bg-primary/10 border-primary/30" 
                        : "bg-background-dark/40 border-white/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                        p.status === "ready" ? "bg-primary text-background-dark" : "bg-surface-dark-elevated text-gray-400"
                      )}>
                        {p.status === "ready" ? <Icon name="check" size="sm" /> : (p.user_id?.substring(0, 2).toUpperCase() || "??")}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm capitalize">
                          {p.role.replace("_", " ")}
                          {p.user_id === player.user_id && <span className="ml-1.5 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full uppercase tracking-tighter">You</span>}
                        </p>
                        <p className="text-xs text-gray-500 font-mono truncate max-w-[120px]">
                          {p.user_id}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md",
                      p.status === "ready" ? "text-primary bg-primary/10" : "text-gray-500 bg-gray-500/10"
                    )}>
                      {p.status === "ready" ? "Ready" : "Waiting"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
