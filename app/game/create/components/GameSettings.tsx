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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
              className="form-radio"
            />
            <span className="ml-2">AI</span>
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
              className="form-radio"
            />
            <span className="ml-2">Player</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Your Role
        </label>
        <select
          value={formData.playerRole}
          onChange={(e) =>
            setFormData({
              ...formData,
              playerRole: e.target.value as
                | "player_a"
                | "player_b"
                | "game_master",
            })
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
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
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={pending}
          className="bg-forest-pine text-forest-mist px-4 py-2 rounded-md hover:bg-forest-moss"
        >
          {pending ? "Creating..." : "Create Game"}
        </button>
      </div>
    </form>
  );
}
