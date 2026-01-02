import React from "react";
import type { GameMaster, GameRole } from "@/types/game";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Icon } from "@/app/components/ui/Icon";
import { DIFFICULTY_PRESETS, type DifficultyLevel } from "@/lib/game/difficulty-presets";
import { ROLE_INFO, isRoleValidForGameMode, type GameRole as RoleType } from "@/lib/game/roles";
import { cn } from "@/lib/utils";

type GameSettingsFormData = {
  duration: number;
  playerCount: number;
  gameMasterType: GameMaster;
  playerRole: GameRole;
  maxDistance: number;
  difficulty: DifficultyLevel;
};

type Props = {
  pending: boolean;
  formData: GameSettingsFormData;
  setFormData: (data: GameSettingsFormData) => void;
  onBack: () => void;
  onSubmit: () => void;
};

const PLAYER_COUNT_OPTIONS = [
  { value: 1, label: "Single Player", description: "Seeker + AI Game Master", icon: "person" },
  { value: 2, label: "Two Players", description: "Choose your roles", icon: "group" },
  { value: 3, label: "Three Players", description: "All human players", icon: "groups" },
];

export function GameSettings({
  pending,
  formData,
  setFormData,
  onBack,
  onSubmit,
}: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  // Handle difficulty change and auto-fill presets
  const handleDifficultyChange = (difficulty: DifficultyLevel) => {
    const preset = DIFFICULTY_PRESETS[difficulty];
    setFormData({
      ...formData,
      difficulty,
      duration: preset.duration,
      maxDistance: preset.maxRadius,
    });
  };

  // Handle player count change
  const handlePlayerCountChange = (playerCount: number) => {
    // Single player: always AI game master, always player_a role
    // Two player: can choose AI GM (player_a + player_b) or Player GM (player_a + game_master)
    // Three player: always Player GM, all roles available
    
    let gameMasterType: GameMaster;
    let finalRole: GameRole;
    
    if (playerCount === 1) {
      gameMasterType = "ai";
      finalRole = "player_a";
    } else if (playerCount === 2) {
      // Keep current GM type if valid, default to AI
      gameMasterType = formData.gameMasterType;
      // Reset role if switching player counts
      finalRole = "player_a";
    } else {
      // 3 players: always human GM
      gameMasterType = "player";
      finalRole = formData.playerRole === "player_b" ? "player_b" : "player_a";
    }
    
    setFormData({
      ...formData,
      playerCount,
      playerRole: finalRole,
      gameMasterType,
    });
  };
  
  // Handle game master type change (for 2-player games)
  const handleGameMasterTypeChange = (newGmType: GameMaster) => {
    let finalRole = formData.playerRole;
    
    if (formData.playerCount === 2) {
      // If switching to player GM, player_b is not available
      // If current role is player_b and switching to player GM, reset to player_a
      if (newGmType === "player" && formData.playerRole === "player_b") {
        finalRole = "player_a";
      }
      // If switching to AI GM, game_master is not available
      // If current role is game_master and switching to AI GM, reset to player_a
      if (newGmType === "ai" && formData.playerRole === "game_master") {
        finalRole = "player_a";
      }
    }
    
    setFormData({
      ...formData,
      gameMasterType: newGmType,
      playerRole: finalRole,
    });
  };

  const currentPreset = DIFFICULTY_PRESETS[formData.difficulty];
  const isMultiplayer = formData.playerCount > 1;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Difficulty Level */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Difficulty Level
        </label>
        <div className="flex gap-3">
          <label className="flex-1 cursor-pointer">
            <input
              type="radio"
              name="difficulty"
              value="easy"
              checked={formData.difficulty === "easy"}
              onChange={() => handleDifficultyChange("easy")}
              className="sr-only peer"
            />
            <div className="h-auto p-3 flex flex-col items-center justify-center rounded-lg border-2 border-white/10 bg-surface-dark-elevated text-white transition-all peer-checked:border-primary peer-checked:bg-primary/10">
              <Icon name={DIFFICULTY_PRESETS.easy.icon} className="mb-1 text-xl" />
              <span className="font-medium text-sm">Easy</span>
              <span className="text-xs text-gray-400 mt-1 text-center">≤{DIFFICULTY_PRESETS.easy.maxRadius} km • ≤{DIFFICULTY_PRESETS.easy.duration} hours</span>
              <span className="text-[10px] text-gray-500 mt-0.5 text-center">{DIFFICULTY_PRESETS.easy.description}</span>
            </div>
          </label>
          <label className="flex-1 cursor-pointer">
            <input
              type="radio"
              name="difficulty"
              value="medium"
              checked={formData.difficulty === "medium"}
              onChange={() => handleDifficultyChange("medium")}
              className="sr-only peer"
            />
            <div className="h-auto p-3 flex flex-col items-center justify-center rounded-lg border-2 border-white/10 bg-surface-dark-elevated text-white transition-all peer-checked:border-primary peer-checked:bg-primary/10">
              <Icon name={DIFFICULTY_PRESETS.medium.icon} className="mb-1 text-xl" />
              <span className="font-medium text-sm">Medium</span>
              <span className="text-xs text-gray-400 mt-1 text-center">≤{DIFFICULTY_PRESETS.medium.maxRadius} km • ≤{DIFFICULTY_PRESETS.medium.duration} hours</span>
              <span className="text-[10px] text-gray-500 mt-0.5 text-center">{DIFFICULTY_PRESETS.medium.description}</span>
            </div>
          </label>
          <label className="flex-1 cursor-pointer">
            <input
              type="radio"
              name="difficulty"
              value="hard"
              checked={formData.difficulty === "hard"}
              onChange={() => handleDifficultyChange("hard")}
              className="sr-only peer"
            />
            <div className="h-auto p-3 flex flex-col items-center justify-center rounded-lg border-2 border-white/10 bg-surface-dark-elevated text-white transition-all peer-checked:border-primary peer-checked:bg-primary/10">
              <Icon name={DIFFICULTY_PRESETS.hard.icon} className="mb-1 text-xl" />
              <span className="font-medium text-sm">Hard</span>
              <span className="text-xs text-gray-400 mt-1 text-center">≤{DIFFICULTY_PRESETS.hard.maxRadius} km • {DIFFICULTY_PRESETS.hard.durationRange}</span>
              <span className="text-[10px] text-gray-500 mt-0.5 text-center">{DIFFICULTY_PRESETS.hard.description}</span>
            </div>
          </label>
        </div>
      </div>

      {/* Duration */}
      <div>
        <Input
          type="number"
          id="duration"
          label="Game Duration (hours)"
          min="0.25"
          max="24.0"
          step="0.25"
          value={formData.duration}
          onChange={(e) =>
            setFormData({ ...formData, duration: Number(e.target.value) })
          }
          required
        />
        <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
          <Icon name="lightbulb" className="text-primary text-sm" />
          Recommended for {formData.difficulty}: <span className="text-gray-400 font-medium">{currentPreset.durationRange}</span>
        </p>
      </div>

      {/* Max Distance */}
      <div>
        <Input
          type="number"
          id="maxDistance"
          label="Maximum Radius (km)"
          min="0.5"
          max="20"
          step="0.5"
          value={formData.maxDistance}
          onChange={(e) =>
            setFormData({ ...formData, maxDistance: Number(e.target.value) })
          }
          required
        />
        <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
          <Icon name="lightbulb" className="text-primary text-sm" />
          Recommended for {formData.difficulty}: <span className="text-gray-400 font-medium">{currentPreset.distanceRange}</span>
        </p>
      </div>

      {/* Number of Players */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Number of Players
        </label>
        <div className="grid grid-cols-3 gap-3">
          {PLAYER_COUNT_OPTIONS.map((option) => (
            <label key={option.value} className="cursor-pointer">
              <input
                type="radio"
                name="playerCount"
                value={option.value}
                checked={formData.playerCount === option.value}
                onChange={() => handlePlayerCountChange(option.value)}
                className="sr-only peer"
              />
              <div className={cn(
                "h-auto p-3 flex flex-col items-center justify-center rounded-lg border-2 transition-all",
                "border-white/10 bg-surface-dark-elevated text-white",
                "peer-checked:border-primary peer-checked:bg-primary/10",
                "hover:border-white/20"
              )}>
                <Icon name={option.icon} className="mb-1 text-xl text-primary" />
                <span className="font-medium text-sm">{option.label}</span>
                <span className="text-[10px] text-gray-500 mt-0.5 text-center">{option.description}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Game Master (for 2-player games, 3-player is always human) */}
      {formData.playerCount === 2 && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Game Master
          </label>
          <div className="flex gap-4">
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                value="ai"
                checked={formData.gameMasterType === "ai"}
                onChange={() => handleGameMasterTypeChange("ai")}
                className="sr-only peer"
              />
              <div className="h-12 flex items-center justify-center rounded-lg border-2 border-white/10 bg-surface-dark-elevated text-white transition-all peer-checked:border-primary peer-checked:bg-primary/10">
                <Icon name="smart_toy" className="mr-2" />
                <span className="font-medium">AI</span>
              </div>
            </label>
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                value="player"
                checked={formData.gameMasterType === "player"}
                onChange={() => handleGameMasterTypeChange("player")}
                className="sr-only peer"
              />
              <div className="h-12 flex items-center justify-center rounded-lg border-2 border-white/10 bg-surface-dark-elevated text-white transition-all peer-checked:border-primary peer-checked:bg-primary/10">
                <Icon name="person" className="mr-2" />
                <span className="font-medium">Player</span>
              </div>
            </label>
          </div>
          {formData.gameMasterType === "ai" && (
            <p className="mt-2 text-xs text-gray-500">
              Both players can be Seeker and Guide. AI will manage the game.
            </p>
          )}
          {formData.gameMasterType === "player" && (
            <p className="mt-2 text-xs text-gray-500">
              One player is the Game Master, the other is the Seeker. No Guide role.
            </p>
          )}
        </div>
      )}

      {/* 3-player info (always human GM) */}
      {formData.playerCount === 3 && (
        <div className="p-4 rounded-lg bg-surface-dark-elevated border border-white/10">
          <div className="flex items-start gap-3">
            <Icon name="groups" className="text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-gray-300">
              <p className="font-medium text-white mb-1">Full Team Mode</p>
              <p className="text-gray-400">
                All three roles (Seeker, Guide, and Game Master) will be played by humans. No AI assistance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Single Player Info */}
      {formData.playerCount === 1 && (
        <div className="p-4 rounded-lg bg-surface-dark-elevated border border-white/10">
          <div className="flex items-start gap-3">
            <Icon name="smart_toy" className="text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-gray-300">
              <p className="font-medium text-white mb-1">Solo Adventure</p>
              <p className="text-gray-400">
                You&apos;ll play as the Seeker with an AI Game Master guiding you with hints. 
                Find the hidden goal by exploring waypoints and collecting clues!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Your Role (multiplayer only) */}
      {isMultiplayer && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Your Role
          </label>
          <div className="space-y-2">
            {/* Determine which roles to show based on player count and GM type */}
            {/* Uses centralized role validation from lib/game/roles.ts */}
            {(() => {
              const gameMode = formData.playerCount === 2 ? "two_player" : "multi_player";
              const allRoles: RoleType[] = ["player_a", "player_b", "game_master"];
              const rolesToShow = allRoles.filter((role) =>
                isRoleValidForGameMode(role, gameMode, formData.gameMasterType)
              );
              
              return rolesToShow.map((role) => {
                const roleInfo = ROLE_INFO[role];
                
                return (
                  <label key={role} className="block cursor-pointer">
                    <input
                      type="radio"
                      name="playerRole"
                      value={role}
                      checked={formData.playerRole === role}
                      onChange={() => setFormData({ ...formData, playerRole: role })}
                      className="sr-only peer"
                    />
                    <div className={cn(
                      "p-3 rounded-lg border-2 transition-all",
                      "border-white/10 bg-surface-dark-elevated",
                      "peer-checked:border-primary peer-checked:bg-primary/10",
                      "hover:border-white/20"
                    )}>
                      <div className="flex items-center gap-3">
                        <Icon name={roleInfo.icon} className="text-xl text-primary" />
                        <div>
                          <span className="font-medium text-white">{roleInfo.name}</span>
                          <p className="text-xs text-gray-400">{roleInfo.description}</p>
                        </div>
                      </div>
                    </div>
                  </label>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Multiplayer Info */}
      {isMultiplayer && (
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <Icon name="info" className="text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-gray-300">
              <p className="font-medium text-primary mb-1">Multiplayer Game</p>
              <p className="text-gray-400">
                After creating the game, you&apos;ll get a game code to share with your friends. 
                Everyone will meet in the lobby before the game starts.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button type="button" onClick={onBack} variant="ghost">
          <Icon name="arrow_back" size="sm" className="mr-2" />
          Back
        </Button>
        <Button
          type="submit"
          isLoading={pending}
          loadingText="Creating..."
          variant="primary"
        >
          <Icon name="check_circle" size="sm" className="mr-2" />
          Create Game
        </Button>
      </div>
    </form>
  );
}
