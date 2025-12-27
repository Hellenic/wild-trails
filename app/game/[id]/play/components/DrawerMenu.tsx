import React, { useState } from "react";
import type { GamePoint } from "@/hooks/usePoints";
import { Icon } from "@/app/components/ui/Icon";
import { Button } from "@/app/components/ui/Button";
import { GlassPanel } from "@/app/components/ui/GlassPanel";
import { cn } from "@/lib/utils";

type GameStats = {
  showOwnLocation: boolean;
  showGoal: boolean;
  pointsVisited: number;
  totalPoints: number;
  distanceTraveled: string;
  estimatedDistanceRemaining?: string;
};

export function DrawerMenu({
  stats,
  onShowOwnLocation,
  onShowGoal,
  onGiveUp,
  visitedPoints = [],
  hints = [],
}: {
  stats: GameStats;
  onShowOwnLocation: () => void;
  onShowGoal: () => void;
  onGiveUp?: () => void;
  visitedPoints?: GamePoint[];
  hints?: Array<{ pointId: string; hint: string; timestamp: string }>;
}) {
  const [expandedHints, setExpandedHints] = useState<Set<string>>(new Set());

  const toggleHint = (pointId: string) => {
    const newExpanded = new Set(expandedHints);
    if (newExpanded.has(pointId)) {
      newExpanded.delete(pointId);
    } else {
      newExpanded.add(pointId);
    }
    setExpandedHints(newExpanded);
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 h-[80vh] animate-slide-up">
      <GlassPanel className="h-full rounded-t-[32px] rounded-b-none border-t border-white/10 overflow-y-auto shadow-[0_-20px_50px_rgba(0,0,0,0.6)] bg-background-dark/90 backdrop-blur-xl">
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 mb-6" />
        
        <div className="p-6 md:p-8 space-y-8">
          {/* Controls */}
          <div className="grid grid-cols-1 gap-3">
            <label className="flex items-center justify-between p-4 bg-surface-dark-elevated rounded-2xl border border-white/5 cursor-pointer hover:border-primary/30 transition-all group">
              <div className="flex items-center gap-3">
                <Icon name="my_location" size="sm" className="text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold text-white">Show own location</span>
              </div>
              <input
                type="checkbox"
                checked={stats.showOwnLocation}
                onChange={onShowOwnLocation}
                className="w-6 h-6 rounded-md border-2 border-white/10 bg-background-dark text-primary focus:ring-primary focus:ring-offset-0 transition-all cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-surface-dark-elevated rounded-2xl border border-white/5 cursor-pointer hover:border-primary/30 transition-all group">
              <div className="flex items-center gap-3">
                <Icon name="flag" size="sm" className="text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold text-white">Show goal (Cheat)</span>
              </div>
              <input
                type="checkbox"
                checked={stats.showGoal}
                onChange={onShowGoal}
                className="w-6 h-6 rounded-md border-2 border-white/10 bg-background-dark text-primary focus:ring-primary focus:ring-offset-0 transition-all cursor-pointer"
              />
            </label>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-surface-dark-elevated/50 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Waypoints</p>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-black text-white">{stats.pointsVisited}/{stats.totalPoints}</span>
                <Icon name="location_on" size="sm" className="text-primary/60" />
              </div>
            </div>
            <div className="p-4 bg-surface-dark-elevated/50 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Distance</p>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-black text-white">{stats.distanceTraveled}</span>
                <Icon name="straighten" size="sm" className="text-primary/60" />
              </div>
            </div>
            {stats.estimatedDistanceRemaining && (
              <div className="col-span-full p-4 bg-primary/10 rounded-2xl border border-primary/30">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/80 mb-1">Est. Distance to Goal</p>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-black text-primary drop-shadow-[0_0_8px_rgba(19,236,19,0.3)]">{stats.estimatedDistanceRemaining}</span>
                  <Icon name="explore" size="sm" className="text-primary/60" />
                </div>
              </div>
            )}
          </div>

          {/* Hints Section */}
          {hints.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Icon name="tips_and_updates" size="sm" className="text-primary" />
                <h3 className="text-lg font-black text-white uppercase tracking-tight">
                  Discovered Hints ({hints.length})
                </h3>
              </div>
              <div className="space-y-3">
                {hints.slice().reverse().map((hint, index) => {
                  const isLatest = index === 0;
                  const pointNumber = hints.length - index;
                  const isExpanded = expandedHints.has(hint.pointId) || isLatest;

                  return (
                    <div
                      key={hint.pointId}
                      className={cn(
                        "rounded-2xl border transition-all overflow-hidden",
                        isLatest
                          ? "bg-primary/10 border-primary/40 shadow-[0_0_20px_rgba(19,236,19,0.15)]"
                          : "bg-surface-dark-elevated/50 border-white/10"
                      )}
                    >
                      <button
                        onClick={() => toggleHint(hint.pointId)}
                        className="w-full flex justify-between items-center p-4 text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-inner",
                            isLatest ? "bg-primary text-background-dark" : "bg-white/20 text-white"
                          )}>
                            {pointNumber}
                          </div>
                          <span className={cn(
                            "font-bold text-sm",
                            isLatest ? "text-primary" : "text-white"
                          )}>
                            Waypoint Hint
                            {isLatest && <span className="ml-2 text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase tracking-widest font-black">Latest</span>}
                          </span>
                        </div>
                        <Icon 
                          name={isExpanded ? "expand_less" : "expand_more"} 
                          size="sm" 
                          className={cn("transition-transform", isLatest ? "text-primary" : "text-gray-400")} 
                        />
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-0">
                          <div className="p-4 bg-background-dark/60 rounded-xl border border-white/5 text-sm text-gray-200 leading-relaxed font-medium">
                            &quot;{hint.hint}&quot;
                          </div>
                          <div className="mt-3 flex justify-end">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                              {new Date(hint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Give Up Button */}
          {onGiveUp && (
            <div className="pt-6 border-t border-white/10">
              <Button
                variant="ghost"
                fullWidth
                size="lg"
                onClick={onGiveUp}
                className="bg-red-500/20 text-red-100 border border-red-500/40 hover:bg-red-500/30 hover:border-red-500/60 rounded-2xl font-black uppercase tracking-wider"
              >
                <Icon name="flag" size="sm" className="mr-2" />
                Reveal Goal Location
              </Button>
              <p className="text-[10px] font-black text-gray-500 text-center mt-3 uppercase tracking-[0.2em]">
                Warning: This will end the current game
              </p>
            </div>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
