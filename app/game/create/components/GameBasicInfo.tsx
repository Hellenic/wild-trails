import React from "react";

type GameBasicInfoFormData = {
  name: string;
  password: string;
};

type Props = {
  formData: GameBasicInfoFormData;
  setFormData: (data: GameBasicInfoFormData) => void;
  onNext: () => void;
};

export function GameBasicInfo({ formData, setFormData, onNext }: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="gameName"
          className="block text-sm font-medium text-gray-700"
        >
          Game Name
        </label>
        <input
          type="text"
          id="gameName"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Game Password
        </label>
        <input
          type="text"
          id="password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
        <p className="mt-1 text-sm text-gray-500">
          Other players will need this password to join the game
        </p>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="bg-forest-pine text-forest-mist px-4 py-2 rounded-md hover:bg-forest-moss"
        >
          Next
        </button>
      </div>
    </form>
  );
}
