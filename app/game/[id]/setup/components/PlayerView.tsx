import React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { gameAPI } from "@/lib/api/client";
import { useGameContext } from "@/app/game/components/GameContext";
import { useLobby } from "@/hooks/useLobby";
import type { GameDetails, Player } from "@/types/game";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Button } from "@/app/components/ui/Button";
import { Icon } from "@/app/components/ui/Icon";
import { GlassPanel } from "@/app/components/ui/GlassPanel";
import { cn } from "@/lib/utils";
import { StartingPointMap } from "./StartingPointMap";
import { calculateDistance } from "@/lib/game/proximity-logic";
import { formatDistanceFromMeters } from "@/lib/utils/distance";
import { GameCodeDisplay } from "@/app/game/components/GameCodeDisplay";
import { ROLE_INFO } from "@/lib/game/roles";

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
  
  // Use lobby hook for real-time player updates
  const { 
    players, 
    isAllReady, 
    setPlayerReady,
    kickPlayer,
  } = useLobby(gameDetails.id);
  
  const [kickingPlayerId, setKickingPlayerId] = React.useState<string | null>(null);
  const [settingReady, setSettingReady] = React.useState(false);
  
  const [isGameReady, setIsGameReady] = React.useState(
    gameDetails.status === "ready" || gameDetails.status === "active"
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [startingPoint, setStartingPoint] = React.useState<{
    lat: number;
    lng: number;
  } | null>(gameDetails.starting_point ?? null);
  const [userLocation, setUserLocation] = React.useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationLoading, setLocationLoading] = React.useState(true);

  const isMultiplayer = gameDetails.game_mode !== "single_player";

  // Fetch starting point from game_points if not available on game record
  React.useEffect(() => {
    if (startingPoint) return; // Already have it

    async function fetchStartingPoint() {
      const { data } = await supabase
        .from("game_points")
        .select("latitude, longitude")
        .eq("game_id", gameDetails.id)
        .eq("type", "start")
        .single();

      if (data) {
        setStartingPoint({ lat: data.latitude, lng: data.longitude });
      }
    }

    fetchStartingPoint();
  }, [gameDetails.id, startingPoint, supabase]);

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
    if (!userLocation || !startingPoint) return null;
    return calculateDistance(
      userLocation.lat,
      userLocation.lng,
      startingPoint.lat,
      startingPoint.lng
    );
  }, [userLocation, startingPoint]);

  const isFarFromStart =
    distanceToStart !== null && distanceToStart > FAR_DISTANCE_THRESHOLD_METERS;

  // Subscribe to game status changes (real-time)
  React.useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const setupSubscription = () => {
      channel = supabase
        .channel(`game:${gameDetails.id}:status`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "games",
            filter: `id=eq.${gameDetails.id}`,
          },
          async (payload) => {
            const newGame = payload.new as { 
              status: string; 
              starting_point?: { lat: number; lng: number } 
            };
            
            if (newGame.status === "ready") {
              setIsGameReady(true);
              
              // Fetch starting point when game becomes ready
              if (!startingPoint) {
                const { data: startPoint } = await supabase
                  .from("game_points")
                  .select("latitude, longitude")
                  .eq("game_id", gameDetails.id)
                  .eq("type", "start")
                  .single();

                if (startPoint) {
                  setStartingPoint({ lat: startPoint.latitude, lng: startPoint.longitude });
                }
              }
            }

            if (newGame.status === "active") {
              setIsLoading(false);
              router.push(`/game/${gameDetails.id}/play`);
            }

            // Update starting point if available
            if (newGame.starting_point && !startingPoint) {
              setStartingPoint(newGame.starting_point);
            }
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [gameDetails.id, router, startingPoint, supabase]);

  const handleReadyClick = async () => {
    if (settingReady) return; // Prevent multiple clicks
    
    setSettingReady(true);
    try {
      const granted = await requestPermissions();
      if (!granted) {
        alert("You will need notifications and location to play the game.");
        return;
      }
      
      await setPlayerReady(player.id, true);
    } catch (error) {
      console.error("Error updating player status:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setSettingReady(false);
    }
  };

  const handleStartGame = async () => {
    setIsLoading(true);
    try {
      // Server handles all status transitions atomically
      await gameAPI.start(gameDetails.id);
      // Navigation handled by realtime subscription on game status change
    } catch (error) {
      console.error("Error starting game:", error);
      setIsLoading(false);
      alert("Failed to start game. Please try again.");
    }
  };

  const handleKickPlayer = async (playerId: string, playerRole: string) => {
    const confirmKick = window.confirm(
      `Are you sure you want to remove this player (${playerRole}) from the game?`
    );
    if (!confirmKick) return;

    setKickingPlayerId(playerId);
    try {
      await kickPlayer(playerId);
    } catch (error) {
      console.error("Error kicking player:", error);
      alert("Failed to remove player. Please try again.");
    } finally {
      setKickingPlayerId(null);
    }
  };

  const currentPlayerReady =
    players.find((p) => p.user_id === player.user_id)?.status === "ready";
  // Game can only start when:
  // 1. All players are ready (isAllReady)
  // 2. Game has waypoints set up (isGameReady = status is "ready" or "active")
  // This applies to both AI and player-GM games - waypoints must exist first
  const canStartGame = isGameReady && isAllReady;

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
              disabled={currentPlayerReady || settingReady}
              size="lg"
              className="px-8 shadow-lg shadow-primary/10"
            >
              {settingReady ? (
                <>
                  <Icon name="progress_activity" size="sm" className="mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Icon name={currentPlayerReady ? "check_circle" : "how_to_reg"} size="sm" className="mr-2" />
                  {currentPlayerReady ? "You are Ready" : "I'm Ready"}
                </>
              )}
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

        {/* Game Code Display for Multiplayer */}
        {isMultiplayer && gameDetails.game_code && (
          <div className="mb-6">
            <GameCodeDisplay
              gameCode={gameDetails.game_code}
              gameId={gameDetails.id}
              gameName={gameDetails.name}
            />
          </div>
        )}

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
            {startingPoint && (
              <div className="bg-surface-dark-elevated/50 border border-white/5 rounded-2xl p-4 overflow-hidden">
                <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Icon name="location_on" size="sm" className="text-primary" />
                  Starting Point
                </h2>
                <div className="h-48 rounded-xl overflow-hidden">
                  <StartingPointMap
                    startingPoint={startingPoint}
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
                {players.map((p) => {
                  const roleInfo = p.role ? ROLE_INFO[p.role as keyof typeof ROLE_INFO] : null;
                  const isCurrentUser = p.user_id === player.user_id;
                  const canKick = isCreator && !isCurrentUser && isMultiplayer;
                  const isBeingKicked = kickingPlayerId === p.id;
                  
                  return (
                    <div 
                      key={p.id} 
                      className={cn(
                        "p-4 rounded-xl border transition-all flex items-center justify-between",
                        isCurrentUser 
                          ? "bg-primary/10 border-primary/30" 
                          : "bg-background-dark/40 border-white/5"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                          p.status === "ready" ? "bg-primary text-background-dark" : "bg-surface-dark-elevated text-gray-400"
                        )}>
                          {p.status === "ready" ? (
                            <Icon name="check" size="sm" />
                          ) : roleInfo ? (
                            <Icon name={roleInfo.icon} size="sm" />
                          ) : (
                            p.user_id?.substring(0, 2).toUpperCase() || "??"
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">
                            {roleInfo?.shortName || p.role?.replace("_", " ")}
                            {isCurrentUser && (
                              <span className="ml-1.5 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full uppercase tracking-tighter">You</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {roleInfo?.name || "Player"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md",
                          p.status === "ready" ? "text-primary bg-primary/10" : "text-gray-500 bg-gray-500/10"
                        )}>
                          {p.status === "ready" ? "Ready" : "Waiting"}
                        </span>
                        {canKick && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleKickPlayer(p.id, roleInfo?.shortName || p.role || "Player")}
                            disabled={isBeingKicked}
                            className="p-1.5 h-auto text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                            aria-label={`Remove ${roleInfo?.shortName || "player"} from game`}
                          >
                            {isBeingKicked ? (
                              <Icon name="progress_activity" size="sm" className="animate-spin" />
                            ) : (
                              <Icon name="person_remove" size="sm" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
