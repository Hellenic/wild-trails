import React from "react";
import type { GameMaster, GameRole } from "@/types/game";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Icon } from "@/app/components/ui/Icon";
import { DIFFICULTY_PRESETS, type DifficultyLevel } from "@/lib/game/difficulty-presets";

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

  const currentPreset = DIFFICULTY_PRESETS[formData.difficulty];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <div>
        <label
          htmlFor="playerCount"
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          Number of Players
        </label>
        <select
          id="playerCount"
          value={formData.playerCount}
          onChange={(e) =>
            setFormData({ ...formData, playerCount: Number(e.target.value) })
          }
          className="w-full h-12 rounded-lg border bg-surface-dark-elevated text-white placeholder:text-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent border-white/10 px-4"
        >
          <option value={1}>Single Player</option>
          <option value={2} disabled>
            Two Players
          </option>
          <option value={3} disabled>
            Three Players
          </option>
        </select>
      </div>

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
              onChange={(e) =>
                setFormData({
                  ...formData,
                  gameMasterType: e.target.value as "player" | "ai",
                })
              }
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
              onChange={(e) =>
                setFormData({
                  ...formData,
                  gameMasterType: e.target.value as "player" | "ai",
                })
              }
              className="sr-only peer"
            />
            <div className="h-12 flex items-center justify-center rounded-lg border-2 border-white/10 bg-surface-dark-elevated text-white transition-all peer-checked:border-primary peer-checked:bg-primary/10">
              <Icon name="person" className="mr-2" />
              <span className="font-medium">Player</span>
            </div>
          </label>
        </div>
      </div>

      <div>
        <label
          htmlFor="playerRole"
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          Your Role
        </label>
        <select
          id="playerRole"
          value={formData.playerRole || "none"}
          onChange={(e) =>
            setFormData({
              ...formData,
              playerRole:
                e.target.value === "none"
                  ? null
                  : (e.target.value as "player_a" | "player_b" | "game_master"),
            })
          }
          className="w-full h-12 rounded-lg border bg-surface-dark-elevated text-white placeholder:text-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent border-white/10 px-4"
        >
          <option value="none">None</option>
          <option value="player_a">Player A (Starting Point)</option>
          <option value="player_b" disabled>
            Player B (Command Center)
          </option>
          {formData.gameMasterType === "player" && (
            <option value="game_master">Game Master</option>
          )}
        </select>
      </div>

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
