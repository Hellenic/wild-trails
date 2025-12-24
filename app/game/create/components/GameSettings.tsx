import React from "react";
import type { GameMaster, GameRole } from "@/types/game";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Icon } from "@/app/components/ui/Icon";

type GameSettingsFormData = {
  duration: number;
  playerCount: number;
  gameMasterType: GameMaster;
  playerRole: GameRole;
  maxDistance: number;
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
      </div>

      <div>
        <Input
          type="number"
          id="maxDistance"
          label="Maximum Distance (km)"
          min="1"
          max="500"
          step="1"
          value={formData.maxDistance}
          onChange={(e) =>
            setFormData({ ...formData, maxDistance: Number(e.target.value) })
          }
          required
        />
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
          <Icon name="arrow_back" className="mr-2 text-lg" />
          Back
        </Button>
        <Button type="submit" disabled={pending} variant="primary">
          {pending ? (
            <>
              <Icon name="progress_activity" className="mr-2 text-lg animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Icon name="check_circle" className="mr-2 text-lg" />
              Create Game
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
