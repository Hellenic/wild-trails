import React from "react";
import type { GameMaster, GameRole } from "@/types/game";

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

  const inputClassName =
    "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md \
    focus:outline-none focus:ring-2 focus:ring-forest-moss focus:border-transparent \
    bg-white dark:bg-forest-mist dark:text-forest-pine";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="duration"
          className="block text-sm font-medium text-gray-700"
        >
          Game Duration (hours)
        </label>
        <input
          type="number"
          id="duration"
          min="0.25"
          max="24.0"
          step="0.25"
          value={formData.duration}
          onChange={(e) =>
            setFormData({ ...formData, duration: Number(e.target.value) })
          }
          className={inputClassName}
          required
        />
      </div>

      <div>
        <label
          htmlFor="maxDistance"
          className="block text-sm font-medium text-gray-700"
        >
          Maximum Distance (km)
        </label>
        <input
          type="number"
          id="maxDistance"
          min="1"
          max="500"
          step="1"
          value={formData.maxDistance}
          onChange={(e) =>
            setFormData({ ...formData, maxDistance: Number(e.target.value) })
          }
          className={inputClassName}
          required
        />
      </div>

      <div>
        <label
          htmlFor="playerCount"
          className="block text-sm font-medium text-gray-700"
        >
          Number of Players
        </label>
        <select
          id="playerCount"
          value={formData.playerCount}
          onChange={(e) =>
            setFormData({ ...formData, playerCount: Number(e.target.value) })
          }
          className={inputClassName}
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
        <label className="block text-sm font-medium text-gray-700">
          Game Master
        </label>
        <div className="mt-2 space-x-4">
          <label className="inline-flex items-center">
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
              className="form-radio text-forest-moss focus:ring-forest-moss dark:bg-forest-mist"
            />
            <span className="ml-2 text-gray-700">AI</span>
          </label>
          <label className="inline-flex items-center">
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
              className="form-radio text-forest-moss focus:ring-forest-moss dark:bg-forest-mist"
            />
            <span className="ml-2 text-gray-700">Player</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Your Role
        </label>
        <select
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
          className={inputClassName}
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

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 rounded-md bg-white 
            dark:bg-forest-mist dark:text-forest-pine dark:border-forest-pine
            hover:bg-gray-50 dark:hover:bg-forest-mist/90 transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={pending}
          className={`bg-forest-pine text-forest-mist px-4 py-2 rounded-md 
            hover:bg-forest-moss transition-colors
            ${pending ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {pending ? "Creating..." : "Create Game"}
        </button>
      </div>
    </form>
  );
}
